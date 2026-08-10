import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, UploadCloud, Cpu, Layers, ArrowRight } from 'lucide-react';
import '../../landing.css';

export default function LandingPage({ onLogin, onRegister }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="landing-page">
      {/* Navegación Superior */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <ShieldCheck size={28} color="#0ea5e9" />
          <span>BlisterCheck</span>
        </div>
        <div className="landing-nav-actions">
          <button className="btn-ghost-pro" onClick={onLogin}>Iniciar Sesión</button>
          <button className="btn-solid-pro" onClick={onRegister}>Crear Cuenta</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero" style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.8s ease' }}>
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
          <button className="btn-ghost-pro btn-large-pro" onClick={onLogin}>
            Ya tengo cuenta
          </button>
        </div>
      </header>

      {/* Características / Beneficios Interactivo */}
      <section className="landing-features">
        <div className="features-header">
          <h2>¿Cómo funciona BlisterCheck?</h2>
          <p>Un flujo de trabajo diseñado para ahorrar horas de gestión en su farmacia o centro médico.</p>
        </div>
        
        <div className="steps-grid">
          
          <div className="step-card" style={{ animationDelay: '0.1s', animation: 'fadeUp 0.8s ease-out backwards' }}>
            <div className="step-number">1</div>
            <UploadCloud size={32} className="step-icon" />
            <h3>Sube tu Guía</h3>
            <p>
              Importa directamente tu Guía Farmacoterapéutica en formato Excel. Sin plantillas estrictas, nuestro sistema escanea y localiza automáticamente los Códigos Nacionales (CN).
            </p>
          </div>

          <div className="step-card" style={{ animationDelay: '0.3s', animation: 'fadeUp 0.8s ease-out backwards' }}>
            <div className="step-number">2</div>
            <Cpu size={32} className="step-icon" />
            <h3>Análisis Inteligente</h3>
            <p>
              El motor de BlisterCheck cruza tus medicamentos con los datos oficiales de la AEMPS en tiempo real, identificando al instante cuáles requieren costosos procesos de reenvasado.
            </p>
          </div>

          <div className="step-card" style={{ animationDelay: '0.5s', animation: 'fadeUp 0.8s ease-out backwards' }}>
            <div className="step-number">3</div>
            <Layers size={32} className="step-icon" />
            <h3>Alternativas Listas</h3>
            <p>
              Obtén un informe con alternativas clínicamente idénticas (mismo principio activo y dosis) que ya vienen preparadas de fábrica en formato blíster apto para SPD directo.
            </p>
          </div>

        </div>
      </section>

      {/* Footer CTA */}
      <footer className="landing-footer">
        <h2>Eficiencia y rigor clínico para su centro</h2>
        <p>
          Únase a los profesionales que ya han optimizado su flujo de trabajo.
        </p>
        <button className="btn-solid-pro btn-large-pro" onClick={onRegister}>
          Crear cuenta institucional
        </button>
      </footer>
    </div>
  );
}
