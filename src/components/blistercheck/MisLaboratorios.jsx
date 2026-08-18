import { useState, useEffect } from 'react';
import { getMisLaboratoriosData, savePedidoMinimo } from '../../services/blistercheckService';
import MedicamentoCard from './MedicamentoCard';
import { Building2, Save, ChevronLeft, Percent, Search } from 'lucide-react';

function MisLaboratorios({ onSelectMedicamento }) {
  const [laboratorios, setLaboratorios] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
          <button className="bc-btn bc-btn--outline bc-btn--icon" onClick={handleVolver}>
            <ChevronLeft size={18} /> Volver
          </button>
          <h2 className="bc-laboratorios-detalle__title">
            <Building2 size={24} />
            {labSeleccionado.laboratorio}
          </h2>
        </div>

        <div className="bc-laboratorios-detalle__stats grid-2">
          <div className="bc-stat-card">
            <div className="bc-stat-card__icon"><Percent size={24} /></div>
            <div className="bc-stat-card__content">
              <span className="bc-stat-card__label">Aptos para SDMDU</span>
              <span className="bc-stat-card__value">
                {labSeleccionado.porcentaje_sdmdu}%
                <small className="bc-stat-card__subtext"> ({labSeleccionado.aptos_sdmdu} de {labSeleccionado.total})</small>
              </span>
            </div>
          </div>

          <div className={`bc-stat-card bc-stat-card--${getColorClass(labSeleccionado.pedido_minimo)}`}>
            <div className="bc-stat-card__content" style={{ flex: 1 }}>
              <span className="bc-stat-card__label">Pedido Mínimo (€)</span>
              <div className="bc-pedido-input-group">
                <input 
                  type="number" 
                  className="bc-input"
                  value={pedidoMinimoInput}
                  onChange={(e) => setPedidoMinimoInput(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <button 
                  className="bc-btn bc-btn--primary" 
                  onClick={handleGuardarPedido}
                  disabled={guardandoPedido}
                >
                  <Save size={18} /> {guardandoPedido ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <h3 className="bc-section-subtitle" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
          Medicamentos en mi farmacia ({labSeleccionado.total})
        </h3>

        <div className="bc-med-grid">
          {labSeleccionado.medicamentos.map(med => {
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
      </div>
    );
  }

  const laboratoriosFiltrados = laboratorios.filter(lab => 
    lab.laboratorio.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  return (
    <div className="bc-laboratorios-container">
      <div className="bc-laboratorios-header">
        <h2>Mis Laboratorios</h2>
        <p className="bc-laboratorios-subtitle">
          Laboratorios de los productos configurados como "En mi farmacia".
        </p>
        
        {laboratorios.length > 0 && (
          <div className="bc-search-bar" style={{ marginTop: '1.5rem', maxWidth: '400px', position: 'relative' }}>
            <Search size={18} className="bc-search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              className="bc-input" 
              placeholder="Buscar laboratorio..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
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
        <div className="bc-laboratorios-grid">
          {laboratoriosFiltrados.map(lab => {
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
      )}
    </div>
  );
}

export default MisLaboratorios;
