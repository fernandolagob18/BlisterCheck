import React, { useState } from 'react';
import {
  Leaf, AlertTriangle, BookOpen, ExternalLink,
  ChevronDown, ChevronUp, CheckCircle, Info, Zap, Package
} from 'lucide-react';

/* ─── Datos de materiales (fuentes oficiales) ──────────────────────────────── */
const MATERIALES = [
  {
    nombre: 'Aluminio (lámina blíster)',
    factor: '6,3 kg CO₂e/kg',
    fuente: 'European Aluminium Association (2024)',
    url: 'https://european-aluminium.eu/resource/environmental-profile-report/',
    color: '#e8f4f8',
    border: '#7ecae4',
    nota: 'Aluminio primario de producción europea. El aluminio reciclado puede reducir hasta un 95 % esta cifra.',
    fiabilidad: 'SECTORIAL',
  },
  {
    nombre: 'Plástico HDPE (frascos)',
    factor: '~1,9–3,1 kg CO₂e/kg',
    fuente: 'PlasticsEurope Eco-profiles (2022/2026)',
    url: 'https://lci-plasticseurope.org/',
    color: '#f0fdf4',
    border: '#86efac',
    nota: 'Rango típico cuna a puerta. Varía según la versión del eco-perfil y la energía del proceso.',
    fiabilidad: 'SECTORIAL',
  },
  {
    nombre: 'Electricidad (España)',
    factor: '0,258 kg CO₂e/kWh',
    fuente: 'MITECO — Factor de emisión mix nacional 2025',
    url: 'https://www.miteco.gob.es/es/cambio-climatico/temas/mitigacion-politicas-y-medidas/calculadoras.html',
    color: '#fffbeb',
    border: '#fbbf24',
    nota: 'Factor oficial del Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO). Aplicable a la energía consumida por la maquinaria de reenvasado.',
    fiabilidad: 'OFICIAL',
  },
];

