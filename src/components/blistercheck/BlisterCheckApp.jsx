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
  Sparkles,
  Upload,
  LogOut,
  Leaf
} from 'lucide-react';
import MedicamentoBuscador from './MedicamentoBuscador';
import MedicamentoDetalle from './MedicamentoDetalle';
import BlisterCheckStats from './BlisterCheckStats';
import BlisterCheckExport from './BlisterCheckExport';
import BlisterCheckUploadMeds from './BlisterCheckUploadMeds';
import GuiaOptimizer from './GuiaOptimizer';
import SostenibilidadPage from './SostenibilidadPage';
import { getCatalogInfo, getClasificacion, getDesabastecimientoByCN } from '../../services/blistercheckService';
import { useAuth } from '../../contexts/AuthContext';

function BlisterCheckApp({ onGoToProfile }) {
  const { profile, signOut } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('search'); // 'search' | 'detail' | 'stats' | 'optimizer'
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState(null);
  const [clasificacionActual, setClasificacionActual] = useState(null);
  const [desabastecimientoActual, setDesabastecimientoActual] = useState(null);
  const [catalogInfo, setCatalogInfo] = useState({ totalCatalogo: 0, totalClasificados: 0, enMiFarmacia: 0, ultimaSync: null });
  const [showExport, setShowExport] = useState(false);
  const [showUploadMeds, setShowUploadMeds] = useState(false);
  
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
      case 'eco': return 'Sostenibilidad del Reenvasado';
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
          {!sidebarCollapsed ? (
            <>
              <div className="bc-logo" onClick={() => handleNavClick('search')}>
                <svg width="34" height="34" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, borderRadius: 8, boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)' }}>
                  <rect width="38" height="38" rx="9" fill="#0b192c"/>
                  {/* Blister grid */}
                  <rect x="7" y="10" width="10" height="8" rx="3" fill="#1a3a5c"/>
                  <rect x="21" y="10" width="10" height="8" rx="3" fill="#1a3a5c"/>
                  <rect x="7" y="21" width="10" height="8" rx="3" fill="#1a3a5c"/>
                  <rect x="21" y="21" width="10" height="8" rx="3" fill="#1a3a5c"/>
                  {/* Pills */}
                  <ellipse cx="12" cy="14" rx="3" ry="2.5" fill="#0ea5e9"/>
                  <ellipse cx="26" cy="14" rx="3" ry="2.5" fill="#0ea5e9" opacity="0.5"/>
                  <ellipse cx="12" cy="25" rx="3" ry="2.5" fill="#0ea5e9" opacity="0.5"/>
                  {/* Check en la celda activa */}
                  <polyline points="24,25.5 26,27.5 30,23.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="bc-logo__text">BlisterCheck</span>
              </div>
              
              <button 
                className="bc-sidebar__toggle" 
                onClick={() => setSidebarCollapsed(true)}
                title="Colapsar Menú"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          ) : (
            <button 
              className="bc-sidebar__toggle bc-sidebar__toggle--centered" 
              onClick={() => setSidebarCollapsed(false)}
              title="Expandir Menú"
            >
              <ChevronRight size={18} />
            </button>
          )}
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
            title="Catálogo CIMA"
          >
            <span className="bc-nav-item__icon"><Search size={18} /></span>
            <span className="bc-nav-item__label">Catálogo CIMA</span>
          </button>

          <button
            className={`bc-nav-item ${vistaActiva === 'optimizer' ? 'active' : ''}`}
            onClick={() => handleNavClick('optimizer')}
            title="Optimizador Guía"
          >
            <span className="bc-nav-item__icon"><BookOpen size={18} /></span>
            <span className="bc-nav-item__label">Optimizador Guía</span>
          </button>

          <button
            className={`bc-nav-item ${vistaActiva === 'stats' ? 'active' : ''}`}
            onClick={() => handleNavClick('stats')}
            title="Estadísticas"
          >
            <span className="bc-nav-item__icon"><BarChart2 size={18} /></span>
            <span className="bc-nav-item__label">Estadísticas</span>
          </button>

          <div className="bc-sidebar__group-title" style={{ marginTop: '0.75rem' }}>Herramientas</div>

          <button
            className={`bc-nav-item ${vistaActiva === 'eco' ? 'active' : ''}`}
            onClick={() => handleNavClick('eco')}
            title="Sostenibilidad del Reenvasado"
          >
            <span className="bc-nav-item__icon"><Leaf size={18} /></span>
            <span className="bc-nav-item__label">Sostenibilidad</span>
          </button>

          <button
            className="bc-nav-item"
            onClick={() => { setShowUploadMeds(true); setMobileSidebarOpen(false); }}
            title="Subir mis medicamentos"
          >
            <span className="bc-nav-item__icon"><Upload size={18} /></span>
            <span className="bc-nav-item__label">Subir mis medicamentos</span>
          </button>

          <button
            className="bc-nav-item"
            onClick={() => { setShowExport(true); setMobileSidebarOpen(false); }}
            title="Exportar Registro"
          >
            <span className="bc-nav-item__icon"><Download size={18} /></span>
            <span className="bc-nav-item__label">Exportar Registro</span>
          </button>
        </nav>


        {/* Pie del Sidebar */}
        <div className="bc-sidebar__footer">
          {!sidebarCollapsed ? (
            <button
              className="bc-sidebar-logout-btn"
              onClick={async () => { await signOut(); }}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          ) : (
            <button
              className="bc-sidebar-logout-btn bc-sidebar-logout-btn--icon"
              onClick={async () => { await signOut(); }}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Área Principal de la Aplicación */}
      <div className="bc-main-wrapper">
        {/* Header Superior Compacto */}
        <header className="bc-header-bar">
          <div className="bc-header-bar__left">
            <button 
              className="bc-menu-btn" 
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setMobileSidebarOpen(prev => !prev);
                } else {
                  setSidebarCollapsed(prev => !prev);
                }
              }}
              title="Abrir Menú"
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="bc-header-title">{getHeaderTitle()}</h1>
            
            {vistaActiva === 'search' && catalogInfo && catalogInfo.totalCatalogo > 0 && (
              <div className="bc-header-stats" style={{ display: 'flex', gap: '12px', marginLeft: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total:</span>
                  <span className="bc-sidebar-stat__pill bc-sidebar-stat__pill--blue">
                    {catalogInfo.totalCatalogo.toLocaleString('es-ES')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Clasificados:</span>
                  <span className="bc-sidebar-stat__pill bc-sidebar-stat__pill--mint">
                    {catalogInfo.totalClasificados.toLocaleString('es-ES')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>En mi farmacia:</span>
                  <span className="bc-sidebar-stat__pill" style={{ background: 'var(--color-primary-light, #e0f2fe)', color: 'var(--color-primary-dark, #0369a1)' }}>
                    {catalogInfo.enMiFarmacia.toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bc-header-bar__right">
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

          {vistaActiva === 'eco' && (
            <SostenibilidadPage />
          )}
        </main>
      </div>

      {/* Modal de exportación */}
      {showExport && (
        <BlisterCheckExport onClose={() => setShowExport(false)} />
      )}

      {/* Modal Subir mis medicamentos */}
      {showUploadMeds && (
        <BlisterCheckUploadMeds 
          onClose={() => setShowUploadMeds(false)} 
          onUploadComplete={() => {
            getCatalogInfo().then(setCatalogInfo);
            setShowUploadMeds(false);
          }}
        />
      )}
    </div>
  );
}

export default BlisterCheckApp;

