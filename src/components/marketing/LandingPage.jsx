import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  FileSpreadsheet, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Lock, 
  Database,
  ExternalLink,
  Pill,
  Sparkles,
  FileText,
  RefreshCw,
  Check,
  XCircle,
  HelpCircle
} from 'lucide-react';
import '../../landing.css';

export default function LandingPage({ onLogin, onRegister }) {
  const [activeSimTab, setActiveSimTab] = useState('search'); // 'search' | 'optimizer' | 'shortages' | 'stats'
  const [simSearchQuery, setSimSearchQuery] = useState('Paracetamol');

  // Datos simulados hiper-reales de la interfaz de BlisterCheck
  const mockMeds = [
    {
      cn: '654321',
      nombre: 'PARACETAMOL STADA 1 g comprimidos EFG',
      laboratorio: 'STADA SL',
      apto: true,
      tipo: 'Apto Blíster Unitario',
      via: 'Oral',
      dosis: '1000 mg',
      prescripcion: 'Con receta',
      comercializado: true,
      badgeClass: 'demo-badge-apto'
    },
    {
      cn: '712384',
      nombre: 'OMEPRAZOL CINFA 20 mg cápsulas duras',
      laboratorio: 'LABORATORIOS CINFA S.A.',
      apto: true,
      tipo: 'Apto Blíster Unitario',
      via: 'Oral',
      dosis: '20 mg',
      prescripcion: 'Con receta',
      comercializado: true,
      badgeClass: 'demo-badge-apto'
    },
    {
      cn: '689102',
      nombre: 'ENALAPRIL NORMON 20 mg comprimidos EFG',
      laboratorio: 'LABORATORIOS NORMON S.A.',
      apto: false,
      tipo: 'Requiere Reenvasado (Envase Multidosis)',
      via: 'Oral',
      dosis: '20 mg',
      prescripcion: 'Con receta',
      comercializado: true,
      badgeClass: 'demo-badge-reenvasado'
    }
  ];

  const mockExcelRows = [
    { cn: '689102', nombre: 'ENALAPRIL NORMON 20mg', estado: 'Requiere Reenvasado', sugNombre: 'ENALAPRIL KERN PHARMA 20mg Blíster Unitario', sugCn: '702114', ahorro: '94% Tiempo' },
    { cn: '712384', nombre: 'OMEPRAZOL CINFA 20mg', estado: 'Apto Blíster', sugNombre: '— (Ya es Apto de Fábrica)', sugCn: '—', ahorro: 'Directo en SDMDU' },
    { cn: '654321', nombre: 'PARACETAMOL STADA 1g', estado: 'Apto Blíster', sugNombre: '— (Ya es Apto de Fábrica)', sugCn: '—', ahorro: 'Directo en SDMDU' },
  ];

  const mockShortages = [
    { cn: '698123', nombre: 'AMOXICILINA NORMON 500mg cápsulas', inicio: '15/07/2026', finPrevista: '30/08/2026', estado: 'En desabastecimiento oficial AEMPS' },
    { cn: '723910', nombre: 'VALSARTAN QUALIGEN 160mg comprimidos', inicio: '02/08/2026', finPrevista: '15/09/2026', estado: 'Suministro limitado por laboratorio' },
  ];

  const filteredMeds = mockMeds.filter(m => 
    m.nombre.toLowerCase().includes(simSearchQuery.toLowerCase()) || 
    m.cn.includes(simSearchQuery)
  );

  return (
    <div className="landing-page">
      {/* --- BANNER DE OFICIALIDAD INSTITUCIONAL --- */}
      <div className="official-top-banner">
        <span> Plataforma de Diagnóstico Clínico para Servicios de Farmacia Hospitalaria y Unidades de Dosis Unitaria</span>
        <span className="badge-gov">Sincronización Oficial AEMPS / CIMA</span>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <ShieldCheck size={30} color="#0284c7" />
          <span>BlisterCheck</span>
          <span className="landing-logo-badge">v4.2 Oficial</span>
        </div>

        <div className="landing-nav-links">
          <a href="#demostrador">Buscador AEMPS</a>
          <a href="#optimizador">Optimizador Excel</a>
          <a href="#desabastecimientos">Alertas CIMA</a>
          <a href="#garantias">Seguridad RLS</a>
        </div>

        <div className="landing-nav-actions">
          <button className="btn-nav-login" onClick={onLogin}>
            Iniciar Sesión
          </button>
          <button className="btn-nav-register" onClick={onRegister}>
            Acceso Institucional
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="landing-hero">
        <div className="hero-pill">
          <Sparkles size={16} />
          <span>Farmacia Hospitalaria & SDMDU</span>
        </div>

        <h1>
          Gestión Inteligente de Blíster y <br />
          <span className="gradient-text">Acondicionamiento Primario de Medicamentos</span>
        </h1>

        <p>
          BlisterCheck es la solución clínica que conecta en tiempo real el catálogo de la Agencia Española de Medicamentos (AEMPS) con los sistemas de dosificación hospitalaria (SDMDU/SPD). Identifique qué presentaciones son aptas para blíster unitario, elimine reenvasados innecesarios y optimice su guía farmacoterapéutica.
        </p>

        <div className="hero-ctas">
          <button className="btn-hero-primary" onClick={onRegister}>
            Crear Cuenta de Centro / Servicio <ArrowRight size={20} />
          </button>
          <button className="btn-hero-secondary" onClick={onLogin}>
            Acceder a Mi Farmacia
          </button>
        </div>
      </header>

      {/* --- INTERACTIVE LIVE APP PREVIEW SIMULATOR --- */}
      <section className="preview-simulator-section" id="demostrador">
        <div className="browser-mockup-wrapper">
          {/* Barra de título de la app */}
          <div className="browser-header-bar">
            <div className="browser-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="browser-url-input">
              <Lock size={12} color="#059669" />
              <span>https://blistercheck.app/farmacia-hospitalaria/dashboard</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              🟢 Conectado con AEMPS API
            </div>
          </div>

          {/* Pestañas de funciones reales de la app */}
          <div className="sim-tabs-bar">
            <button 
              className={`sim-tab-btn ${activeSimTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveSimTab('search')}
            >
              <Search size={16} /> 1. Buscador AEMPS y Clasificación
            </button>
            <button 
              className={`sim-tab-btn ${activeSimTab === 'optimizer' ? 'active' : ''}`}
              onClick={() => setActiveSimTab('optimizer')}
            >
              <FileSpreadsheet size={16} /> 2. Optimizador de Guía Excel
            </button>
            <button 
              className={`sim-tab-btn ${activeSimTab === 'shortages' ? 'active' : ''}`}
              onClick={() => setActiveSimTab('shortages')}
            >
              <AlertTriangle size={16} /> 3. Alertas Desabastecimiento CIMA
            </button>
            <button 
              className={`sim-tab-btn ${activeSimTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveSimTab('stats')}
            >
              <BarChart3 size={16} /> 4. Métricas e Idoneidad SDMDU
            </button>
          </div>

          {/* Viewport interactivo con la UI Real */}
          <div className="sim-content-viewport">
            {activeSimTab === 'search' && (
              <div className="demo-card-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0b192c' }}>Catálogo Oficial de Medicamentos AEMPS</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      25.400+ registros sincronizados. Pruebe a buscar por nombre o Código Nacional:
                    </p>
                  </div>
                  <span style={{ fontSize: '0.78rem', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                    Interactivo
                  </span>
                </div>

                <div className="demo-search-header">
                  <div className="demo-search-input">
                    <Search size={18} color="#64748b" />
                    <input 
                      type="text" 
                      value={simSearchQuery} 
                      onChange={(e) => setSimSearchQuery(e.target.value)}
                      placeholder="Ej: Paracetamol, Omeprazol, Enalapril, 654321..."
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#0f172a' }}
                    />
                  </div>
                </div>

                <div className="demo-med-grid">
                  {filteredMeds.map(med => (
                    <div className="demo-med-card" key={med.cn}>
                      <div className="demo-med-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', color: '#1e40af' }}>
                        <Pill size={32} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>CN: {med.cn}</span>
                          <span className={med.badgeClass}>
                            {med.apto ? <Check size={12} /> : <AlertTriangle size={12} />}
                            {med.tipo}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#0b192c', fontWeight: 800 }}>{med.nombre}</h4>
                        <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span><strong>Lab:</strong> {med.laboratorio}</span>
                          <span><strong>Vía:</strong> {med.via}</span>
                          <span><strong>Dosis:</strong> {med.dosis}</span>
                        </div>
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
                          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={13} /> Ficha Técnica PDF</span>
                          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><ExternalLink size={13} /> Prospecto AEMPS</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredMeds.length === 0 && (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', gridColumn: '1 / -1' }}>
                      Sin resultados coincidentes. Pruebe a buscar "Paracetamol", "Omeprazol" o "Enalapril".
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSimTab === 'optimizer' && (
              <div className="demo-card-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0b192c' }}>Optimizador de Guía Farmacoterapéutica (Excel / CSV)</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Analiza automáticamente miles de medicamentos y sugiere equivalentes con blíster unitario de fábrica:
                    </p>
                  </div>
                  <button className="btn-hero-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <FileSpreadsheet size={16} /> Cargar Archivo Excel
                  </button>
                </div>

                <div className="demo-table-wrapper">
                  <table className="demo-table">
                    <thead>
                      <tr>
                        <th>CN Guía</th>
                        <th>Medicamento Solicitado</th>
                        <th>Acondicionamiento Actual</th>
                        <th>Sugerencia Directa de Fábrica</th>
                        <th>Impacto en SDMDU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockExcelRows.map((row, idx) => (
                        <tr key={idx}>
                          <td><strong>{row.cn}</strong></td>
                          <td>{row.nombre}</td>
                          <td>
                            <span className={row.estado === 'Apto Blíster' ? 'demo-badge-apto' : 'demo-badge-reenvasado'}>
                              {row.estado}
                            </span>
                          </td>
                          <td style={{ color: '#0284c7', fontWeight: row.sugCn !== '—' ? 700 : 400 }}>
                            {row.sugNombre}
                          </td>
                          <td>
                            <span style={{ background: '#eff6ff', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}>
                              {row.ahorro}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSimTab === 'shortages' && (
              <div className="demo-card-container">
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0b192c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle color="#d97706" size={20} /> Alertas de Desabastecimiento en Tiempo Real (CIMA)
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Monitorización automática para evitar rupturas de stock en la farmacia del hospital:
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mockShortages.map((item, idx) => (
                    <div key={idx} style={{ border: '1px solid #fef3c7', background: '#fffbeb', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309' }}>CN {item.cn}</span>
                        <h4 style={{ margin: '2px 0 4px', fontSize: '0.95rem', color: '#92400e' }}>{item.nombre}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#78350f' }}>{item.estado}</span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#92400e' }}>
                        <div><strong>Inicio:</strong> {item.inicio}</div>
                        <div><strong>Previsto:</strong> {item.finPrevista}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSimTab === 'stats' && (
              <div className="demo-card-container">
                <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#0b192c' }}>Cuadro de Mando de Idoneidad en Stock</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: '#059669' }}>78.4%</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Apto Blíster de Fábrica</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: '#d97706' }}>18.2%</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Reenvasado Interno</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: '#0284c7' }}>3.4%</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Reetiquetado Unidosis</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- TRUST BAR --- */}
      <div className="trust-bar">
        <div className="trust-bar-container">
          <div className="trust-item">
            <h4>+25.000</h4>
            <p>Presentaciones Oficiales AEMPS</p>
          </div>
          <div className="trust-item">
            <h4>100% Rigor</h4>
            <p>Sincronización API CIMA Directa</p>
          </div>
          <div className="trust-item">
            <h4>Ahorro Clínico</h4>
            <p>Reducción de Costes de Reenvasado</p>
          </div>
          <div className="trust-item">
            <h4>SDMDU & SPD</h4>
            <p>Idoneidad Inmediata de Blíster</p>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 1: BUSCADOR AEMPS --- */}
      <section className="landing-section" id="optimizador">
        <div className="section-header">
          <span className="section-tag">Diagnóstico Clínico Avanzado</span>
          <h2>Búsqueda e Inspección de Medicamentos</h2>
          <p>
            Consulte instantáneamente cualquier Código Nacional o principio activo y obtenga una evaluación técnica del blíster primario.
          </p>
        </div>

        <div className="feature-row">
          <div className="feature-text-content">
            <div className="feature-icon-badge">
              <Search size={26} />
            </div>
            <h3>Información Técnica Completa y Clasificación SDMDU</h3>
            <p>
              Acceda directamente a las fotografías oficiales de envase y forma farmacéutica, prospectos autorizados y fichas técnicas aprobadas por el Ministerio de Sanidad.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={18} /> Clasificación explícita: Apto Blíster, Reenvasado o Reetiquetado.</li>
              <li><CheckCircle2 size={18} /> Filtrado por vía de administración y forma farmacéutica.</li>
              <li><CheckCircle2 size={18} /> Marcado rápido de inventario local ("En mi farmacia").</li>
            </ul>
          </div>

          <div className="feature-card-visual">
            <img src="/images/hero_app_preview.jpg" alt="Buscador AEMPS BlisterCheck" />
          </div>
        </div>
      </section>

      {/* --- SECCIÓN 2: OPTIMIZADOR EXCEL --- */}
      <section className="landing-section" style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
        <div className="section-header">
          <span className="section-tag">Automatización de Guías Farmacoterapéuticas</span>
          <h2>Optimizador de Guías en Excel / CSV</h2>
          <p>
            Cargue su listado de medicamentos y el motor inteligente diagnosticará toda la guía del hospital en segundos.
          </p>
        </div>

        <div className="feature-row reverse">
          <div className="feature-text-content">
            <div className="feature-icon-badge">
              <FileSpreadsheet size={26} />
            </div>
            <h3>Sugerencias Directas de Alternativas Comercializadas</h3>
            <p>
              Para cada presentación que requiera reenvasado manual, BlisterCheck busca equivalentes con el mismo principio activo que ya vengan en blíster unitario de fábrica.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={18} /> Análisis por lotes de miles de registros en segundos.</li>
              <li><CheckCircle2 size={18} /> Reducción drástica del gasto de material y tiempo de personal.</li>
              <li><CheckCircle2 size={18} /> Informes descargables en Excel listos para la Comisión de Farmacia.</li>
            </ul>
          </div>

          <div className="feature-card-visual">
            <img src="/images/excel_optimizer_preview.jpg" alt="Optimizador de Guía Excel" />
          </div>
        </div>
      </section>

      {/* --- SECCIÓN 3: CUADRO DE MANDO Y ESTADÍSTICAS --- */}
      <section className="landing-section" id="desabastecimientos">
        <div className="section-header">
          <span className="section-tag">Auditoría e Indicadores</span>
          <h2>Cuadro de Mando y Análisis por Laboratorio</h2>
          <p>
            Evalúe cuantitativamente el grado de idoneidad del stock de su centro hospitalario.
          </p>
        </div>

        <div className="feature-row">
          <div className="feature-text-content">
            <div className="feature-icon-badge">
              <BarChart3 size={26} />
            </div>
            <h3>Informes de Acondicionamiento por Proveedor</h3>
            <p>
              Compare la tasa de blíster unitario de los laboratorios proveedores durante los procesos de adquisición y pliegos públicos.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={18} /> Gráficos de distribución de acondicionado primario.</li>
              <li><CheckCircle2 size={18} /> Exportación completa a CSV/Excel con 1 clic.</li>
              <li><CheckCircle2 size={18} /> Control de idoneidad en inventario propio.</li>
            </ul>
          </div>

          <div className="feature-card-visual">
            <img src="/images/stats_dashboard_preview.jpg" alt="Cuadro de Mando Analítico" />
          </div>
        </div>
      </section>

      {/* --- GARANTÍAS INSTITUCIONALES --- */}
      <section className="landing-section" id="garantias">
        <div className="section-header">
          <span className="section-tag">Arquitectura e Infraestructura</span>
          <h2>Estándares de Seguridad para Entornos Sanitarios</h2>
          <p>
            Seguridad de grado hospitalario, actualización continua y aislamiento de datos.
          </p>
        </div>

        <div className="grid-3-col">
          <div className="interactive-card">
            <div className="card-icon">
              <Database size={24} />
            </div>
            <h4>Sincronización Directa AEMPS</h4>
            <p>
              Actualización automatizada con la base de datos oficial de la Agencia Española de Medicamentos.
            </p>
          </div>

          <div className="interactive-card">
            <div className="card-icon">
              <AlertTriangle size={24} />
            </div>
            <h4>Alertas de Desabastecimiento</h4>
            <p>
              Notificación inmediata de problemas de suministro comunicados oficialmente para planificar sustituciones.
            </p>
          </div>

          <div className="interactive-card">
            <div className="card-icon">
              <Lock size={24} />
            </div>
            <h4>Aislamiento Multi-Tenant (RLS)</h4>
            <p>
              Sus datos e inventario local de farmacia están totalmente protegidos por políticas Row Level Security en base de datos.
            </p>
          </div>
        </div>
      </section>

      {/* --- BANNER INFERIOR DE ACCESO --- */}
      <section className="bottom-cta-banner">
        <div className="bottom-cta-container">
          <h2>¿Desea optimizar la gestión de SDMDU en su hospital?</h2>
          <p>
            Únase a los profesionales de Farmacia Hospitalaria que agilizan el acondicionamiento primario de medicamentos con BlisterCheck.
          </p>

          <div className="bottom-cta-actions">
            <button className="btn-hero-primary" onClick={onRegister}>
              Solicitar Acceso Institucional <ArrowRight size={20} />
            </button>
            <button className="btn-hero-secondary" onClick={onLogin}>
              Iniciar Sesión
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER OFICIAL --- */}
      <footer className="landing-footer-main">
        <div className="footer-logo">
          <ShieldCheck size={24} color="#0284c7" />
          <span>BlisterCheck © 2026</span>
        </div>
        <p>Sistema de Optimización de Acondicionamiento Primario de Medicamentos y SDMDU.</p>
      </footer>
    </div>
  );
}