/* ─── Opciones de acondicionamiento (ranking) ────────────────────────────── */
const OPCIONES = [
  {
    id: 'frasco',
    label: 'Frasco original comercial (HDPE/PP)',
    rank: 1,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#6ee7b7',
    descripcion: 'Utilizar el frasco comercial sin intervención hospitalaria. El acondicionamiento primario ya está optimizado por el laboratorio fabricante.',
    pros: ['Cero material nuevo generado en el hospital', 'No requiere energía adicional de reenvasado', 'El polietileno de alta densidad (HDPE) tiene la menor huella por dosis debido al formato granel'],
    contras: ['No siempre viable en los Sistemas de Dispensación en Dosis Unitaria (SDMDU)', 'Puede requerir reetiquetado de la dosis individual'],
    referencia: 'Impacto estimado: ~ 1.5 g CO₂e/dosis (PlasticsEurope 2022)',
  },
  {
    id: 'zip-frasco',
    label: 'Reenvasado en bolsa zip PE (desde frasco)',
    rank: 2,
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#a7f3d0',
    descripcion: 'Dispensar dosis individuales en bolsas de polietileno (PE) partiendo de un frasco a granel. Suma el frasco desechado/reciclado más la nueva bolsa.',
    pros: ['Menor material por unidad que el reenvasado en Alu/PVC', 'Sin necesidad de maquinaria termoselladora', 'Aprovecha la baja huella inicial del frasco comercial'],
    contras: ['No garantiza la misma estabilidad original', 'Aumenta el riesgo de contaminación', 'No válido para fármacos fotosensibles/higroscópicos'],
    referencia: 'Impacto acumulado estimado: ~ 2.5 g CO₂e/dosis',
  },
  {
    id: 'blister-comercial',
    label: 'Blíster comercial (Aluminio + PVC/PVdC)',
    rank: 3,
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#93c5fd',
    descripcion: 'Mantener el blíster comercial original sin modificar. Tiene mayor huella que el frasco por dosis al contener lámina de aluminio intensiva en energía.',
    pros: ['Máxima protección garantizada por el fabricante', 'Mantiene la vida útil y caducidad oficial intactas', 'Cero residuos hospitalarios añadidos'],
    contras: ['No siempre está troquelado para SDMDU unitario', 'Mayor impacto original que el formato frasco granel'],
    referencia: 'Impacto estimado: ~ 4.0 g CO₂e/dosis (European Aluminium Association / PlasticsEurope)',
  },
  {
    id: 'reetiquetado',
    label: 'Reetiquetado del blíster comercial',
    rank: 4,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    descripcion: 'Añadir una etiqueta adhesiva sobre el blíster comercial intacto (sin abrirlo ni reenvasarlo).',
    pros: ['Solo se añade el peso de la etiqueta adhesiva (< 1 g)', 'Se conserva la integridad del blíster del fabricante', 'Menor generación de residuos hospitalarios respecto a reenvasar'],
    contras: ['Puede no adaptarse a todos los formatos de blíster', 'Requiere control estricto de la legibilidad de la etiqueta original'],
    referencia: 'Impacto acumulado estimado: ~ 4.5 g CO₂e/dosis',
  },
  {
    id: 'zip-blister',
    label: 'Reenvasado en bolsa zip PE (desde blíster)',
    rank: 5,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
    descripcion: 'Desblistar un medicamento comercial y meterlo en una bolsa zip. Destruye la protección térmica de alto impacto inicial para sustituirla por plástico de bajo impacto.',
    pros: ['Puede facilitar la logística interna en sistemas automatizados simples'],
    contras: ['Desperdicia totalmente la huella climática del envase primario comercial', 'Degrada la estabilidad y protección frente a humedad/luz'],
    referencia: 'Impacto acumulado estimado: ~ 5.0 g CO₂e/dosis (Blíster desechado + Bolsa PE)',
  },
  {
    id: 'reenvasado-hosp',
    label: 'Reenvasado hospitalario (Aluminio + PVC)',
    rank: 6,
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fca5a5',
    descripcion: 'Reenvasado en lámina de aluminio + PVC termosellable partiendo de blíster o frasco. Suma el envase comercial original desechado, el nuevo material y la energía de la máquina.',
    pros: ['Permite la dispensación unitaria perfecta y estandarizada', 'Compatible con armarios dispensadores'],
    contras: ['Doble impacto: desperdicia el envase comercial original + requiere nuevo material intensivo', 'Consume electricidad (factor MITECO 0,258 kg CO₂e/kWh)', 'Genera residuos de materiales mixtos (Al+Plástico) muy difíciles de reciclar'],
    referencia: 'Impacto acumulado estimado: ~ 7.0 a 9.5 g CO₂e/dosis (según envase de origen)',
  },
];

/* ─── Estudio SEFH ─────────────────────────────────────────────────────────── */
const SEFH_DATA = {
  hospitales: 15,
  comprimidosNoRenvasados: '1,27 millones',
  materialEvitado: '17 km',
  residuosEvitados: '866 kg',
  fuente: 'Proyecto "No reenvases sin necesidad" — Revista Farmacia Hospitalaria, 2026',
};

