import React from 'react';
import { ShieldCheck, Activity, Database, FileSpreadsheet, BarChart, ArrowRight } from 'lucide-react';

export default function LandingPage({ onLogin, onRegister }) {
  return (
    <div className="landing-page">
      {/* Navegación Superior */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <ShieldCheck size={28} color="#2563eb" />
          <span>BlisterCheck</span>
        </div>
        <div className="landing-nav-actions">
          <button className="btn-ghost-pro" onClick={onLogin}>Iniciar Sesión</button>
          <button className="btn-solid-pro" onClick={onRegister}>Crear Cuenta</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="hero-pill">
          <Activity size={16} />
          <span>Gestión Clínica Avanzada</span>
        </div>
        <h1>
          Optimice su inventario para <br />
          <span className="text-primary-pro">Sistemas Personalizados de Dosificación</span>
        </h1>
        <p>
          BlisterCheck es la herramienta profesional que enlaza el catálogo oficial de la AEMPS con la gestión de SDMDU. Detecte de forma precisa qué medicamentos requieren reenvasado y descubra alternativas clínicas equivalentes.
        </p>
        <div className="hero-actions">
          <button className="btn-solid-pro btn-large-pro" onClick={onRegister} style={{ display: 'flex', alignItems: 'center' }}>
            Comenzar a optimizar <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </header>

      {/* Características / Beneficios */}
      <section className="landing-features">
        <div className="features-grid">
          
          <div className="feature-card-pro">
            <div className="feature-icon-wrapper-pro">
              <Database size={24} />
            </div>
            <h3>Catálogo Oficial AEMPS</h3>
            <p>
              Acceso indexado a miles de presentaciones farmacológicas. Consulte dosis, principios activos y verifique instantáneamente la aptitud de un medicamento para el envasado en SPD.
            </p>
          </div>

          <div className="feature-card-pro">
            <div className="feature-icon-wrapper-pro">
              <FileSpreadsheet size={24} />
            </div>
            <h3>Optimizador de Guía Farmacoterapéutica</h3>
            <p>
              Procese su guía en formato Excel. BlisterCheck evaluará los Códigos Nacionales (CN) y generará un informe de idoneidad, sugiriendo alternativas clínicas que eliminen la necesidad de reenvasado.
            </p>
          </div>

          <div className="feature-card-pro">
            <div className="feature-icon-wrapper-pro">
              <BarChart size={24} />
            </div>
            <h3>Métricas y Trazabilidad</h3>
            <p>
              Audite su inventario mediante paneles estadísticos rigurosos. Cuantifique la eficiencia de sus procesos de preparación y exporte los datos para el control de calidad interno.
            </p>
          </div>

        </div>
      </section>

      {/* Footer CTA */}
      <footer className="landing-footer">
        <h2>Eficiencia y rigor clínico para su centro</h2>
        <p>
          Una solución diseñada para el rigor de la gestión farmacéutica moderna.
        </p>
        <button className="btn-solid-pro btn-large-pro" onClick={onRegister}>
          Crear cuenta institucional
        </button>
      </footer>
    </div>
  );
}
