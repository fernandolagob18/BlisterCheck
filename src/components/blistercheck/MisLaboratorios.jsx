import { useState, useEffect, useRef } from 'react';
import { getMisLaboratoriosData, savePedidoMinimo } from '../../services/blistercheckService';
import MedicamentoCard from './MedicamentoCard';
import { Building2, Save, ChevronLeft, ArrowLeft, Percent, Search } from 'lucide-react';

function MisLaboratorios({ onSelectMedicamento }) {
  const [laboratorios, setLaboratorios] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 120;
  
  // Paginación para medicamentos dentro de un laboratorio
  const [medPaginaActual, setMedPaginaActual] = useState(1);
  const MEDS_POR_PAGINA = 20;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resetear paginación al buscar
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto]);
  
  // Estado para la vista de detalle
  const [labSeleccionado, setLabSeleccionado] = useState(null);
  const [pedidoMinimoInput, setPedidoMinimoInput] = useState('');
  const [guardandoPedido, setGuardandoPedido] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getMisLaboratoriosData();
      setLaboratorios(data);
    } catch (err) {
      console.error('Error al cargar laboratorios:', err);
      setError('No se pudieron cargar los laboratorios.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (lab) => {
    setLabSeleccionado(lab);
    setPedidoMinimoInput(lab.pedido_minimo?.toString() || '0');
    setMedPaginaActual(1);
  };

  const handleVolver = () => {
    setLabSeleccionado(null);
  };

  const handleGuardarPedido = async () => {
    if (!labSeleccionado) return;
    setGuardandoPedido(true);
    try {
      const nuevoValor = parseFloat(pedidoMinimoInput) || 0;
      await savePedidoMinimo(labSeleccionado.laboratorio, nuevoValor);
      
      // Actualizar el estado local
      setLaboratorios(prev => prev.map(l => 
        l.laboratorio === labSeleccionado.laboratorio 
          ? { ...l, pedido_minimo: nuevoValor } 
          : l
      ));
      
      setLabSeleccionado(prev => ({ ...prev, pedido_minimo: nuevoValor }));
    } catch (err) {
      console.error('Error al guardar pedido mínimo:', err);
      alert('Hubo un error al guardar el pedido mínimo.');
    } finally {
      setGuardandoPedido(false);
    }
  };

  const getColorClass = (pedidoMinimo) => {
    const val = parseFloat(pedidoMinimo) || 0;
    if (val === 0) return 'pedido-zero';
    if (val > 0 && val < 50) return 'pedido-low';
    if (val >= 50 && val < 150) return 'pedido-medium';
    return 'pedido-high';
  };

  if (loading) {
    return (
      <div className="bc-laboratorios-container loading">
        <div className="bc-spinner"></div>
        <p>Cargando laboratorios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bc-laboratorios-container error">
        <p>{error}</p>
        <button className="bc-btn bc-btn--primary" onClick={cargarDatos}>Reintentar</button>
      </div>
    );
  }

  if (labSeleccionado) {
    return (
      <div className="bc-laboratorios-detalle">
        <div className="bc-laboratorios-detalle__header">
          <button className="bc-detalle-back" onClick={handleVolver}>
            <ArrowLeft size={16} /> Volver a laboratorios
          </button>
        </div>

        <div className={`bc-lab-hero glass-panel bc-lab-hero--${getColorClass(labSeleccionado.pedido_minimo)}`}>
          <div className="bc-lab-hero__content">
            <h2 className="bc-lab-hero__title">
              <Building2 size={28} style={{ color: 'var(--color-primary)' }} />
              {labSeleccionado.laboratorio}
            </h2>
            
            <div className="bc-lab-hero__badges">
              <span className="bc-badge bc-badge--blue" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                <Percent size={14} style={{ marginRight: '4px' }} />
                {labSeleccionado.porcentaje_sdmdu}% Aptos SDMDU
              </span>
              <span className="bc-badge" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '6px 12px' }}>
                {labSeleccionado.aptos_sdmdu} de {labSeleccionado.total} productos
              </span>
            </div>
          </div>

          <div className="bc-lab-hero__actions">
            <label className="bc-lab-hero__label">Pedido Mínimo (€)</label>
            <div className="bc-pedido-input-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="number" 
                className="bc-filtro-input"
                value={pedidoMinimoInput}
                onChange={(e) => setPedidoMinimoInput(e.target.value)}
                min="0"
                step="0.01"
                placeholder="Ej. 150"
              />
              <button 
                className={`bc-guardar-btn ${guardandoPedido ? 'saved' : ''}`}
                onClick={handleGuardarPedido}
                disabled={guardandoPedido}
                style={{ padding: '0 16px', borderRadius: 'var(--radius-md)', height: '40px', flexShrink: 0, width: 'auto' }}
              >
                <Save size={16} /> {guardandoPedido ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>

        {(() => {
          const totalMedPaginas = Math.ceil(labSeleccionado.medicamentos.length / MEDS_POR_PAGINA);
          const medsPaginados = labSeleccionado.medicamentos.slice(
            (medPaginaActual - 1) * MEDS_POR_PAGINA,
            medPaginaActual * MEDS_POR_PAGINA
          );

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '2.5rem' }}>
                <h3 className="bc-section-subtitle" style={{ margin: 0 }}>
                  Medicamentos en mi farmacia ({labSeleccionado.total})
                </h3>
                {totalMedPaginas > 1 && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="bc-btn-secondary" style={{ padding: '4px 12px', fontSize: '0.9rem' }} disabled={medPaginaActual === 1} onClick={() => { setMedPaginaActual(p => p - 1); scrollToTop(); }}>Anterior</button>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-body)' }}>Pág {medPaginaActual} de {totalMedPaginas}</span>
                    <button className="bc-btn-secondary" style={{ padding: '4px 12px', fontSize: '0.9rem' }} disabled={medPaginaActual === totalMedPaginas} onClick={() => { setMedPaginaActual(p => p + 1); scrollToTop(); }}>Siguiente</button>
                  </div>
                )}
              </div>

              <div className="bc-lab-med-grid">
                {medsPaginados.map(med => {
                   // Adaptar la clasificación global que viene en el join
                   let clasificacion = undefined;
                   if (med.blistercheck_clasificacion_global) {
                     const raw = Array.isArray(med.blistercheck_clasificacion_global) 
                       ? med.blistercheck_clasificacion_global[0] 
                       : med.blistercheck_clasificacion_global;
                     if (raw) {
                       clasificacion = {
                         apto_sdmdu_blister: raw.apto_sdmdu_blister,
                         requiere_reenvasado: raw.requiere_reenvasado,
                         requiere_reetiquetado: raw.requiere_reetiquetado,
                         solo_envase_clinico: raw.solo_envase_clinico,
                         en_mi_farmacia: true
                       };
                     }
                   }

                   return (
                    <MedicamentoCard
                      key={med.cn}
                      medicamento={med}
                      clasificacion={clasificacion}
                      onClick={() => onSelectMedicamento(med)}
                    />
                  );
                })}
              </div>

              {totalMedPaginas > 1 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
                  <button className="bc-btn-secondary" style={{ padding: '6px 16px' }} disabled={medPaginaActual === 1} onClick={() => { setMedPaginaActual(p => p - 1); scrollToTop(); }}>Anterior</button>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-body)' }}>Página {medPaginaActual} de {totalMedPaginas}</span>
                  <button className="bc-btn-secondary" style={{ padding: '6px 16px' }} disabled={medPaginaActual === totalMedPaginas} onClick={() => { setMedPaginaActual(p => p + 1); scrollToTop(); }}>Siguiente</button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    );
  }

  const laboratoriosFiltrados = laboratorios.filter(lab => 
    lab.laboratorio.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  const totalPaginas = Math.ceil(laboratoriosFiltrados.length / ITEMS_POR_PAGINA);
  const laboratoriosPaginados = laboratoriosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  return (
    <div className="bc-laboratorios-container">
      <div className="bc-laboratorios-header">
        <h2>Mis Laboratorios</h2>
        <p className="bc-laboratorios-subtitle">
          Laboratorios de los productos configurados como "En mi farmacia".
        </p>
        
        {laboratorios.length > 0 && (
          <div style={{ marginTop: '1.5rem', maxWidth: '400px', display: 'flex', alignItems: 'center', background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #e2e8f0)', borderRadius: 'var(--radius-md, 8px)', padding: '0 12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Search size={18} style={{ color: 'var(--color-text-muted, #64748b)', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Buscar laboratorio..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 10px', outline: 'none', fontSize: '0.95rem', color: 'var(--color-text, #1e293b)' }}
            />
          </div>
        )}
      </div>

      {laboratorios.length === 0 ? (
        <div className="bc-empty-state glass-panel">
          <Building2 size={48} className="bc-empty-state__icon" />
          <h3>No hay laboratorios</h3>
          <p>Añade medicamentos a tu farmacia para ver sus laboratorios aquí.</p>
        </div>
      ) : laboratoriosFiltrados.length === 0 ? (
        <div className="bc-empty-state glass-panel">
          <Search size={48} className="bc-empty-state__icon" />
          <h3>Sin resultados</h3>
          <p>No se encontraron laboratorios que coincidan con "{filtroTexto}".</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p className="bc-resultados-count" style={{ margin: 0 }}>
              {laboratoriosFiltrados.length} laboratorio{laboratoriosFiltrados.length !== 1 ? 's' : ''}
            </p>
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="bc-btn-secondary" style={{ padding: '4px 12px', fontSize: '0.9rem' }} disabled={paginaActual === 1} onClick={() => { setPaginaActual(p => p - 1); scrollToTop(); }}>Anterior</button>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-body)' }}>Pág {paginaActual} de {totalPaginas}</span>
                <button className="bc-btn-secondary" style={{ padding: '4px 12px', fontSize: '0.9rem' }} disabled={paginaActual === totalPaginas} onClick={() => { setPaginaActual(p => p + 1); scrollToTop(); }}>Siguiente</button>
              </div>
            )}
          </div>

          <div className="bc-laboratorios-grid">
            {laboratoriosPaginados.map(lab => {
              const colorClass = getColorClass(lab.pedido_minimo);
              return (
                <div 
                  key={lab.laboratorio} 
                  className={`bc-lab-card glass-panel ${colorClass}`}
                  onClick={() => handleVerDetalle(lab)}
                >
                  <div className="bc-lab-card__header">
                    <h3 className="bc-lab-card__title">{lab.laboratorio}</h3>
                    <div className="bc-lab-card__indicator"></div>
                  </div>
                  
                  <div className="bc-lab-card__stats">
                    <div className="bc-lab-stat">
                      <span className="bc-lab-stat__val">{lab.total}</span>
                      <span className="bc-lab-stat__lbl">Productos</span>
                    </div>
                    <div className="bc-lab-stat">
                      <span className="bc-lab-stat__val">{lab.porcentaje_sdmdu}%</span>
                      <span className="bc-lab-stat__lbl">Aptos SDMDU</span>
                    </div>
                    <div className="bc-lab-stat bc-lab-stat--highlight">
                      <span className="bc-lab-stat__val">
                        {parseFloat(lab.pedido_minimo) > 0 ? `${lab.pedido_minimo} €` : 'Sin pedido mín.'}
                      </span>
                      <span className="bc-lab-stat__lbl">Pedido Mín.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
              <button 
                className="bc-btn-secondary" 
                style={{ padding: '6px 16px' }}
                disabled={paginaActual === 1}
                onClick={() => {
                  setPaginaActual(p => p - 1);
                  scrollToTop();
                }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-body)' }}>
                Página {paginaActual} de {totalPaginas}
              </span>
              <button 
                className="bc-btn-secondary"
                style={{ padding: '6px 16px' }}
                disabled={paginaActual === totalPaginas}
                onClick={() => {
                  setPaginaActual(p => p + 1);
                  scrollToTop();
                }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MisLaboratorios;