/* ─── Referencias bibliográficas ─────────────────────────────────────────── */
const REFERENCIAS = [
  {
    autores: 'Alfred Health Pharmacy / University of Melbourne',
    titulo: 'The carbon footprint of different medication packaging items at an Australian tertiary hospital',
    anio: '2023',
    tipo: 'Revisión por pares',
    url: 'https://doi.org/10.1002/jppr.70044',
    hallazgo: 'Estudio LCA detallado que cuantifica las emisiones CO₂e por dosis unitaria. Concluye que los frascos (bottles) presentan una huella de carbono significativamente inferior a los blísteres por dosis, y destaca el impacto de evitar material innecesario.',
  },
  {
    autores: 'European Aluminium Association',
    titulo: 'Environmental Profile Report 2024',
    anio: '2024',
    tipo: 'Sectorial oficial',
    url: 'https://european-aluminium.eu/resource/environmental-profile-report/',
    hallazgo: 'Aluminio primario europeo: 6,3 kg CO₂e/kg (dato cuna a puerta, producción europea media).',
  },
  {
    autores: 'PlasticsEurope',
    titulo: 'Eco-profiles de plásticos (HDPE, PVC, PE)',
    anio: '2022–2026',
    tipo: 'Sectorial oficial',
    url: 'https://lci-plasticseurope.org/',
    hallazgo: 'Eco-profiles de Inventario de Ciclo de Vida (LCI) cuna a puerta para polímeros europeos. HDPE: rango 1,9–3,1 kg CO₂e/kg según versión.',
  },
  {
    autores: 'MITECO (Ministerio para la Transición Ecológica y el Reto Demográfico)',
    titulo: 'Factores de emisión de CO₂ para el sector eléctrico español',
    anio: '2025',
    tipo: 'Regulador oficial',
    url: 'https://www.miteco.gob.es/es/cambio-climatico/temas/mitigacion-politicas-y-medidas/calculadoras.html',
    hallazgo: 'Factor de emisión mix eléctrico nacional España 2025: 0,258 kg CO₂e/kWh.',
  },
  {
    autores: 'SEFH — Sociedad Española de Farmacia Hospitalaria',
    titulo: 'No reenvases sin necesidad — Evaluación del impacto en 15 hospitales',
    anio: '2026',
    tipo: 'Revisión por pares',
    url: 'https://www.sefh.es',
    hallazgo: '1,27 M comprimidos no reenvasados, 17 km de material evitado, 866 kg de residuos reducidos en 15 hospitales.',
  },
  {
    autores: 'SIGRE Medicamento y Medio Ambiente',
    titulo: 'Informe anual de ecodiseño de envases farmacéuticos',
    anio: '2024',
    tipo: 'Sectorial oficial',
    url: 'https://www.sigre.es',
    hallazgo: 'Más de 3.900 medidas de ecodiseño, peso medio de envase reducido más de un 25 % desde 2000, más de 85.000 t CO₂e acumuladas evitadas.',
  },
];

