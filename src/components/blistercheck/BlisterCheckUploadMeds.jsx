import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getExistingCatalogCNs, bulkMarkEnMiFarmacia } from '../../services/blistercheckService';

export default function BlisterCheckUploadMeds({ onClose, onUploadComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setMatchDetails(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Obtener datos como array de arrays para buscar la columna CN flexiblemente
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!json || json.length < 2) {
          throw new Error('El archivo parece estar vacío o no tiene el formato correcto.');
        }

        const headers = json[0].map(h => String(h).toLowerCase().trim());
        const cnIndex = headers.findIndex(h => 
          h === 'cn' || h === 'código nacional' || h === 'codigo nacional'
        );

        if (cnIndex === -1) {
          throw new Error('No se encontró la columna "CN" o "Código Nacional".');
        }

        const extractedCns = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (row && row[cnIndex]) {
            const rawValue = String(row[cnIndex]);
            const match = rawValue.match(/\d{6,7}/);
            if (match) {
              extractedCns.push(match[0]);
            }
          }
        }

        if (extractedCns.length === 0) {
          throw new Error('No se encontraron Códigos Nacionales en la columna.');
        }

        // Buscar coincidencias
        const matchingCNs = await getExistingCatalogCNs(extractedCns);
        
        setMatchDetails({
          total: matchingCNs.length,
          matchingCNs: matchingCNs
        });

      } catch (err) {
        console.error('Error procesando archivo:', err);
        setError(err.message || 'Error procesando el archivo.');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error leyendo el archivo.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = async () => {
    if (!matchDetails || matchDetails.matchingCNs.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await bulkMarkEnMiFarmacia(matchDetails.matchingCNs);
      setSuccess(true);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      console.error('Error marcando medicamentos:', err);
      setError('Error al actualizar la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bc-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bc-modal glass-panel">
        <div className="bc-modal-header">
          <div className="bc-modal-title">
            <Upload size={20} />
            <h3>Subir mis medicamentos</h3>
          </div>
          <button className="bc-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="bc-modal-body">
          {success ? (
            <div className="bc-export-success" style={{ textAlign: 'center', padding: '2rem' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
              <h4 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>¡Medicamentos actualizados!</h4>
              <p style={{ color: 'var(--color-text-muted)' }}>Se han marcado correctamente {matchDetails?.total} fármacos como disponibles en tu farmacia.</p>
              <button className="bc-btn bc-btn--primary" onClick={onClose} style={{ marginTop: '1.5rem', width: '100%' }}>
                Aceptar y Cerrar
              </button>
            </div>
          ) : (
            <>
              <p className="bc-modal-desc">
                Sube un archivo Excel (.xlsx) o CSV que contenga una columna llamada <strong>"CN"</strong> o <strong>"Código Nacional"</strong>. 
                Se buscarán las coincidencias con el catálogo para marcarlos automáticamente como "En mi farmacia".
              </p>

              {!matchDetails && !loading && (
                <div className="bc-upload-zone" style={{ border: '2px dashed var(--color-border)', borderRadius: '8px', padding: '2.5rem 1rem', textAlign: 'center', background: 'var(--color-surface-hover)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                  <FileSpreadsheet size={40} style={{ color: 'var(--color-primary)', marginBottom: '1rem', opacity: 0.8 }} />
                  <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>Arrastra tu archivo aquí o haz clic para subir</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Formatos soportados: .xlsx, .xls, .csv</p>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              )}

              {loading && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div className="bc-mini-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
                  <p style={{ color: 'var(--color-text-muted)' }}>Procesando archivo y buscando coincidencias...</p>
                </div>
              )}

              {error && (
                <div className="bc-error" style={{ marginTop: '1rem' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {matchDetails && !loading && !success && (
                <div style={{ marginTop: '1.5rem', background: 'var(--pastel-blue-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-primary-light)' }}>
                  <h4 style={{ margin: '0 0 0.75rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} /> Resultado del análisis
                  </h4>
                  <p style={{ margin: '0 0 1rem', color: 'var(--color-text-body)', lineHeight: 1.5 }}>
                    Se han encontrado <strong>{matchDetails.total} fármacos</strong> de su guía farmacológica en el catálogo.
                  </p>
                  <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-body)', fontWeight: 600 }}>
                    ¿Desea indicar que dispone de esa medicación en su farmacia hospitalaria?
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button className="bc-btn-secondary" onClick={() => { setMatchDetails(null); setError(null); }}>
                      No, cancelar
                    </button>
                    <button className="bc-btn-primary" onClick={handleConfirm}>
                      Sí, marcar todos
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
