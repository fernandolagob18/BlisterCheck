import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  FileSpreadsheet, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Lock, 
  Database
} from 'lucide-react';
import '../../landing.css';

export default function LandingPage({ onLogin, onRegister }) {
  return (
    <div className="landing-page">
      {/* --- NAVBAR --- */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <ShieldCheck size={30} color="#0ea5e9" />
          <span>BlisterCheck</span>
        </div>

        <div className="landing-nav-links">
          <a href="#funciones">Funcionalidades</a>
          <a href="#optimizador">Optimizador Excel</a>
          <a href="#estadisticas">Estadísticas</a>
          <a href="#garantias">Garantías</a>
        </div>

        <div className="landing-nav-actions">
          <button className="btn-nav-login" onClick={onLogin}>
            Iniciar Sesión
          </button>
          <button className="btn-nav-register" onClick={onRegister}>
            Registrarse Gratis
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="landing-hero">
        <div className="hero-pill">
          <Sparkles size={16} />
          <span>Gestión Clínica de Farmacia Hospitalaria</span>
        </div>

        <h1>
          Optimice su inventario para <br />
          <span className="gradient-text">Sistemas Personalizados de Dosificación</span>
        </h1>

        <p>
          BlisterCheck conecta de forma inteligente el catálogo oficial de la AEMPS con la gestión de SDMDU.
          Identifique qué medicamentos requieren reenvasado, descubra alternativas clínicas listas para uso y elimine costes innecesarios.
        </p>

        <div className="hero-ctas">
          <button className="btn-hero-primary" onClick={onRegister}>
            Crear Cuenta Institucional <ArrowRight size={20} />
          </button>
          <button className="btn-hero-secondary" onClick={onLogin}>
            Acceder a Mi Cuenta
          </button>
        </div>

        {/* HERO MOCKUP (BROWSER FRAME) */}
        <div className="hero-mockup-container">
          <div className="browser-header">
            <div className="browser-dot dot-red"></div>
            <div className="browser-dot dot-yellow"></div>
            <div className="browser-dot dot-green"></div>
            <div className="browser-address-bar">
              https://blistercheck.app/dashboard
            </div>
          </div>
          <img 
            src="/images/hero_app_preview.jpg" 
            alt="Vista previa de la aplicación BlisterCheck" 
            className="mockup-image"
          />
        </div>
      </header>

      {/* --- STATS / TRUST BAR --- */}
      <div className="trust-bar">
        <div className="trust-bar-container">
          <div className="trust-item">
            <h4>+25.000</h4>
            <p>Presentaciones Farmacéuticas</p>
          </div>
          <div className="trust-item">
            <h4>100% Oficial</h4>
            <p>Datos Directos de la AEMPS</p>
          </div>
          <div className="trust-item">
            <h4>Ahorro de Tiempo</h4>
            <p>Sin Reenvasados Innecesarios</p>
          </div>
          <div className="trust-item">
            <h4>SDMDU / SPD</h4>
            <p>Idoneidad Inmediata de Blíster</p>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 1: BUSCADOR AEMPS (SCROLL) --- */}
      <section className="landing-section" id="funciones">
        <div className="section-header">
          <span className="section-tag">Catálogo Inteligente</span>
          <h2>Búsqueda Avanzada y Diagnóstico de Blíster</h2>
          <p>
            Consulte cualquier especialidad farmacéutica por Código Nacional (CN), principio activo o nombre comercial y compruebe instantáneamente su aptitud para SDMDU.
          </p>
        </div>

        <div className="feature-row">
          <div className="feature-text-content">
            <div className="feature-icon-badge">
              <Search size={28} />
            </div>
            <h3>Información técnica completa al alcance de un clic</h3>
            <p>
              Acceda directamente a las fotografías oficiales de envase y forma farmacéutica, fichas técnicas en PDF, prospectos y estado de prescripción.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={18} /> Clasificación explícita: Apto Blíster, Reenvasado o Reetiquetado.</li>
              <li><CheckCircle2 size={18} /> Filtrado por vía de administración y forma farmacéutica simplificada.</li>
              <li><CheckCircle2 size={18} /> Marcado rápido de inventario local ("En mi farmacia").</li>
            </ul>
          </div>

          <div className="feature-card-visual">
            <img src="/images/hero_app_preview.jpg" alt="Buscador de medicamentos AEMPS" />
          </div>
        </div>
      </section>

      {/* --- SECCIÓN 2: OPTIMIZADOR EXCEL (SCROLL) --- */}
      <section className="landing-section" id="optimizador" style={{ backgroundColor: '#ffffff', borderRadius: '24px' }}>
        <div className="section-header">
          <span className="section-tag">Automatización de Guías</span>
          <h2>Optimizador de Guía Farmacoterapéutica</h2>
          <p>
            Suba su listado en Excel y deje que el motor inteligente analice toda su guía hospitalaria en segundos.
          </p>
        </div>

        <div className="feature-row reverse">
          <div className="feature-text-content">
            <div className="feature-icon-badge">
              <FileSpreadsheet size={28} />
            </div>
            <h3>Sugerencias clínicas de fármacos equivalentes</h3>
            <p>
              Para cada medicamento que requiera reenvasado, BlisterCheck busca automáticamente alternativas comercializadas con el mismo principio activo y dosis que ya vengan listas de fábrica en blíster unitario.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={18} /> Procesamiento por lotes de miles de Códigos Nacionales.</li>
              <li><CheckCircle2 size={18} /> Reducción drástica del gasto en material de reenvasado.</li>
              <li><CheckCircle2 size={18} /> Informe descargable listo para la comisión de farmacia.</li>
            </ul>
          </div>

          <div className="feature-card-visual">
            <img src="/images/excel_optimizer_preview.jpg" alt="Optimizador de Guía en Excel" />
          </div>
        </div>
      </section>

      {/* --- SECCIÓN 3: ESTADÍSTICAS Y CUADRO DE MANDO --- */}
      <section className="landing-section" id="estadisticas">
        <div className="section-header">
          <span className="section-tag">Trazabilidad y Métricas</span>
          <h2>Cuadro de Mando Analítico</h2>
          <p>
            Audite la calidad de su stock con indicadores cuantitativos del grado de optimización SDMDU de su centro.
          </p>
        </div>

        <div className="feature-row">
          <div className="feature-text-content">
            <div className="feature-icon-badge">
              <BarChart3 size={28} />
            </div>
            <h3>Informes agrupados por laboratorio y fabricante</h3>
            <p>
              Evalúe la tasa de idoneidad de los principales laboratorios proveedores y tome decisiones informadas durante los procesos de adquisición y concursos públicos.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={18} /> Gráficos de distribución de acondicionamiento primario.</li>
              <li><CheckCircle2 size={18} /> Exportación completa de clasificaciones a CSV/Excel.</li>
              <li><CheckCircle2 size={18} /> Puntuación de idoneidad SDMDU por laboratorio.</li>
            </ul>
          </div>

          <div className="feature-card-visual">
            <img src="/images/stats_dashboard_preview.jpg" alt="Cuadro de mando analítico" />
          </div>
        </div>
      </section>

      {/* --- SECCIÓN 4: TARJETAS DE CARACTERÍSTICAS INTERACTIVAS --- */}
      <section className="landing-section" id="garantias">
        <div className="section-header">
          <span className="section-tag">Rigor e Infraestructura</span>
          <h2>Construido para la exigencia médica</h2>
          <p>
            Seguridad de datos, actualización continua y máxima facilidad de integración.
          </p>
        </div>

        <div className="grid-3-col">
          <div className="interactive-card">
            <div className="card-icon">
              <Database size={24} />
            </div>
            <h4>Sincronización AEMPS</h4>
            <p>
              Base de datos sincronizada de forma transparente con la Agencia Española de Medicamentos y Productos Sanitarios.
            </p>
          </div>

          <div className="interactive-card">
            <div className="card-icon">
              <AlertTriangle size={24} />
            </div>
            <h4>Alertas de Desabastecimiento</h4>
            <p>
              Detección anticipada de problemas de suministro oficiales para planificar sustituciones antes de agotar stock.
            </p>
          </div>

          <div className="interactive-card">
            <div className="card-icon">
              <Lock size={24} />
            </div>
            <h4>Aislamiento Multi-Tenant</h4>
            <p>
              Sus datos e inventario local de farmacia están 100% aislados y protegidos por seguridad Row Level Security (RLS).
            </p>
          </div>
        </div>
      </section>

      {/* --- BOTTOM CTA BANNER --- */}
      <section className="bottom-cta-banner">
        <div className="bottom-cta-container">
          <h2>¿Listo para optimizar la gestión de SDMDU en su centro?</h2>
          <p>
            Únase a los profesionales de farmacia hospitalaria que ahorran tiempo y eliminan reenvasados innecesarios.
          </p>

          <div className="bottom-cta-actions">
            <button className="btn-hero-primary" onClick={onRegister}>
              Crear Cuenta Institucional <ArrowRight size={20} />
            </button>
            <button className="btn-hero-secondary" onClick={onLogin}>
              Iniciar Sesión
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="landing-footer-main">
        <div className="footer-logo">
          <ShieldCheck size={24} color="#0ea5e9" />
          <span>BlisterCheck © 2026</span>
        </div>
        <p>Sistema de optimización de acondicionado primario de medicamentos.</p>
      </footer>
    </div>
  );
}
