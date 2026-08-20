import React, { useState, useCallback, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, XCircle, Info, RefreshCw, FileDown } from 'lucide-react';
import { getMedicationStatusByCNs, findAlternatives } from '../../services/blistercheckService';

/**
 * Extrae el valor primitivo de una celda ExcelJS.
 */
function getCellValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') {
    if (Array.isArray(val.richText)) return val.richText.map(r => r.text).join('');
    if (typeof val.text === 'string') return val.text;
    if (val instanceof Date) return val;
  }
  return val;
}

/**
 * Lee un archivo .xlsx o .csv y devuelve un array de arrays.
 */
async function parseSpreadsheet(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const text = await file.text();
    const firstLine = text.split('\n')[0] || '';
    const sep = (firstLine.split(';').length >= firstLine.split(',').length) ? ';' : ',';
    return text
      .split('\n')
      .filter(line => line.trim())
      .map(line =>
        line.split(sep).map(cell =>
          cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
        )
      );
  }

  const data = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const worksheet = workbook.worksheets[0];
  const json = [];
  worksheet.eachRow(row => {
    json.push(row.values.slice(1).map(getCellValue));
  });
  return json;
}

const createPieChartBase64 = (data, title) => {
  const canvas = document.createElement('canvas');
  // Aumentar resolución para evitar cortes de texto
  canvas.width = 650;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;
  
  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = 150;
  const cy = 150;
  const r = 110;
  
  let startAngle = -Math.PI / 2;
  
  // Draw slices
  data.forEach(d => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    if (sliceAngle === 0) return;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    
    ctx.fillStyle = d.color;
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    startAngle += sliceAngle;
  });
  
  // Draw Legend
  let legendY = 70;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#333333';
  ctx.fillText(title, 310, 40);
  
  ctx.font = '16px sans-serif';
  data.forEach(d => {
    if(d.value === 0) return;
    const pct = ((d.value / total) * 100).toFixed(1);
    
    // color box
    ctx.fillStyle = d.color;
    ctx.fillRect(310, legendY, 18, 18);
    
    // text
    ctx.fillStyle = '#555555';
    ctx.fillText(`${d.label}: ${d.value} (${pct}%)`, 340, legendY + 14);
    
    legendY += 30;
  });
  
  return canvas.toDataURL('image/png');
};

