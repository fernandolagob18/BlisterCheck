import { useState, useEffect, useRef } from 'react';
import { 
  getMisLaboratoriosData, 
  savePedidoMinimo,
  createCustomPlatform,
  addMedicationToPlatform,
  removeMedicationFromPlatform,
  deleteCustomPlatform,
  searchSimple
} from '../../services/blistercheckService';
import MedicamentoCard from './MedicamentoCard';
import { Building2, Save, ChevronLeft, ArrowLeft, Percent, Search, Plus, Trash2, X } from 'lucide-react';

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

  // Estados para creación de plataforma
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformPedido, setNewPlatformPedido] = useState('');

  // Estados para buscar medicamentos
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleCreatePlatform = async () => {
    if (!newPlatformName.trim()) return;
    try {
      await createCustomPlatform(newPlatformName, newPlatformPedido);
      setShowCreateModal(false);
      setNewPlatformName('');
      setNewPlatformPedido('');
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert('Error al crear la plataforma.');
    }
  };

  const handleDeletePlatform = async () => {
    if (!labSeleccionado) return;
    if (!window.confirm(`¿Seguro que deseas eliminar la plataforma ${labSeleccionado.laboratorio}?`)) return;
    try {
      await deleteCustomPlatform(labSeleccionado.laboratorio);
      setLabSeleccionado(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar la plataforma.');
    }
  };

  const handleSearchMeds = async () => {
    if (searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const res = await searchSimple(searchQuery);
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMedToPlatform = async (cn) => {
    try {
      await addMedicationToPlatform(labSeleccionado.laboratorio, cn);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Recargar datos en segundo plano sin interrumpir la vista
      const data = await getMisLaboratoriosData();
      setLaboratorios(data);
      const updatedLab = data.find(l => l.laboratorio === labSeleccionado.laboratorio);
      if (updatedLab) setLabSeleccionado(updatedLab);
    } catch (err) {
      console.error(err);
      alert('Error al añadir medicamento. Es posible que ya esté añadido.');
    }
  };

  const handleRemoveMedFromPlatform = async (cn) => {
    try {
      await removeMedicationFromPlatform(labSeleccionado.laboratorio, cn);
      
      // Recargar datos en segundo plano
      const data = await getMisLaboratoriosData();
      setLaboratorios(data);
      const updatedLab = data.find(l => l.laboratorio === labSeleccionado.laboratorio);
      if (updatedLab) {
        setLabSeleccionado(updatedLab);
      } else {
        handleVolver(); // Si por algún motivo desaparece por completo (no debería si is_plataforma = true)
      }
    } catch (err) {
      console.error(err);
      alert('Error al quitar medicamento.');
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
      <div className="bc-laboratorios-container loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-text-muted)' }}>
        <div className="bc-spinner" style={{ marginBottom: '1rem' }}></div>
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
        <div className="bc-laboratorios-detalle__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="bc-detalle-back" onClick={handleVolver}>
            <ArrowLeft size={16} /> Volver a laboratorios
          </button>
          {labSeleccionado.is_plataforma && (
            <button className="bc-btn-danger" onClick={handleDeletePlatform} style={{ padding: '6px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={16} /> Eliminar plataforma
            </button>
          )}
        </div>

        <div className={`bc-lab-hero glass-panel bc-lab-hero--${getColorClass(labSeleccionado.pedido_minimo)}`}>
          <div className="bc-lab-hero__content">
            <h2 className="bc-lab-hero__title">
              <Building2 size={28} style={{ color: 'var(--color-primary)' }} />
              {labSeleccionado.laboratorio}
            </h2>
            
            <div className="bc-lab-hero__badges">
              <span className="bc-badge bc-badge--blue" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
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
                  Medicamentos asociados ({labSeleccionado.total})
                </h3>
                {labSeleccionado.is_plataforma && (
                  <button className="bc-btn-primary" onClick={() => setShowSearchModal(true)} style={{ padding: '6px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} /> Añadir medicamento
                  </button>
                )}
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
                   // Todos los medicamentos aquí están en "mi farmacia" por definición
                   let clasificacion = {
                     en_mi_farmacia: true,
                     apto_sdmdu_blister: null,
                     requiere_reenvasado: null,
                     requiere_reetiquetado: null,
                     solo_envase_clinico: false
                   };

                   if (med.blistercheck_clasificacion_global) {
                     const raw = Array.isArray(med.blistercheck_clasificacion_global) 
                       ? med.blistercheck_clasificacion_global[0] 
                       : med.blistercheck_clasificacion_global;
                     if (raw) {
                       clasificacion.apto_sdmdu_blister = raw.apto_sdmdu_blister;
                       clasificacion.requiere_reenvasado = raw.requiere_reenvasado;
                       clasificacion.requiere_reetiquetado = raw.requiere_reetiquetado;
                       clasificacion.solo_envase_clinico = raw.solo_envase_clinico;
                     }
                   }

                   return (
                    <div key={med.cn} style={{ position: 'relative' }}>
                      <MedicamentoCard
                        medicamento={med}
                        clasificacion={clasificacion}
                        onClick={() => onSelectMedicamento(med)}
                      />
                      {med.is_manual_link && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveMedFromPlatform(med.cn); }}
                          style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                          title="Quitar de esta plataforma"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={24} style={{ color: 'var(--color-primary)' }} />
              Mis Laboratorios
            </h2>
            <p className="bc-laboratorios-subtitle" style={{ margin: 0 }}>
              Laboratorios nativos y Plataformas de distribución.
            </p>
          </div>
          <button className="bc-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Crear plataforma de distribución
          </button>
        </div>
        
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

      {/* MODAL CREAR PLATAFORMA */}
      {showCreateModal && (
        <div className="bc-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="bc-modal" onClick={e => e.stopPropagation()}>
            <div className="bc-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="bc-modal-title">
                <Building2 size={20} />
                <h3 style={{ margin: 0 }}>Crear plataforma</h3>
              </div>
              <button className="bc-modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <div className="bc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: 0 }}>
              <div>
                <label className="bc-filtro-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre de la plataforma</label>
                <input type="text" className="bc-filtro-input" style={{ width: '100%' }} value={newPlatformName} onChange={e => setNewPlatformName(e.target.value)} placeholder="Ej. Cofares, Bidafarma, Unnefar..." />
              </div>
              <div>
                <label className="bc-filtro-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Pedido mínimo inicial (€)</label>
                <input type="number" className="bc-filtro-input" style={{ width: '100%' }} value={newPlatformPedido} onChange={e => setNewPlatformPedido(e.target.value)} placeholder="Ej. 150" />
              </div>
            </div>
            <div className="bc-modal-footer">
              <button className="bc-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              <button className="bc-btn-primary" onClick={handleCreatePlatform}>Crear Plataforma</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUSCAR MEDICAMENTO */}
      {showSearchModal && (
        <div className="bc-modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="bc-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '95%' }}>
            <div className="bc-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="bc-modal-title">
                <Search size={20} />
                <h3 style={{ margin: 0 }}>Vincular medicamento manual</h3>
              </div>
              <button className="bc-modal-close" onClick={() => setShowSearchModal(false)}><X size={20} /></button>
            </div>
            <div className="bc-modal-body" style={{ paddingTop: 0 }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                <div className="bc-search-bar" style={{ flex: 1 }}>
                  <Search size={18} className="bc-search-icon" />
                  <input 
                    type="text" 
                    className="bc-search-input" 
                    placeholder="Buscar por código nacional (CN) o nombre..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchMeds()}
                    autoFocus
                  />
                  {searchQuery && (
                    <button className="bc-search-clear" onClick={() => setSearchQuery('')}>
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button className="bc-btn-primary" onClick={handleSearchMeds}>Buscar</button>
              </div>
              {isSearching ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
                  <div className="bc-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                  <p>Buscando en el catálogo global...</p>
                </div>
              ) : (
                <div style={{ maxHeight: '350px', overflowY: 'auto', borderRadius: 'var(--radius-md)' }}>
                  {searchResults.length > 0 && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      Se encontraron {searchResults.length} resultados:
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {searchResults.map(res => (
                      <div key={res.cn} className="bc-export-option" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, border: '1px solid var(--color-card-border)' }}>
                        <div>
                          <strong>{res.cn}</strong>
                          <span>{res.nombre}</span>
                        </div>
                        <button className="bc-btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => handleAddMedToPlatform(res.cn)}>
                          <Plus size={14} style={{ marginRight: '4px' }} /> Añadir
                        </button>
                      </div>
                    ))}
                  </div>
                  {searchResults.length === 0 && searchQuery.trim() !== '' && (
                    <div className="bc-empty-state glass-panel" style={{ padding: '2rem 1rem', marginTop: 0 }}>
                      <Search size={32} className="bc-empty-state__icon" style={{ opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>No se encontraron medicamentos que coincidan con la búsqueda.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisLaboratorios;
