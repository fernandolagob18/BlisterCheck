import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { getExistingCatalogCNs, bulkMarkEnMiFarmacia } from '../../services/blistercheckService';
import { parseSpreadsheet } from '../../utils/excelUtils';

export default function BlisterCheckUploadMeds({ onClose, onUploadComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setMatchDetails(null);

    try {
        // 0. Validación de tamaño (máximo 10 MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('El archivo es demasiado grande. El tamaño máximo permitido es 10 MB.');
        }

        // 1. Validación de seguridad (Magic Bytes)
        // Evita que un ejecutable renombrado a .xlsx engañe al parser
        const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
        if (isXlsx) {
          const buffer = await file.slice(0, 4).arrayBuffer();
          const view = new Uint8Array(buffer);
          const headerHex = Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
          // 504B0304 es la firma de los archivos ZIP (formato base de .xlsx)
          if (headerHex !== '504B0304') {
            throw new Error('El archivo ha sido modificado o no es un documento de Excel (.xlsx) válido.');
          }
        }

        // Obtener datos como array de arrays para buscar la columna CN flexiblemente
        const json = await parseSpreadsheet(file);
        if (!json || json.length < 2) {
          throw new Error('El archivo parece estar vacío o no tiene el formato correcto.');
        }

        const headers = json[0].map(h => String(h ?? '').toLowerCase().trim());
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

        const uniqueCns = [...new Set(extractedCns)];

        // Buscar coincidencias
        const matchingCNs = await getExistingCatalogCNs(uniqueCns);
        
        setMatchDetails({
          totalExtracted: uniqueCns.length,
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
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Formatos soportados: .xlsx, .csv</p>
                  <input 
                    type="file" 
                    accept=".xlsx, .csv" 
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
                    Se han encontrado <strong>{matchDetails.total} fármacos</strong> en nuestro catálogo a partir de los {matchDetails.totalExtracted} códigos únicos extraídos de su archivo.
                  </p>
                  
                  {matchDetails.totalExtracted > matchDetails.total && (
                    <div style={{ background: 'var(--pastel-amber-bg, #fef3c7)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--pastel-amber-text, #78350f)', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }}/>
                      <span>Hay <strong>{matchDetails.totalExtracted - matchDetails.total} códigos</strong> en su archivo que no existen en la base de datos general de BlisterCheck (pueden ser códigos internos, productos sanitarios u otros). Se han ignorado.</span>
                    </div>
                  )}
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