export default function GuiaOptimizer() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [soloConAlternativas, setSoloConAlternativas] = useState(false);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setReport(null);
      setError(null);
    }
  };

  const cleanCN = (cnStr) => {
    if (!cnStr) return null;
    const match = String(cnStr).match(/\d{6,7}/);
    return match ? match[0] : null;
  };

  const processExcel = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Validación de seguridad (Magic Bytes)
      const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
      if (isXlsx) {
        const buffer = await file.slice(0, 4).arrayBuffer();
        const view = new Uint8Array(buffer);
        const headerHex = Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        if (headerHex !== '504B0304') {
          throw new Error('El archivo ha sido modificado o no es un documento de Excel (.xlsx) válido.');
        }
      }

      const json = await parseSpreadsheet(file);

      if (json.length === 0) throw new Error('El archivo está vacío');

      // 1. Encontrar la columna del CN
      const headers = json[0].map(h => String(h).toUpperCase().trim());
      const cnColumnIndex = headers.findIndex(h => h.startsWith('CN') || h.includes('CÓDIGO NACIONAL') || h.includes('CODIGO NACIONAL'));

      if (cnColumnIndex === -1) {
        throw new Error('No se ha encontrado ninguna columna que empiece por "CN" o "Código Nacional".');
      }

      // 2. Extraer CNs
      const cnList = [];
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        if (row && row[cnColumnIndex]) {
          const cn = cleanCN(row[cnColumnIndex]);
          if (cn) cnList.push(cn);
        }
      }

      if (cnList.length === 0) throw new Error('No se encontraron Códigos Nacionales válidos en la columna.');

      // Eliminar duplicados para analizar solo medicamentos únicos
      const uniqueCnList = [...new Set(cnList)];

      // 3. Consultar Base de Datos
      const dbMeds = await getMedicationStatusByCNs(uniqueCnList);
      
      const results = {
        totalProcesados: uniqueCnList.length,
        totalAnalizados: 0,
        optimos: [],
        problematicos: [],
        desconocidos: [],
        noOrales: [],
        noEncontrados: [],
        score: 0
      };

      // 4. Analizar estado y buscar alternativas
      for (const cn of uniqueCnList) {
        const med = dbMeds.find(m => m.cn === cn);
        if (!med) {
          results.noEncontrados.push({ cn });
          continue;
        }

        // Filtro estricto: Solo analizar vías orales, sublinguales y bucales
        const viaAdmin = med.via_administracion ? med.via_administracion.toUpperCase() : '';
        if (!viaAdmin.includes('ORAL') && !viaAdmin.includes('SUBLINGUAL') && !viaAdmin.includes('BUCAL')) {
          results.noOrales.push(med);
          continue;
        }

        const clasificacion = med.blistercheck_clasificacion;

        if (!clasificacion || (clasificacion.apto_sdmdu_blister === null && clasificacion.requiere_reenvasado === null && clasificacion.requiere_reetiquetado === null)) {
          // No está clasificado aún por el usuario, asumimos desconocido/neutro
          results.desconocidos.push({ cn, nombre: med.nombre });
          continue;
        }

        const requiereReenvasado = clasificacion.requiere_reenvasado === true;
        const requiereReetiquetado = clasificacion.requiere_reetiquetado === true;

        if (requiereReenvasado || requiereReetiquetado) {
          // Problema detectado, buscar alternativas
          const alternativas = await findAlternatives(med.principio_activo, med.dosis, med.forma_simplificada);
          results.problematicos.push({
            med,
            clasificacion,
            alternativas
          });
        } else {
          // Óptimo
          results.optimos.push(med);
        }
      }

      // 5. Calcular puntuación (basada solo en los medicamentos que tienen datos de clasificación)
      results.totalAnalizados = results.optimos.length + results.problematicos.length + results.desconocidos.length;
      
      const totalClasificados = results.optimos.length + results.problematicos.length;
      if (totalClasificados > 0) {
        results.score = Math.round((results.optimos.length / totalClasificados) * 100);
      } else {
        results.score = 0;
      }

      setReport(results);
    } catch (err) {
      setError('Error procesando el archivo: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderScore = (score) => {
    let colorClass = 'score-red';
    if (score >= 80) colorClass = 'score-green';
    else if (score >= 50) colorClass = 'score-orange';

    return (
      <div className={`optimizer-score ${colorClass}`}>
        <div className="score-value">{score}%</div>
        <div className="score-label">Adaptación SDMDU</div>
      </div>
    );
  };

  const chartImages = useMemo(() => {
    if (!report) return { chart1Img: null, chart2Img: null };

    const dataConocidos = [
      { label: 'Conocidos (Clasificados)', value: report.optimos.length + report.problematicos.length, color: '#0d9488' },
      { label: 'Desconocidos', value: report.desconocidos.length, color: '#cbd5e1' }
    ];
    
    const reenvasablesCount = report.problematicos.filter(p => p.clasificacion.requiere_reenvasado && !p.clasificacion.requiere_reetiquetado).length;
    const reetiquetablesCount = report.problematicos.filter(p => p.clasificacion.requiere_reetiquetado && !p.clasificacion.requiere_reenvasado).length;
    const ambosCount = report.problematicos.filter(p => p.clasificacion.requiere_reenvasado && p.clasificacion.requiere_reetiquetado).length;

    const dataClasificacion = [
      { label: 'Aptos SDMDU', value: report.optimos.length, color: '#10b981' },
      { label: 'Solo Reenvasar', value: reenvasablesCount, color: '#f59e0b' },
      { label: 'Solo Reetiquetar', value: reetiquetablesCount, color: '#8b5cf6' },
      { label: 'Ambos', value: ambosCount, color: '#ef4444' }
    ];

    return {
      chart1Img: createPieChartBase64(dataConocidos, 'Estado en el Catálogo'),
      chart2Img: createPieChartBase64(dataClasificacion, 'Clasificación de Conocidos')
    };
  }, [report]);

  const generatePDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // Título
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text('Informe de Optimización de Guía Farmacoterapéutica', 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha: ${date}`, 14, 28);
    doc.text(`Medicamentos Orales Analizados: ${report.totalAnalizados}`, 14, 34);
    doc.text(`Puntuación de Adaptación a SDMDU: ${report.score}%`, 14, 40);

    // Resumen de números
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Resumen del Análisis', 14, 52);
    
    doc.setFontSize(11);
    doc.text(`- Óptimos (Listos para blíster): ${report.optimos.length}`, 14, 60);
    doc.text(`- Oportunidades de Mejora (Requieren reenvasado/reetiquetado): ${report.problematicos.length}`, 14, 66);
    doc.text(`- Sin Clasificar en la base de datos: ${report.desconocidos.length}`, 14, 72);
    doc.text(`- Omitidos (No orales/sublinguales/bucales): ${report.noOrales.length}`, 14, 78);
    doc.text(`- Ignorados (No existen en el catálogo general): ${report.noEncontrados.length}`, 14, 84);

    // Gráficos lado a lado
    if (chartImages.chart1Img && chartImages.chart2Img) {
      // Dimensiones para mantener el ratio 650x300 (2.166)
      // Ancho: 90, Alto: 41.5
      doc.addImage(chartImages.chart1Img, 'PNG', 14, 95, 90, 41.5);
      doc.addImage(chartImages.chart2Img, 'PNG', 106, 95, 90, 41.5);
    } else {
      if (chartImages.chart1Img) doc.addImage(chartImages.chart1Img, 'PNG', 14, 95, 150, 69.2);
      if (chartImages.chart2Img) doc.addImage(chartImages.chart2Img, 'PNG', 14, 170, 150, 69.2);
    }

    if (report.problematicos.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(231, 76, 60);
      doc.text('Medicamentos a Mejorar y Alternativas Sugeridas', 14, 20);

      const tableData = [];
      
      report.problematicos.forEach(item => {
        const medName = item.med.nombre;
        const medCN = item.med.cn;
        const issues = [];
        if (item.clasificacion.requiere_reenvasado) issues.push('Reenvasado');
        if (item.clasificacion.requiere_reetiquetado) issues.push('Reetiquetado');
        
        let alternativesText = 'Sin alternativas óptimas';
        if (item.alternativas.length > 0) {
          alternativesText = item.alternativas.map(alt => `${alt.nombre} (CN: ${alt.cn})`).join('\n');
        }

        tableData.push([
          `${medName}\nCN: ${medCN}`,
          issues.join(', '),
          alternativesText
        ]);
      });

      autoTable(doc, {
        startY: 28,
        head: [['Medicamento Original', 'Problema', 'Alternativas Sugeridas']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 'auto' }
        }
      });
    }

    doc.save(`optimizacion_guia_${date.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="bc-optimizer">
      <div className="optimizer-header">
        <h2>Optimizador de Guía Farmacoterapéutica</h2>
        <p>Sube tu guía en formato Excel (.xlsx) para analizar qué medicamentos requieren reenvasado o reetiquetado, y descubre alternativas óptimas para el SPD.</p>
      </div>

      {!report && (
        <div className="optimizer-upload-zone glass-panel">
          <UploadCloud size={48} className="upload-icon" />
          <h3>Sube tu Guía (Excel)</h3>
          <p>Asegúrate de que haya una columna llamada "CN" o "Código Nacional".</p>
          
          <input 
            type="file" 
            id="excel-upload" 
            accept=".xlsx, .csv" 
            onChange={handleFileUpload} 
            className="file-input-hidden"
          />
          <label htmlFor="excel-upload" className="bc-btn-primary upload-btn">
            Seleccionar Archivo
          </label>
          {file && <div className="selected-file"><FileText size={16}/> {file.name}</div>}

          {file && (
            <button 
              className="bc-btn-secondary mt-15" 
              onClick={processExcel}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><RefreshCw size={16} className="spin" /> Analizando y Buscando Alternativas...</>
              ) : (
                'Procesar Guía'
              )}
            </button>
          )}
          {error && <div className="optimizer-error">{error}</div>}
        </div>
      )}

      {report && (
        <div className="optimizer-report">
          <div className="report-summary glass-panel">
            {renderScore(report.score)}
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Orales Analizados</span>
                <span className="stat-value">{report.totalAnalizados}</span>
              </div>
              <div className="stat-item success">
                <span className="stat-label">Óptimos</span>
                <span className="stat-value">{report.optimos.length}</span>
              </div>
              <div className="stat-item danger">
                <span className="stat-label">A Mejorar</span>
                <span className="stat-value">{report.problematicos.length}</span>
              </div>
              <div className="stat-item neutral">
                <span className="stat-label">Sin Clasificar</span>
                <span className="stat-value">{report.desconocidos.length}</span>
              </div>
              <div className="stat-item neutral" style={{ opacity: 0.7 }}>
                <span className="stat-label">Omitidos (No Orales)</span>
                <span className="stat-value">{report.noOrales.length}</span>
              </div>
              <div className="stat-item neutral" style={{ opacity: 0.5, borderLeft: '4px solid #f87171' }}>
                <span className="stat-label">No Encontrados</span>
                <span className="stat-value">{report.noEncontrados?.length || 0}</span>
              </div>
            </div>

            {/* Renderizar los gráficos generados */}
            {(chartImages.chart1Img || chartImages.chart2Img) && (
              <div style={{ display: 'flex', gap: '20px', marginTop: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {chartImages.chart1Img && (
                  <img src={chartImages.chart1Img} alt="Gráfico de Conocidos vs Desconocidos" style={{ width: '100%', maxWidth: '420px', height: 'auto', border: '1px solid #eef2f5', borderRadius: '8px' }} />
                )}
                {chartImages.chart2Img && (
                  <img src={chartImages.chart2Img} alt="Gráfico de Clasificación de Conocidos" style={{ width: '100%', maxWidth: '420px', height: 'auto', border: '1px solid #eef2f5', borderRadius: '8px' }} />
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button className="bc-btn-secondary" onClick={() => { setFile(null); setReport(null); }}>
                Subir otra guía
              </button>
              <button className="bc-btn-primary" onClick={generatePDF} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileDown size={18} /> Generar Informe PDF
              </button>
            </div>
          </div>

          <div className="report-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}><AlertTriangle size={20} className="text-orange" /> Oportunidades de Mejora ({report.problematicos.length})</h3>
                <p className="subtitle" style={{ margin: '0.5rem 0 0' }}>Estos medicamentos de tu guía requieren reenvasado o reetiquetado.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', background: 'var(--color-bg-glass)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
                <input 
                  type="checkbox" 
                  checked={soloConAlternativas} 
                  onChange={(e) => setSoloConAlternativas(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Solo mostrar con alternativas aptas
              </label>
            </div>
            
            {report.problematicos.length === 0 ? (
              <div className="empty-state glass-panel">¡Excelente! Ningún medicamento clasificado requiere reenvasado.</div>
            ) : (
              <div className="problematic-list">
                {report.problematicos
                  .filter(item => !soloConAlternativas || item.alternativas.length > 0)
                  .map((item, idx) => (
                  <div key={idx} className="problematic-card glass-panel">
                    <div className="med-original">
                      <div className="med-header">
                        <XCircle size={18} className="text-red" />
                        <strong>{item.med.nombre}</strong>
                      </div>
                      <div className="med-meta">
                        <span>CN: {item.med.cn}</span>
                        <span>{item.med.principio_activo} | {item.med.dosis}</span>
                      </div>
                      <div className="med-issues">
                        {item.clasificacion.requiere_reenvasado && <span className="badge-issue">Requiere Reenvasado</span>}
                        {item.clasificacion.requiere_reetiquetado && <span className="badge-issue">Requiere Reetiquetado</span>}
                      </div>
                    </div>
                    
                    <div className="med-alternatives">
                      <h4>Alternativas Sugeridas (Listas para Blíster)</h4>
                      {item.alternativas.length > 0 ? (
                        <ul className="alt-list">
                          {item.alternativas.map(alt => (
                            <li key={alt.nregistro} className="alt-item">
                              <CheckCircle size={16} className="text-green" />
                              <span className="alt-nombre">{alt.nombre}</span>
                              <span className="alt-cn">(CN: {alt.cn})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="no-alternatives">
                          <Info size={16} /> No se han encontrado alternativas clasificadas como óptimas para este principio activo y dosis en la base de datos actual.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
