import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, XCircle, Info, RefreshCw } from 'lucide-react';
import { getMedicationStatusByCNs, findAlternatives } from '../../services/blistercheckService';

export default function GuiaOptimizer() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

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

      // 3. Consultar Base de Datos
      const dbMeds = await getMedicationStatusByCNs(cnList);
      
      const results = {
        totalProcesados: cnList.length,
        totalAnalizados: 0,
        optimos: [],
        problematicos: [],
        desconocidos: [],
        noOrales: [],
        score: 0
      };

      // 4. Analizar estado y buscar alternativas
      for (const cn of cnList) {
        const med = dbMeds.find(m => m.cn === cn);
        if (!med) {
          results.desconocidos.push({ cn });
          continue;
        }

        // Filtro estricto: Solo analizar vías orales, sublinguales y bucales
        const viaAdmin = med.via_administracion ? med.via_administracion.toUpperCase() : '';
        if (!viaAdmin.includes('ORAL') && !viaAdmin.includes('SUBLINGUAL') && !viaAdmin.includes('BUCAL')) {
          results.noOrales.push(med);
          continue;
        }

        const clasificacion = med.blistercheck_clasificacion && med.blistercheck_clasificacion.length > 0 
          ? med.blistercheck_clasificacion[0] 
          : null;

        if (!clasificacion) {
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

      // 5. Calcular puntuación (basada solo en los analizados - orales)
      results.totalAnalizados = results.optimos.length + results.problematicos.length + results.desconocidos.length;
      if (results.totalAnalizados > 0) {
        results.score = Math.round((results.optimos.length / results.totalAnalizados) * 100);
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
            accept=".xlsx, .xls" 
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
            </div>
            <button className="bc-btn-secondary" onClick={() => { setFile(null); setReport(null); }}>
              Subir otra guía
            </button>
          </div>

          <div className="report-details">
            <h3><AlertTriangle size={20} className="text-orange" /> Oportunidades de Mejora ({report.problematicos.length})</h3>
            <p className="subtitle">Estos medicamentos de tu guía requieren reenvasado o reetiquetado. Te sugerimos alternativas viables.</p>
            
            {report.problematicos.length === 0 ? (
              <div className="empty-state glass-panel">¡Excelente! Ningún medicamento clasificado requiere reenvasado.</div>
            ) : (
              <div className="problematic-list">
                {report.problematicos.map((item, idx) => (
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