/* ─── Componente principal ────────────────────────────────────────────────── */
export default function SostenibilidadPage() {
  const [expandedRef, setExpandedRef] = useState(null);
  const [activeTab, setActiveTab] = useState('situacion');

  const tabs = [
    { id: 'situacion', label: 'Situación', icon: <Info size={15} /> },
    { id: 'materiales', label: 'Materiales', icon: <Zap size={15} /> },
    { id: 'opciones', label: 'Opciones', icon: <Package size={15} /> },
    { id: 'referencias', label: 'Referencias', icon: <BookOpen size={15} /> },
  ];

  return (
    <div className="eco-page">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="eco-hero">
        <div className="eco-hero__image-wrap">
          <img
            src="/eco_pharmacy_hero.jpg"
            alt="Farmacéutico con blíster y planta — sostenibilidad farmacéutica"
            className="eco-hero__img"
          />
          <div className="eco-hero__overlay" />
        </div>
        <div className="eco-hero__content">
          <div className="eco-hero__badge">
            <Leaf size={14} />
            <span>Sostenibilidad</span>
          </div>
          <h1 className="eco-hero__title">
            Sostenibilidad del<br />Reenvasado y Reetiquetado
          </h1>
          <p className="eco-hero__subtitle">
            Impacto ambiental del acondicionamiento de medicamentos en el hospital
          </p>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────── */}
      <div className="eco-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`eco-tab ${activeTab === tab.id ? 'eco-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="eco-content">

        {/* ── TAB: SITUACIÓN ──────────────────────────────────────────── */}
        {activeTab === 'situacion' && (
          <div className="eco-section-group">
            <div className="eco-text-section">
              <h2 className="eco-section-title">
                ¿Por qué importa el envase farmacéutico?
              </h2>
              <p className="eco-body">
                El sector sanitario representa aproximadamente el <strong>4-5 % de las emisiones
                globales de CO₂e</strong>. Dentro de este sector, los medicamentos y su ciclo de
                vida —incluyendo su envase— son una parte significativa de esa huella.
                En el ámbito hospitalario, la farmacia tiene un rol decisivo: la elección de
                <strong> cómo se acondiciona y dispensa cada dosis</strong> tiene consecuencias
                ambientales directas.
              </p>
              <p className="eco-body">
                El reenvasado hospitalario —necesario en muchos contextos de los Sistemas de
                Dispensación en Dosis Unitaria (SDMDU)— implica la generación de un{' '}
                <strong>nuevo envase</strong> de aluminio y plástico PVC que se suma al envase
                original del laboratorio. Cuando esto no es estrictamente necesario, supone un
                incremento evitable de la huella de carbono.
              </p>

              <div className="eco-highlight-box">
                <div className="eco-highlight-box__icon-wrap">
                  <Leaf size={20} />
                </div>
                <div>
                  <strong>Proyecto "No reenvases sin necesidad" (SEFH, 2026)</strong>
                  <p>
                    Un estudio con <strong>{SEFH_DATA.hospitales} hospitales españoles</strong> demostró
                    que aplicando criterios de selección de blísteres aptos para SDMDU, fue posible
                    evitar:
                  </p>
                  <div className="eco-stats-row">
                    <div className="eco-stat-pill">
                      <span className="eco-stat-pill__value">{SEFH_DATA.comprimidosNoRenvasados}</span>
                      <span className="eco-stat-pill__label">comprimidos no reenvasados</span>
                    </div>
                    <div className="eco-stat-pill">
                      <span className="eco-stat-pill__value">{SEFH_DATA.materialEvitado}</span>
                      <span className="eco-stat-pill__label">de material de reenvasado</span>
                    </div>
                    <div className="eco-stat-pill">
                      <span className="eco-stat-pill__value">{SEFH_DATA.residuosEvitados}</span>
                      <span className="eco-stat-pill__label">de residuos evitados</span>
                    </div>
                  </div>
                  <p className="eco-ref-small">Fuente: {SEFH_DATA.fuente}</p>
                </div>
              </div>

              <h2 className="eco-section-title" style={{ marginTop: '2rem' }}>
                Comparativa de huella de carbono por acondicionamiento
              </h2>
              <p className="eco-body">
                El siguiente gráfico, basado en datos de un estudio de Análisis de Ciclo de Vida
                (LCA) hospitalario realizado en el Alfred Health (Australia, 2023) junto con
                factores de emisión oficiales europeos, ilustra la diferencia relativa entre los
                distintos modos de acondicionamiento:
              </p>
              <div className="eco-chart">
                <div className="eco-chart-bar-wrap">
                  <div className="eco-chart-label">
                    <span>1. Frasco original comercial (HDPE)</span>
                    <span style={{color: '#059669'}}>~ 1.5 g CO₂e/dosis</span>
                  </div>
                  <div className="eco-chart-bar-bg">
                    <div className="eco-chart-bar-fill" style={{width: '15%', background: '#059669'}}></div>
                  </div>
                </div>
                <div className="eco-chart-bar-wrap">
                  <div className="eco-chart-label">
                    <span>2. Reenvasado en bolsa zip PE (desde frasco)</span>
                    <span style={{color: '#10b981'}}>~ 2.5 g CO₂e/dosis (Frasco + Bolsa)</span>
                  </div>
                  <div className="eco-chart-bar-bg">
                    <div className="eco-chart-bar-fill" style={{width: '26%', background: '#10b981'}}></div>
                  </div>
                </div>
                <div className="eco-chart-bar-wrap">
                  <div className="eco-chart-label">
                    <span>3. Blíster comercial (Aluminio + PVC)</span>
                    <span style={{color: '#3b82f6'}}>~ 4.0 g CO₂e/dosis</span>
                  </div>
                  <div className="eco-chart-bar-bg">
                    <div className="eco-chart-bar-fill" style={{width: '42%', background: '#3b82f6'}}></div>
                  </div>
                </div>
                <div className="eco-chart-bar-wrap">
                  <div className="eco-chart-label">
                    <span>4. Reetiquetado del blíster comercial</span>
                    <span style={{color: '#8b5cf6'}}>~ 4.5 g CO₂e/dosis (Blíster + Etiqueta)</span>
                  </div>
                  <div className="eco-chart-bar-bg">
                    <div className="eco-chart-bar-fill" style={{width: '47%', background: '#8b5cf6'}}></div>
                  </div>
                </div>
                <div className="eco-chart-bar-wrap">
                  <div className="eco-chart-label">
                    <span>5. Reenvasado en bolsa zip PE (desde blíster)</span>
                    <span style={{color: '#f59e0b'}}>~ 5.0 g CO₂e/dosis (Blíster desechado + Bolsa)</span>
                  </div>
                  <div className="eco-chart-bar-bg">
                    <div className="eco-chart-bar-fill" style={{width: '52%', background: '#f59e0b'}}></div>
                  </div>
                </div>
                <div className="eco-chart-bar-wrap">
                  <div className="eco-chart-label">
                    <span>6. Reenvasado hospitalario (Aluminio + PVC)</span>
                    <span style={{color: '#ef4444'}}>~ 9.5 g CO₂e/dosis (Blíster desechado + Nuevo Alu/PVC)</span>
                  </div>
                  <div className="eco-chart-bar-bg">
                    <div className="eco-chart-bar-fill" style={{width: '100%', background: '#ef4444'}}></div>
                  </div>
                </div>
              </div>

              <p className="eco-body">
                <strong>La evidencia disponible señala que:</strong> el reenvasado hospitalario
                en lámina de aluminio y PVC genera la mayor huella de carbono por dosis. Mantener
                el blíster comercial intacto (reetiquetando si es necesario) es la opción de
                menor impacto cuando el blíster original es apto para SDMDU.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB: MATERIALES ─────────────────────────────────────────── */}
        {activeTab === 'materiales' && (
          <div className="eco-section-group">
            <h2 className="eco-section-title">
              Factores de emisión por material (fuentes oficiales)
            </h2>
            <p className="eco-body">
              Los siguientes datos provienen de los principales organismos sectoriales y reguladores
              europeos. Son valores medidos <strong>desde el origen hasta la salida de fábrica</strong>: incluyen la extracción
              de materias primas y la fabricación del material, pero no la distribución, el uso
              ni el fin de vida.
            </p>



            <div className="eco-materials-grid">
              {MATERIALES.map(mat => (
                <div
                  key={mat.nombre}
                  className="eco-material-card"
                  style={{ background: mat.color, borderColor: mat.border }}
                >
                  <div className="eco-material-card__header">
                    <div>
                      <div className="eco-material-card__name">{mat.nombre}</div>
                      <div className="eco-material-card__factor">{mat.factor}</div>
                    </div>
                    <span
                      className={`eco-badge eco-badge--${mat.fiabilidad === 'OFICIAL' ? 'green' : 'blue'}`}
                    >
                      {mat.fiabilidad}
                    </span>
                  </div>
                  <p className="eco-material-card__nota">{mat.nota}</p>
                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eco-material-card__link"
                  >
                    <ExternalLink size={12} /> {mat.fuente}
                  </a>
                </div>
              ))}
            </div>

            <h3 className="eco-subsection-title">Ciclo del blíster comercial frente al hospitalario</h3>
            <p className="eco-body">
              Un blíster comercial de aluminio y PVC contiene ya todo el material necesario para
              proteger el medicamento. Cuando se reenvasas en el hospital:
            </p>
            <ol className="eco-list eco-list--ordered">
              <li>Se rompe el blíster original (residuo Al+PVC).</li>
              <li>Se genera un <strong>segundo blíster nuevo</strong> de lámina Al + film PVC termosellado.</li>
              <li>La reenvasadora consume electricidad (0,258 kg CO₂e/kWh — MITECO 2025).</li>
              <li>
                El estudio del Alfred Health (Australia, 2023) encontró que reciclar el aluminio del
                blíster puede reducir hasta un <strong>81 % la huella</strong> asociada a ese material.
              </li>
            </ol>

            <h3 className="eco-subsection-title" style={{ marginTop: '2rem' }}>Eficiencia de los frascos de plástico (HDPE)</h3>
            <p className="eco-body">
              Aunque el plástico tiene un impacto ambiental asociado, los frascos comerciales
              (generalmente de HDPE) presentan una <strong>excelente relación envase/medicamento</strong>.
              Al albergar múltiples dosis en un único receptáculo, la cantidad de material —y por tanto, 
              la huella de carbono— asignada a <strong>cada dosis individual</strong> es considerablemente menor 
              en comparación con los blísteres, donde cada comprimido requiere su propia cavidad de plástico 
              y lámina de aluminio sellada.
            </p>
          </div>
        )}

        {/* ── TAB: OPCIONES ───────────────────────────────────────────── */}
        {activeTab === 'opciones' && (
          <div className="eco-section-group">
            <h2 className="eco-section-title">
              Opciones de acondicionamiento — Ranking ambiental
            </h2>
            <p className="eco-body">
              Las opciones se presentan ordenadas de menor a mayor impacto ambiental estimado,
              basándonos en los factores de emisión de los materiales involucrados y la evidencia
              científica disponible. <strong>Esta jerarquía es orientativa</strong> y debe
              complementarse con criterios clínicos, de estabilidad y de trazabilidad
              del medicamento.
            </p>

            <div className="eco-options-list">
              {OPCIONES.map(op => (
                <div
                  key={op.id}
                  className="eco-option-card"
                  style={{ background: op.bg, borderColor: op.border }}
                >
                  <div className="eco-option-card__rank" style={{ background: op.color }}>
                    #{op.rank}
                  </div>
                  <div className="eco-option-card__body">
                    <h3 className="eco-option-card__title" style={{ color: op.color }}>
                      {op.label}
                    </h3>
                    <p className="eco-option-card__desc">{op.descripcion}</p>
                    <div className="eco-option-card__cols">
                      <div>
                        <div className="eco-option-card__col-title eco-option-card__col-title--green">Ventajas</div>
                        <ul className="eco-list">
                          {op.pros.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="eco-option-card__col-title eco-option-card__col-title--red">Limitaciones</div>
                        <ul className="eco-list">
                          {op.contras.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="eco-option-card__ref">
                      <BookOpen size={12} /> {op.referencia}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="eco-callout eco-callout--blue" style={{ marginTop: '1.5rem' }}>
              <Info size={18} />
              <div>
                <strong>Recuerda:</strong> La decisión de reenvasar o no debe tomarse siempre
                en base a criterios clínicos y de seguridad del paciente, consultando las
                clasificaciones de la base de datos de BlisterCheck. Este ranking ambiental
                es información complementaria para cuando existan opciones clínicamente equivalentes.
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: REFERENCIAS ────────────────────────────────────────── */}
        {activeTab === 'referencias' && (
          <div className="eco-section-group">
            <h2 className="eco-section-title">
              Referencias y fuentes de datos
            </h2>
            <p className="eco-body">
              Toda la información presentada en esta página procede de fuentes oficiales,
              organismos sectoriales de referencia o artículos científicos publicados con
              revisión por pares. A continuación se detallan las fuentes específicas.
            </p>

            <div className="eco-refs-list">
              {REFERENCIAS.map((ref, idx) => (
                <div key={idx} className="eco-ref-item">
                  <div
                    className="eco-ref-header"
                    onClick={() => setExpandedRef(expandedRef === idx ? null : idx)}
                  >
                    <div className="eco-ref-header__left">
                      <span className="eco-ref-tipo">{ref.tipo}</span>
                      <div>
                        <div className="eco-ref-title">{ref.titulo}</div>
                        <div className="eco-ref-meta">
                          {ref.autores} · {ref.anio}
                        </div>
                      </div>
                    </div>
                    {expandedRef === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  {expandedRef === idx && (
                    <div className="eco-ref-body">
                      <p className="eco-ref-hallazgo">
                        <strong>Hallazgo principal:</strong> {ref.hallazgo}
                      </p>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="eco-ref-link"
                      >
                        <ExternalLink size={13} /> Acceder a la fuente
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(activeTab === 'situacion' || activeTab === 'materiales') && (
        <div className="eco-footer-notes" style={{ padding: '0 2rem 2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.6', textAlign: 'justify' }}>
          <p style={{ marginBottom: '1rem' }}>
            Los datos de huella de carbono presentados proceden de fuentes oficiales y estudios con revisión por pares. No existe actualmente un estudio de Análisis de Ciclo de Vida (LCA) específico sobre el reenvasado hospitalario español; las comparaciones se realizan sobre la base de los factores de emisión por material (fuente a puerta). Esta información es orientativa y no debe utilizarse como base de cálculo regulatorio sin un análisis LCA completo.
          </p>
          <p>
            No existe actualmente un estudio de LCA específicamente realizado sobre el proceso de reenvasado hospitalario en España. Los datos de esta página se construyen combinando factores de emisión de materiales con las conclusiones del estudio australiano más próximo en contexto (Alfred Health, 2023). Cualquier uso de esta información para comunicaciones externas debe mencionar explícitamente estas limitaciones.
          </p>
        </div>
      )}

    </div>
  );
}
