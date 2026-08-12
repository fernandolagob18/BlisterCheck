import React, { useState, useEffect } from 'react';
import {
  Search,
  FileSpreadsheet,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lock,
  Database,
  Sparkles,
  Check,
  RefreshCw,
  Upload,
  BookOpen,
  BarChart2,
  Download,
  ShieldCheck
} from 'lucide-react';
import '../../landing.css';

export default function LandingPage({ onLogin, onRegister }) {
  const [activeTab, setActiveTab] = useState('search');
  const [simQuery, setSimQuery] = useState('Paracetamol');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const mockMeds = [
    { cn: '654321', nombre: 'PARACETAMOL 1 g comprimidos EFG', lab: 'Laboratorio genérico A', via: 'Oral', dosis: '1000 mg', apto: true, tipo: 'Compatible con SDMDU', badge: 'demo-badge--apto' },
    { cn: '712384', nombre: 'OMEPRAZOL 20 mg cápsulas duras EFG', lab: 'Laboratorio genérico B', via: 'Oral', dosis: '20 mg', apto: true, tipo: 'Compatible con SDMDU', badge: 'demo-badge--apto' },
    { cn: '689102', nombre: 'ENALAPRIL 20 mg comprimidos EFG', lab: 'Laboratorio genérico C', via: 'Oral', dosis: '20 mg', apto: false, tipo: 'Requiere Reenvasado', badge: 'demo-badge--reenvasado' },
  ];

  const mockShortages = [
    { cn: '698123', nombre: 'AMOXICILINA 500 mg cápsulas EFG', inicio: '15/07/2026', fin: '30/08/2026', estado: 'Desabastecimiento oficial AEMPS' },
    { cn: '723910', nombre: 'VALSARTAN 160 mg comprimidos EFG', inicio: '02/08/2026', fin: '15/09/2026', estado: 'Suministro limitado por laboratorio' },
  ];

  const filtered = mockMeds.filter(m =>
    m.nombre.toLowerCase().includes(simQuery.toLowerCase()) || m.cn.includes(simQuery)
  );

  return (
    <div className="landing-page">

      {/* ── NAVBAR ── */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <a href="#" className="lp-logo">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="lp-logo-svg">
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
            <rect x="21" y="21" width="10" height="8" rx="3" fill="#0ea5e9"/>
            <polyline points="24,25.5 26,27.5 30,23.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="lp-logo-text">Blister<span>Check</span></span>
        </a>
        <div className="lp-nav-links">
          <a href="#funciones">Funciones</a>
          <a href="#colaborativo">Colaborativo</a>
          <a href="#demo">Demo</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#seguridad">Seguridad</a>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-login" onClick={onLogin}>Iniciar Sesión</button>
          <button className="lp-btn-register" onClick={onRegister}>Registrarse</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="lp-hero-wrapper">
        <div className="lp-hero">
          <div className="lp-hero-left">
            <div className="lp-hero-pill">
              <div className="lp-hero-pill-dot" />
              Conectado con AEMPS en tiempo real
            </div>
            <h1>
              La plataforma definitiva para clasificar medicamentos en{' '}
              <span className="highlight">blíster unitario</span>
            </h1>
            <p className="lp-hero-sub">
              BlisterCheck es la plataforma colaborativa donde los farmacéuticos hospitalarios clasifican sus medicamentos según su idoneidad para SDMDU y comparten ese conocimiento con toda la red. Cada clasificación enriquece un catálogo colectivo basado en el registro oficial de la AEMPS, construido entre todos.
            </p>
            <div className="lp-hero-ctas">
              <button className="lp-btn-primary" onClick={onRegister}>
                Crear cuenta gratuita <ArrowRight size={18} />
              </button>
              <button className="lp-btn-ghost" onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}>
                <Sparkles size={16} /> Ver demostración
              </button>
            </div>
            <div className="lp-hero-stats">
              <div className="lp-hero-stat">
                <span className="lp-hero-stat-val">27<span>.000+</span></span>
                <span className="lp-hero-stat-label">Presentaciones AEMPS</span>
              </div>
              <div className="lp-hero-stat">
                <span className="lp-hero-stat-val">3<span> tipos</span></span>
                <span className="lp-hero-stat-label">Reenvasado, reetiquetado y aptos para SDMDU</span>
              </div>
              <div className="lp-hero-stat">
                <span className="lp-hero-stat-val">100<span>%</span></span>
                <span className="lp-hero-stat-label">Datos oficiales</span>
              </div>
            </div>
          </div>
          <div className="lp-hero-right">
            {/* Replica fiel de la UI interna de la app */}
            <div className="lp-hero-app-mockup">
              {/* Sidebar */}
              <div className="lp-mock-sidebar">
                <div className="lp-mock-sidebar-logo">
                  <svg width="26" height="26" viewBox="0 0 38 38" fill="none">
                    <rect width="38" height="38" rx="9" fill="#0ea5e9"/>
                    <rect x="7" y="10" width="10" height="8" rx="3" fill="rgba(255,255,255,0.25)"/>
                    <rect x="21" y="10" width="10" height="8" rx="3" fill="rgba(255,255,255,0.25)"/>
                    <rect x="7" y="21" width="10" height="8" rx="3" fill="rgba(255,255,255,0.25)"/>
                    <ellipse cx="12" cy="14" rx="3" ry="2.5" fill="white"/>
                    <ellipse cx="26" cy="14" rx="3" ry="2.5" fill="rgba(255,255,255,0.5)"/>
                    <ellipse cx="12" cy="25" rx="3" ry="2.5" fill="rgba(255,255,255,0.5)"/>
                    <rect x="21" y="21" width="10" height="8" rx="3" fill="white"/>
                    <polyline points="24,25.5 26,27.5 30,23.5" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>BlisterCheck</span>
                </div>
                <div className="lp-mock-user">
                  <div className="lp-mock-avatar">F</div>
                  <div>
                    <div className="lp-mock-uname">Farmacéutico</div>
                    <div className="lp-mock-urole">Ver perfil</div>
                  </div>
                </div>
                <div className="lp-mock-nav-label">Módulos Clínicos</div>
                {[
                  { icon: <Search size={14} />, label: 'Catálogo CIMA', active: true },
                  { icon: <BookOpen size={14} />, label: 'Optimizador Guía', active: false },
                  { icon: <BarChart2 size={14} />, label: 'Estadísticas', active: false },
                ].map((item, i) => (
                  <div key={i} className={`lp-mock-nav-item ${item.active ? 'active' : ''}`}>
                    <span style={{ display: 'flex' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
                <div className="lp-mock-nav-label" style={{ marginTop: 6 }}>Herramientas</div>
                {[
                  { icon: <Upload size={14} />, label: 'Subir medicamentos' },
                  { icon: <Download size={14} />, label: 'Exportar Registro' },
                ].map((item, i) => (
                  <div key={i} className="lp-mock-nav-item">
                    <span style={{ display: 'flex' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Panel principal */}
              <div className="lp-mock-main">
                {/* Header */}
                <div className="lp-mock-header">
                  <span className="lp-mock-header-title">Catálogo de Medicamentos</span>
                  <div className="lp-mock-header-badge">27.553 registros</div>
                </div>

                {/* Buscador */}
                <div className="lp-mock-search">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span>Buscar por nombre, principio activo o CN…</span>
                </div>

                {/* Resultados */}
                <div className="lp-mock-results">
                  {[
                    { nombre: 'PARACETAMOL 1 g Comp. EFG', lab: 'Lab. Genérico A', badge: 'Apto SDMDU', badgeColor: '#dcfce7', badgeText: '#14532d', cn: '656428' },
                    { nombre: 'OMEPRAZOL 20 mg Cáps. EFG', lab: 'Lab. Genérico B', badge: 'Reenvasado', badgeColor: '#fef3c7', badgeText: '#78350f', cn: '731248' },
                    { nombre: 'ENALAPRIL 10 mg Comp. EFG', lab: 'Lab. Genérico C', badge: 'Apto SDMDU', badgeColor: '#dcfce7', badgeText: '#14532d', cn: '563291' },
                    { nombre: 'METFORMINA 850 mg Comp. EFG', lab: 'Lab. Genérico A', badge: 'Reetiquetado', badgeColor: '#f3e8ff', badgeText: '#581c87', cn: '612847' },
                  ].map((med, i) => (
                    <div key={i} className="lp-mock-result-row">
                      <div className="lp-mock-result-info">
                        <div className="lp-mock-result-name">{med.nombre}</div>
                        <div className="lp-mock-result-meta">CN {med.cn} · {med.lab}</div>
                      </div>
                      <span className="lp-mock-badge" style={{ background: med.badgeColor, color: med.badgeText }}>
                        {med.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ── */}
      <div className="lp-trust-bar">
        <div className="lp-trust-inner">
          <div className="lp-trust-item">
            <div className="lp-trust-icon" style={{ background: '#eff6ff', color: '#1e40af' }}><Database size={20} /></div>
            <h4>AEMPS Oficial</h4>
            <p>Catálogo CIMA sincronizado</p>
          </div>
          <div className="lp-trust-item">
            <div className="lp-trust-icon" style={{ background: '#f0fdf4', color: '#065f46' }}><CheckCircle2 size={20} /></div>
            <h4>Clasificación SDMDU</h4>
            <p>Apto · Reenvasado · Reetiquetado</p>
          </div>
          <div className="lp-trust-item">
            <div className="lp-trust-icon" style={{ background: '#fefce8', color: '#92400e' }}><AlertTriangle size={20} /></div>
            <h4>Alertas CIMA</h4>
            <p>Desabastecimientos en tiempo real</p>
          </div>
          <div className="lp-trust-item">
            <div className="lp-trust-icon" style={{ background: '#fdf4ff', color: '#7e22ce' }}><Lock size={20} /></div>
            <h4>Datos Protegidos</h4>
            <p>Aislamiento RLS por hospital</p>
          </div>
        </div>
      </div>

      {/* ── PROBLEMA / SOLUCIÓN ── */}
      <div className="lp-section lp-section--dark" id="funciones">
        <div className="lp-container">
          <div className="lp-section-header-center" style={{ marginBottom: '56px' }}>
            <div className="lp-section-tag">El problema que resolvemos</div>
            <h2 className="lp-section-title" style={{ color: 'white' }}>La gestión del SDMDU es compleja.<br />BlisterCheck la simplifica.</h2>
          </div>
          <div className="lp-problem-grid">
            <div className="lp-problem-card">
              <h3><span style={{ fontSize: '1.3rem' }}>❌</span> Sin BlisterCheck</h3>
              <ul className="lp-problem-list">
                {[
                  'Horas revisando manualmente cada presentación del catálogo',
                  'Incertidumbre sobre qué medicamentos necesitan reenvasado',
                  'Guías farmacoterapéuticas desactualizadas o incompletas',
                  'Sin visibilidad sobre desabastecimientos hasta que ocurren',
                  'Informes para la Comisión de Farmacia lentos y manuales',
                ].map((t, i) => (
                  <li key={i}>
                    <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px', fontSize: '1rem' }}>✗</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-problem-card lp-problem-card--solution">
              <h3><span style={{ fontSize: '1.3rem' }}>✅</span> Con BlisterCheck</h3>
              <ul className="lp-problem-list">
                {[
                  'Clasificación instantánea de cualquier CN: apto, reenvasado o reetiquetado',
                  'Búsqueda inteligente por nombre, principio activo o Código Nacional',
                  'Optimizador que analiza tu guía Excel entera en segundos',
                  'Alertas de desabastecimiento CIMA en tiempo real',
                  'Exportación a Excel/CSV con un clic para la Comisión de Farmacia',
                ].map((t, i) => (
                  <li key={i}>
                    <span style={{ color: '#059669', flexShrink: 0, marginTop: '2px', fontSize: '1rem' }}>✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES GRID ── */}
      <div className="lp-section lp-section--alt">
        <div className="lp-container">
          <div className="lp-section-header-center" style={{ marginBottom: '56px' }}>
            <div className="lp-section-tag">Funcionalidades</div>
            <h2 className="lp-section-title">Todo lo que necesita tu<br />servicio de farmacia</h2>
            <p className="lp-section-sub" style={{ textAlign: 'center' }}>
              Cuatro herramientas integradas diseñadas específicamente para el flujo de trabajo de la farmacia hospitalaria española.
            </p>
          </div>
          <div className="lp-features-grid">
            {[
              {
                icon: <Search size={22} color="#1e40af" />, bg: '#eff6ff',
                title: 'Catálogo AEMPS completo',
                desc: 'Accede a más de 27.000 presentaciones comercializadas en España. Busca por nombre, principio activo o Código Nacional y obtén la clasificación SDMDU en un instante.',
                bullets: ['Clasificación: Apto · Reenvasado · Reetiquetado', 'Ficha técnica y prospecto oficial AEMPS', 'Filtros por vía, forma farmacéutica y laboratorio'],
              },
              {
                icon: <FileSpreadsheet size={22} color="#065f46" />, bg: '#f0fdf4',
                title: 'Optimizador de Guía Excel',
                desc: 'Sube tu guía farmacoterapéutica en formato Excel o CSV y BlisterCheck la analiza entera automáticamente, sugiriendo alternativas ya envasadas en blíster unitario de fábrica.',
                bullets: ['Análisis de miles de registros en segundos', 'Sugerencias de equivalentes de fábrica', 'Informe descargable para la Comisión de Farmacia'],
              },
              {
                icon: <Database size={22} color="#7e22ce" />, bg: '#fdf4ff',
                title: 'Inventario privado de tu hospital',
                desc: 'Marca los medicamentos que dispones en tu farmacia como "En mi farmacia". Importa tu listado desde Excel con un solo clic y mantén siempre actualizado tu stock.',
                bullets: ['Marcado individual o carga masiva desde Excel', 'Notas privadas por medicamento', 'Estadísticas de cobertura de tu inventario'],
              },
              {
                icon: <AlertTriangle size={22} color="#92400e" />, bg: '#fefce8',
                title: 'Alertas de desabastecimiento',
                desc: 'Monitorización automática de las comunicaciones oficiales de suministro de la AEMPS. Anticípate a las rupturas de stock antes de que afecten a tu servicio.',
                bullets: ['Alertas en tiempo real desde CIMA', 'Fechas de inicio y fin previstas', 'Integrado en la ficha de cada medicamento'],
              },
            ].map((f, i) => (
              <div className="lp-feature-card" key={i}>
                <div className="lp-feature-icon" style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <ul className="lp-feature-bullets">
                  {f.bullets.map((b, j) => (
                    <li key={j}><CheckCircle2 size={14} style={{ color: '#059669', flexShrink: 0 }} />{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── COLABORATIVO ── */}
      <div className="lp-section lp-collab-section" id="colaborativo">
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

            {/* Izquierda: texto */}
            <div>
              <div className="lp-section-tag">Inteligencia colaborativa</div>
              <h2 className="lp-section-title">Cada clasificación mejora<br />la experiencia de todos</h2>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.7, margin: '0 0 32px' }}>
                BlisterCheck es una plataforma <strong>viva y colaborativa</strong>. Cuando un farmacéutico hospitalario clasifica un medicamento como apto, reenvasado o reetiquetado, esa información queda disponible para el resto de hospitales en tiempo real, creando una base de conocimiento colectiva en constante crecimiento.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: <CheckCircle2 size={20} color="#0284c7" />, bg: '#eff6ff', title: 'Tu clasificación, disponible al instante', desc: 'Cada vez que clasificas un medicamento en tu hospital, esa información se propaga a toda la red de farmacias.' },
                  { icon: <BarChart3 size={20} color="#059669" />, bg: '#f0fdf4', title: 'El catálogo crece contigo', desc: 'Cuantos más hospitales participan, más completo está el catálogo. Las presentaciones sin clasificar van desapareciendo progresivamente.' },
                  { icon: <Lock size={20} color="#7e22ce" />, bg: '#fdf4ff', title: 'Tu inventario privado permanece tuyo', desc: 'Las clasificaciones clínicas se comparten. Tu stock privado "En mi farmacia" y tus notas son exclusivamente de tu hospital.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: item.bg, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: '0.87rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Derecha: diagrama visual de red */}
            <div className="lp-collab-diagram">
              {/* Nodo central: BlisterCheck */}
              <div className="lp-collab-center">
                <svg width="28" height="28" viewBox="0 0 38 38" fill="none">
                  <rect width="38" height="38" rx="9" fill="white"/>
                  <rect x="7" y="10" width="10" height="8" rx="3" fill="rgba(14,165,233,0.3)"/>
                  <rect x="21" y="10" width="10" height="8" rx="3" fill="rgba(14,165,233,0.3)"/>
                  <rect x="7" y="21" width="10" height="8" rx="3" fill="rgba(14,165,233,0.3)"/>
                  <rect x="21" y="21" width="10" height="8" rx="3" fill="white"/>
                  <ellipse cx="12" cy="14" rx="3" ry="2.5" fill="#0ea5e9"/>
                  <polyline points="24,25.5 26,27.5 30,23.5" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>BlisterCheck</span>
              </div>

              {/* Nodos satélite: hospitales */}
              {[
                { label: 'H. Universitario Norte', top: '8%', left: '50%', transform: 'translateX(-50%)', delay: '0s', color: '#10b981' },
                { label: 'H. General Comarcal', top: '28%', right: '4%', delay: '0.4s', color: '#0ea5e9' },
                { label: 'H. Clínico Regional', bottom: '12%', right: '8%', delay: '0.8s', color: '#10b981' },
                { label: 'H. de Especialidades', bottom: '8%', left: '50%', transform: 'translateX(-50%)', delay: '1.2s', color: '#0ea5e9' },
                { label: 'H. Universitario Sur', bottom: '28%', left: '4%', delay: '1.6s', color: '#10b981' },
                { label: 'H. Materno-Infantil', top: '28%', left: '4%', delay: '2s', color: '#0ea5e9' },
              ].map((node, i) => (
                <div
                  key={i}
                  className="lp-collab-node"
                  style={{ top: node.top, left: node.left, right: node.right, bottom: node.bottom, transform: node.transform, animationDelay: node.delay }}
                >
                  <div className="lp-collab-node-icon" style={{ background: node.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <span className="lp-collab-node-label">{node.label}</span>
                </div>
              ))}

              {/* Notificación flotante animada */}
              <div className="lp-collab-toast lp-collab-toast--1">
                <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>METFORMINA 850 mg clasificada como <strong>Compatible SDMDU</strong></span>
              </div>
              <div className="lp-collab-toast lp-collab-toast--2">
                <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>BISOPROLOL 5 mg · Requiere <strong>Reenvasado</strong> · 4 hospitales confirmaron</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── DEMO INTERACTIVA ── */}
      <div className="lp-section lp-section--dark" id="demo">
        <div className="lp-container">
          <div className="lp-section-header-center" style={{ marginBottom: '48px' }}>
            <div className="lp-section-tag">
              <span style={{ color: '#0ea5e9', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ display: 'inline-block', width: 18, height: 2, background: '#0ea5e9', borderRadius: 2 }} />
                Demo interactiva
              </span>
            </div>
            <h2 className="lp-section-title" style={{ color: 'white' }}>Así se ve BlisterCheck por dentro</h2>
            <p className="lp-section-sub" style={{ textAlign: 'center', color: '#94a3b8' }}>
              Interfaz real de la aplicación. Explora el buscador, la ficha de medicamento, las alertas y el cuadro de mando.
            </p>
          </div>

          {/* Marco de navegador */}
          <div className="lp-demo-wrapper">
            <div className="lp-demo-header">
              <div className="lp-demo-dots">
                <div className="lp-demo-dot lp-demo-dot--red" />
                <div className="lp-demo-dot lp-demo-dot--yellow" />
                <div className="lp-demo-dot lp-demo-dot--green" />
              </div>

              <div className="lp-demo-status">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                AEMPS conectado
              </div>
            </div>

            {/* Pestañas */}
            <div className="lp-demo-tabs">
              {[
                { key: 'search', label: 'Buscador', icon: <Search size={14} /> },
                { key: 'detalle', label: 'Ficha del medicamento', icon: <ShieldCheck size={14} /> },
                { key: 'shortages', label: 'Alertas CIMA', icon: <AlertTriangle size={14} /> },
                { key: 'stats', label: 'Estadísticas', icon: <BarChart3 size={14} /> },
              ].map(t => (
                <button key={t.key} className={`lp-demo-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Viewport */}
            <div className="lp-demo-viewport">

              {/* TAB: Buscador */}
              {activeTab === 'search' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Catálogo BlisterCheck</h3>
                      <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>27.553 presentaciones · Busca por nombre, principio activo o CN</p>
                    </div>
                    <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>Demo interactiva</span>
                  </div>
                  <div className="demo-search-bar">
                    <Search size={17} style={{ color: '#94a3b8' }} />
                    <input type="text" value={simQuery} onChange={e => setSimQuery(e.target.value)} placeholder="Busca por nombre, principio activo o Código Nacional…" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.length === 0
                      ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>Sin resultados. Prueba "Paracetamol", "Omeprazol" o "Enalapril".</p>
                      : filtered.map(m => (
                          <div key={m.cn} style={{ display: 'flex', alignItems: 'stretch', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                            <div style={{ width: 5, flexShrink: 0, background: m.apto ? '#10b981' : '#f59e0b' }} />
                            <div style={{ padding: '12px 16px', flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>CN {m.cn}</span>
                                  {m.apto && <span style={{ background: '#f0fdf4', color: '#065f46', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>Candidato SDMDU</span>}
                                </div>
                                <span className={`demo-badge ${m.badge}`}>
                                  {m.apto ? <Check size={11} /> : <AlertTriangle size={11} />}
                                  {m.tipo}
                                </span>
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 5 }}>{m.nombre}</div>
                              <div style={{ display: 'flex', gap: 14, fontSize: '0.78rem', color: '#64748b' }}>
                                <span><strong style={{ color: '#94a3b8' }}>Lab:</strong> {m.lab}</span>
                                <span><strong style={{ color: '#94a3b8' }}>Dosis:</strong> {m.dosis}</span>
                                <span><strong style={{ color: '#94a3b8' }}>Vía:</strong> {m.via}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12, color: '#cbd5e1', fontSize: '1.2rem', fontWeight: 700 }}>›</div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}

              {/* TAB: Ficha del medicamento */}
              {activeTab === 'detalle' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Columna izquierda */}
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#0284c7', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', marginBottom: 14, padding: 0 }}>
                      ‹ Volver a resultados
                    </button>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>PARACETAMOL 1 g comprimidos EFG</h3>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, marginBottom: 14 }}>
                      💊 Candidato para SDMDU por forma farmacéutica
                    </div>
                    {[
                      ['Cód. Nacional', '654321'], ['Laboratorio', 'Laboratorio genérico A'], ['Dosis', '1000 mg'],
                      ['Principio activo', 'Paracetamol'], ['Forma farmacéutica', 'COMPRIMIDO'],
                      ['Vía de adm.', 'Oral'], ['Prescripción', 'Con receta médica'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', padding: '6px 0', fontSize: '0.82rem' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>{k}</span>
                        <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: k === 'Cód. Nacional' ? 'monospace' : 'inherit' }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <a href="#" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>📄 Ficha Técnica</a>
                      <a href="#" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>📖 Prospecto</a>
                    </div>
                  </div>
                  {/* Columna derecha: clasificación */}
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af' }}>
                        <ShieldCheck size={16} />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Clasificación BlisterCheck</h3>
                    </div>
                    {[
                      { label: 'Requiere Reenvasado', desc: 'El envase original no es apto para dosis unitaria', val: false },
                      { label: 'Requiere Reetiquetado', desc: 'Necesita etiqueta adicional con nombre, lote o caducidad', val: false },
                      { label: 'Compatible con SDMDU', desc: 'Blíster fraccionable correctamente identificado', val: true },
                    ].map((item, i) => (
                      <div key={i} style={{ borderBottom: i < 2 ? '1px solid #e2e8f0' : 'none', paddingBottom: i < 2 ? 12 : 0, marginBottom: i < 2 ? 12 : 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 7 }}>{item.desc}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { l: 'Sí', active: item.val === true, col: '#059669', bg: '#f0fdf4' },
                            { l: 'No', active: item.val === false, col: '#dc2626', bg: '#fef2f2' },
                            { l: '—', active: item.val === null, col: '#64748b', bg: '#f1f5f9' },
                          ].map((b, j) => (
                            <span key={j} style={{ padding: '4px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, background: b.active ? b.bg : '#f8fafc', color: b.active ? b.col : '#94a3b8', border: `1px solid ${b.active ? b.col + '40' : '#e2e8f0'}`, cursor: 'pointer' }}>
                              {b.l}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={12} color="white" />
                        </div>
                        En mi farmacia
                      </label>
                      <button style={{ background: 'linear-gradient(135deg, #0b192c, #0284c7)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                        Guardar clasificación
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Alertas CIMA */}
              {activeTab === 'shortages' && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={18} style={{ color: '#f59e0b' }} /> Alertas de Desabastecimiento (CIMA)
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Monitorización automática de la AEMPS para evitar rupturas de stock</p>
                  </div>
                  {mockShortages.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'stretch', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ width: 5, background: '#f59e0b', flexShrink: 0 }} />
                      <div style={{ padding: '14px 18px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400e' }}>⚠️ CN {item.cn}</span>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#78350f', margin: '3px 0' }}>{item.nombre}</div>
                          <span style={{ fontSize: '0.78rem', color: '#92400e' }}>{item.estado}</span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#92400e' }}>
                          <div><strong>Inicio:</strong> {item.inicio}</div>
                          <div><strong>Previsto:</strong> {item.fin}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB: Estadísticas */}
              {activeTab === 'stats' && (
                <div>
                  <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Cuadro de Mando — Idoneidad SDMDU</h3>
                  <div className="demo-stats-grid">
                    <div className="demo-stat-card" style={{ borderTop: '3px solid #10b981' }}>
                      <span className="val" style={{ color: '#059669' }}>78.4%</span>
                      <span className="lbl">Compatible con SDMDU</span>
                    </div>
                    <div className="demo-stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
                      <span className="val" style={{ color: '#d97706' }}>18.2%</span>
                      <span className="lbl">Requiere Reenvasado</span>
                    </div>
                    <div className="demo-stat-card" style={{ borderTop: '3px solid #0284c7' }}>
                      <span className="val" style={{ color: '#0284c7' }}>3.4%</span>
                      <span className="lbl">Requiere Reetiquetado</span>
                    </div>
                  </div>
                  <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 18px', border: '1px solid #a7f3d0', marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#065f46', fontWeight: 500, lineHeight: 1.55 }}>
                      <strong>Resultado del análisis:</strong> El 78.4% de tu stock puede dispensarse directamente en SDMDU sin manipulación adicional. Se han identificado 42 medicamentos candidatos a sustitución por equivalentes con blíster unitario de fábrica.
                    </p>
                  </div>
                </div>
              )}

            </div>{/* /lp-demo-viewport */}
          </div>{/* /lp-demo-wrapper */}
        </div>{/* /lp-container */}
      </div>{/* /lp-section--dark */}

      {/* ── CÓMO FUNCIONA ── */}
      <div className="lp-section lp-section--alt" id="como-funciona">
        <div className="lp-container">
          <div className="lp-section-header-center" style={{ marginBottom: '64px' }}>
            <div className="lp-section-tag">Proceso</div>
            <h2 className="lp-section-title">Tres pasos para optimizar tu SDMDU</h2>
          </div>
          <div className="lp-steps">
            {[
              { num: '1', title: 'Busca o sube tu guía', desc: 'Busca medicamentos individualmente por nombre o Código Nacional, o sube toda tu guía farmacoterapéutica en formato Excel.' },
              { num: '2', title: 'BlisterCheck clasifica', desc: 'Nuestro motor cruza los datos con el catálogo oficial AEMPS y clasifica automáticamente cada presentación: Apta, Reenvasado o Reetiquetado.' },
              { num: '3', title: 'Exporta e implementa', desc: 'Descarga el informe completo en Excel, compártelo con la Comisión de Farmacia y aplica las optimizaciones directamente en tu stock.' },
            ].map((s, i) => (
              <div className="lp-step" key={i}>
                <div className="lp-step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SEGURIDAD ── */}
      <div className="lp-section lp-section--dark" id="seguridad">
        <div className="lp-container">
          <div className="lp-section-header-center" style={{ marginBottom: '56px' }}>
            <div className="lp-section-tag">
              <span style={{ color: '#0ea5e9', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ display: 'inline-block', width: 18, height: 2, background: '#0ea5e9', borderRadius: 2 }} />
                Infraestructura
              </span>
            </div>
            <h2 className="lp-section-title">Seguridad de grado hospitalario</h2>
            <p className="lp-section-sub" style={{ textAlign: 'center' }}>
              Los datos de tu hospital son privados, aislados y protegidos bajo los más altos estándares de la industria sanitaria.
            </p>
          </div>
          <div className="lp-security-grid">
            {[
              { icon: <Database size={22} />, title: 'Sincronización directa AEMPS', desc: 'Conexión automatizada con la API oficial del CIMA de la Agencia Española de Medicamentos. Los datos están siempre actualizados.' },
              { icon: <Lock size={22} />, title: 'Aislamiento Multi-Tenant (RLS)', desc: 'Los datos privados de cada hospital están protegidos mediante políticas Row Level Security en base de datos. Nadie más puede ver tu inventario.' },
              { icon: <RefreshCw size={22} />, title: 'Actualización continua 24/7', desc: 'Las alertas de desabastecimiento y los cambios en el catálogo AEMPS se sincronizan automáticamente. Siempre trabajas con datos en vigor.' },
            ].map((c, i) => (
              <div className="lp-security-card" key={i}>
                <div className="lp-security-icon">{c.icon}</div>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div className="lp-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 16px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, color: 'white', marginBottom: 24, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <ShieldCheck size={14} /> Acceso gratuito
          </div>
          <h2 className="lp-section-title" style={{ color: 'white', marginBottom: 16 }}>
            ¿Listo para optimizar tu servicio de farmacia?
          </h2>
          <p style={{ fontSize: '1.08rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px' }}>
            Únete a los farmacéuticos hospitalarios que ya clasifican su catálogo con BlisterCheck y ahorran horas de trabajo cada semana.
          </p>
          <div className="lp-cta-actions">
            <button className="lp-btn-cta-primary" onClick={onRegister}>
              Crear cuenta gratuita <ArrowRight size={18} />
            </button>
            <button className="lp-btn-cta-ghost" onClick={onLogin}>
              Ya tengo cuenta · Iniciar sesión
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <svg width="30" height="30" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 7, flexShrink: 0 }}>
            <rect width="38" height="38" rx="9" fill="#0ea5e9"/>
            <rect x="7" y="10" width="10" height="8" rx="3" fill="rgba(255,255,255,0.25)"/>
            <rect x="21" y="10" width="10" height="8" rx="3" fill="rgba(255,255,255,0.25)"/>
            <rect x="7" y="21" width="10" height="8" rx="3" fill="rgba(255,255,255,0.25)"/>
            <ellipse cx="12" cy="14" rx="3" ry="2.5" fill="white"/>
            <ellipse cx="26" cy="14" rx="3" ry="2.5" fill="rgba(255,255,255,0.5)"/>
            <ellipse cx="12" cy="25" rx="3" ry="2.5" fill="rgba(255,255,255,0.5)"/>
            <rect x="21" y="21" width="10" height="8" rx="3" fill="white"/>
            <polyline points="24,25.5 26,27.5 30,23.5" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="lp-footer-logo-text">Blister<span>Check</span></span>
        </div>
        <p className="lp-footer-copy">
          © 2026 BlisterCheck · Sistema de Clasificación SDMDU · Datos sincronizados con AEMPS/CIMA
        </p>
      </footer>

    </div>
  );
}
