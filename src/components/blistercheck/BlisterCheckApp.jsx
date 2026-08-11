import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  BarChart2, 
  Download, 
  User, 
  Search, 
  BookOpen, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import MedicamentoBuscador from './MedicamentoBuscador';
import MedicamentoDetalle from './MedicamentoDetalle';
import BlisterCheckStats from './BlisterCheckStats';
import BlisterCheckExport from './BlisterCheckExport';
import GuiaOptimizer from './GuiaOptimizer';
import { getCatalogInfo, getClasificacion, getDesabastecimientoByCN } from '../../services/blistercheckService';
import { useAuth } from '../../contexts/AuthContext';

function BlisterCheckApp({ onGoToProfile }) {
  const { profile } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('search'); // 'search' | 'detail' | 'stats' | 'optimizer'
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState(null);
  const [clasificacionActual, setClasificacionActual] = useState(null);
  const [desabastecimientoActual, setDesabastecimientoActual] = useState(null);
  const [catalogInfo, setCatalogInfo] = useState({ totalCatalogo: 0, totalClasificados: 0, enMiFarmacia: 0, ultimaSync: null });
  const [showExport, setShowExport] = useState(false);
  
  // Estado para el menú lateral (colapsado en desktop / abierto en móvil)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Cargar info del catálogo al montar
  useEffect(() => {
    getCatalogInfo()
      .then(setCatalogInfo)
      .catch(err => console.error('Error cargando info catálogo:', err));
  }, []);

  const handleSelectMedicamento = useCallback(async (medicamento) => {
    setMedicamentoSeleccionado(medicamento);
    setClasificacionActual(null);
    setDesabastecimientoActual(null);
    setVistaActiva('detail');

    let isCurrent = true;
    try {
      const [clas, desab] = await Promise.all([
        getClasificacion(medicamento.cn),
        getDesabastecimientoByCN(medicamento.cn),
      ]);
      if (isCurrent) {
        setClasificacionActual(clas);
        setDesabastecimientoActual(desab);
      }
    } catch (err) {
      console.error('Error cargando datos del medicamento:', err);
    }
    return () => { isCurrent = false; };
  }, []);

  const handleClasificacionGuardada = useCallback((nuevaClasificacion) => {
    const isClassified = (c) => c && (c.requiere_reenvasado !== null || c.requiere_reetiquetado !== null || c.apto_sdmdu_blister !== null);
    
    const eraClasificado = isClassified(clasificacionActual);
    const ahoraClasificado = isClassified(nuevaClasificacion);
    
    const eraEnFarmacia = clasificacionActual?.en_mi_farmacia === true;
    const ahoraEnFarmacia = nuevaClasificacion?.en_mi_farmacia === true;

    setClasificacionActual(nuevaClasificacion);

    setCatalogInfo(prev => {
      let nuevasClasificadas = prev.totalClasificados;
      let nuevasEnFarmacia = prev.enMiFarmacia;

      if (!eraClasificado && ahoraClasificado) nuevasClasificadas++;
      else if (eraClasificado && !ahoraClasificado) nuevasClasificadas = Math.max(0, nuevasClasificadas - 1);

      if (!eraEnFarmacia && ahoraEnFarmacia) nuevasEnFarmacia++;
      else if (eraEnFarmacia && !ahoraEnFarmacia) nuevasEnFarmacia = Math.max(0, nuevasEnFarmacia - 1);

      return {
        ...prev,
        totalClasificados: nuevasClasificadas,
        enMiFarmacia: nuevasEnFarmacia,
      };
    });
  }, [clasificacionActual]);

  const handleVolverABusqueda = useCallback(() => {
    setVistaActiva('search');
    setMedicamentoSeleccionado(null);
    setClasificacionActual(null);
    setDesabastecimientoActual(null);
  }, []);

  const handleNavClick = (vista) => {
    setVistaActiva(vista);
    if (vista !== 'detail') setMedicamentoSeleccionado(null);
    setMobileSidebarOpen(false); // Cerrar menú en móvil tras navegar
  };

  // Obtener el título dinámico del encabezado
  const getHeaderTitle = () => {
    switch (vistaActiva) {
      case 'search': return 'Catálogo de Medicamentos';
      case 'optimizer': return 'Optimizador de Guía Terapéutica';
      case 'stats': return 'Panel de Estadísticas';
      case 'detail': return medicamentoSeleccionado?.nombre || 'Detalle del Medicamento';
      default: return 'BlisterCheck';
    }
  };

  return (
    <div className="bc-app">
      {/* Backdrop overlay para dispositivos móviles */}
      <div 
        className={`bc-sidebar-backdrop ${mobileSidebarOpen ? 'active' : ''}`} 
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Menú Lateral Desplegable (Sidebar) */}
      <aside className={`bc-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        {/* Header del Sidebar */}
        <div className="bc-sidebar__header">
          <div className="bc-logo" onClick={() => handleNavClick('search')}>
            <div className="bc-logo__badge">
              <ShieldCheck size={20} />
            </div>
            <span className="bc-logo__text">BlisterCheck</span>
          </div>
          
          <button 
            className="bc-sidebar__toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expandir Menú' : 'Colapsar Menú'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Perfil de Usuario */}
        <div className="bc-sidebar__user">
          <div className="bc-user-card" onClick={onGoToProfile} title="Ver Perfil de Usuario">
            <div className="bc-user-avatar">
              {(profile?.nombre || profile?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="bc-user-info">
              <span className="bc-user-name">{profile?.nombre || 'Farmacéutico'}</span>
              <span className="bc-user-role">Ver perfil</span>
            </div>
          </div>
        </div>

        {/* Links de Navegación Principal */}
        <nav className="bc-sidebar__nav">
          <div className="bc-sidebar__group-title">Módulos Clínicos</div>
          
          <button
            className={`bc-nav-item ${vistaActiva === 'search' || vistaActiva === 'detail' ? 'active' : ''}`}
            onClick={() => handleNavClick('search')}
          >
            <span className="bc-nav-item__icon"><Search size={18} /></span>
            <span className="bc-nav-item__label">Catálogo CIMA</span>
          </button>

          <button
            className={`bc-nav-item ${vistaActiva === 'optimizer' ? 'active' : ''}`}
            onClick={() => handleNavClick('optimizer')}
          >
            <span className="bc-nav-item__icon"><BookOpen size={18} /></span>
            <span className="bc-nav-item__label">Optimizador Guía</span>
          </button>

          <button
            className={`bc-nav-item ${vistaActiva === 'stats' ? 'active' : ''}`}
            onClick={() => handleNavClick('stats')}
          >
            <span className="bc-nav-item__icon"><BarChart2 size={18} /></span>
            <span className="bc-nav-item__label">Estadísticas</span>
          </button>

          <div className="bc-sidebar__group-title" style={{ marginTop: '0.75rem' }}>Herramientas</div>

          <button
            className="bc-nav-item"
            onClick={() => { setShowExport(true); setMobileSidebarOpen(false); }}
          >
            <span className="bc-nav-item__icon"><Download size={18} /></span>
            <span className="bc-nav-item__label">Exportar Registro</span>
          </button>
        </nav>

        {/* Resumen del Catálogo en Pastel */}
        {!sidebarCollapsed && catalogInfo.totalCatalogo > 0 && (
          <div className="bc-sidebar__stats">
            <div className="bc-sidebar-stat">
              <span className="bc-sidebar-stat__label">Catálogo CIMA</span>
              <span className="bc-sidebar-stat__pill bc-sidebar-stat__pill--blue">
                {catalogInfo.totalCatalogo.toLocaleString('es-ES')}
              </span>
            </div>
            <div className="bc-sidebar-stat">
              <span className="bc-sidebar-stat__label">Clasificados</span>
              <span className="bc-sidebar-stat__pill bc-sidebar-stat__pill--mint">
                {catalogInfo.totalClasificados}
              </span>
            </div>
          </div>
        )}

        {/* Pie del Sidebar */}
        <div className="bc-sidebar__footer">
          <span>BlisterCheck v2.4 • SDMDU</span>
        </div>
      </aside>

      {/* Área Principal de la Aplicación */}
      <div className="bc-main-wrapper">
        {/* Header Superior Compacto */}
        <header className="bc-header-bar">
          <div className="bc-header-bar__left">
            <button 
              className="bc-menu-btn" 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              title="Abrir Menú"
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="bc-header-title">{getHeaderTitle()}</h1>
          </div>

          <div className="bc-header-bar__right">
            <button className="bc-header-profile-btn" onClick={onGoToProfile}>
              <User size={16} />
              <span>{profile?.nombre || 'Perfil'}</span>
            </button>
          </div>
        </header>

        {/* Contenido Dinámico de la Vista */}
        <main className="bc-content">
          {vistaActiva === 'search' && (
            <MedicamentoBuscador onSelectMedicamento={handleSelectMedicamento} />
          )}
          
          {vistaActiva === 'optimizer' && (
            <GuiaOptimizer />
          )}

          {vistaActiva === 'detail' && medicamentoSeleccionado && (
            <MedicamentoDetalle
              key={medicamentoSeleccionado.cn}
              medicamento={medicamentoSeleccionado}
              clasificacion={clasificacionActual}
              desabastecimiento={desabastecimientoActual}
              onClasificacionGuardada={handleClasificacionGuardada}
              onVolver={handleVolverABusqueda}
              onSelectAlternativa={handleSelectMedicamento}
            />
          )}

          {vistaActiva === 'stats' && (
            <BlisterCheckStats />
          )}
        </main>
      </div>

      {/* Modal de exportación */}
      {showExport && (
        <BlisterCheckExport onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

export default BlisterCheckApp;

