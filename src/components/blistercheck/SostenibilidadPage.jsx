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
    url: 'https://european-aluminium.eu/wp-content/uploads/2025/07/Environmental-Profile-Report_2024-V20.pdf',
    color: '#e8f4f8',
    border: '#7ecae4',
    nota: 'Aluminio primario de producción europea. El aluminio reciclado puede reducir hasta un 95 % esta cifra.',
    fiabilidad: 'SECTORIAL',
  },
  {
    nombre: 'Plástico HDPE (frascos)',
    factor: '~1,9–3,1 kg CO₂e/kg',
    fuente: 'PlasticsEurope Eco-profiles (2022/2026)',
    url: 'https://www.plasticseurope.org/en/resources/eco-profiles',
    color: '#f0fdf4',
    border: '#86efac',
    nota: 'Rango típico desde la extracción hasta salida de fábrica. Varía según la versión del eco-perfil y la energía del proceso.',
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
  fuente: 'Proyecto "No reenvases sin necesidad" — Grupo TECNO-SEFH, 2026',
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
    url: 'https://european-aluminium.eu/wp-content/uploads/2025/07/Environmental-Profile-Report_2024-V20.pdf',
    hallazgo: 'Aluminio primario europeo: 6,3 kg CO₂e/kg (dato desde origen hasta salida de fábrica, producción europea media, datos 2023). Reducción del 5 % respecto a 2015; el 78 % de la electricidad usada en 2023 procedió de fuentes renovables.',
  },
  {
    autores: 'PlasticsEurope',
    titulo: 'Eco-profiles de plásticos (HDPE, PVC, PE)',
    anio: '2022–2026',
    tipo: 'Sectorial oficial',
    url: 'https://www.plasticseurope.org/en/resources/eco-profiles',
    hallazgo: 'Eco-profiles de Inventario de Ciclo de Vida (LCI) desde extracción hasta salida de fábrica para polímeros europeos. HDPE: rango 1,9–3,1 kg CO₂e/kg según versión. (Requiere registro en el portal para descargar datasets)',
  },
  {
    autores: 'MITECO (Ministerio para la Transición Ecológica y el Reto Demográfico)',
    titulo: 'Factores de emisión de CO₂ para el sector eléctrico español',
    anio: '2025',
    tipo: 'Regulador oficial',
    url: 'https://www.miteco.gob.es/es/cambio-climatico/temas/mitigacion-politicas-y-medidas/calculadoras.html',
    hallazgo: 'Factor de emisión mix eléctrico nacional España 2025: 0,258 kg CO₂e/kWh. (El dato exacto se publica en el interior del archivo Excel de la Calculadora descargable).',
  },
  {
    autores: 'SEFH (Grupo TECNO / DIGIFHAR)',
    titulo: 'Proyecto "No reenvases sin necesidad" — Evaluación de impacto',
    anio: '2026',
    tipo: 'Iniciativa',
    url: 'https://www.sefh.es',
    hallazgo: '1,27 M comprimidos no reenvasados, 17 km de material evitado, 866 kg de residuos reducidos en 15 hospitales (datos internos del grupo TECNO-SEFH, 2026).',
  },
  {
    autores: 'SIGRE Medicamento y Medio Ambiente',
    titulo: 'Informe anual de ecodiseño de envases farmacéuticos',
    anio: '2024',
    tipo: 'Sectorial oficial',
    url: 'https://www.sigre.es/ecodiseno/',
    hallazgo: 'Más de 3.900 medidas de ecodiseño, peso medio de envase reducido más de un 25 % desde 2000, más de 100.000 t CO₂e acumuladas evitadas (Farmaindustria / SIGRE, 2026).',
  },
];

/* ─── Constantes de escala para la barra de impacto ──────────────────────── */
const CO2_MIN = 1.5;   // g CO₂e/dosis — valor mínimo del rango
const CO2_MAX = 9.5;   // g CO₂e/dosis — valor máximo del rango

// Valor numérico central de cada opción (para la barra proporcional)
const CO2_VALORES = {
  'frasco': 1.5,
  'zip-frasco': 2.5,
  'blister-comercial': 4.0,
  'reetiquetado': 4.5,
  'zip-blister': 5.0,
  'reenvasado-hosp': 9.5,
};

/* ─── Componente principal ────────────────────────────────────────────────── */
export default function SostenibilidadPage() {
  const [expandedRef, setExpandedRef] = useState(null);
  const [expandedOption, setExpandedOption] = useState(null);
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
                ¿Qué puede hacer la farmacia hospitalaria?
              </h2>
              <p className="eco-body">
                La revisión sistemática de los medicamentos que se reenvasan —identificando cuáles ya
                cumplen los requisitos de SDMDU en su envase comercial— es la intervención con mayor
                potencial de reducción inmediata de la huella de carbono de la farmacia. Consulta el
                apartado <strong>Opciones</strong> para ver el ranking ambiental comparativo de cada
                modalidad de acondicionamiento.
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

            {/* Leyenda de escala */}
            <div className="eco-rank-scale">
              <span className="eco-rank-scale__label">Menor impacto</span>
              <div className="eco-rank-scale__bar">
                <div className="eco-rank-scale__gradient" />
                <div className="eco-rank-scale__ticks">
                  <span>1,5 g</span>
                  <span>4,0 g</span>
                  <span>6,5 g</span>
                  <span>9,5 g CO₂e/dosis</span>
                </div>
              </div>
              <span className="eco-rank-scale__label">Mayor impacto</span>
            </div>

            <div className="eco-rank-list">
              {OPCIONES.map(op => {
                const val = CO2_VALORES[op.id] ?? 0;
                const pct = Math.round(((val - CO2_MIN) / (CO2_MAX - CO2_MIN)) * 100);
                const isOpen = expandedOption === op.id;

                return (
                  <div key={op.id} className={`eco-rank-row${isOpen ? ' eco-rank-row--open' : ''}`}>
                    {/* ── Cabecera clicable ── */}
                    <button
                      className="eco-rank-row__header"
                      onClick={() => setExpandedOption(isOpen ? null : op.id)}
                      aria-expanded={isOpen}
                    >
                      {/* Badge de ranking */}
                      <span className="eco-rank-badge" style={{ background: op.color }}>
                        #{op.rank}
                      </span>

                      {/* Nombre */}
                      <span className="eco-rank-row__name" style={{ color: op.color }}>
                        {op.label}
                      </span>

                      {/* Barra de impacto */}
                      <div className="eco-rank-bar-wrap">
                        <div className="eco-rank-bar-bg">
                          <div
                            className="eco-rank-bar-fill"
                            style={{ width: `${pct}%`, background: op.color }}
                          />
                        </div>
                      </div>

                      {/* Valor CO₂e */}
                      <span className="eco-rank-row__value" style={{ color: op.color }}>
                        {op.id === 'reenvasado-hosp' ? '7,0 – 9,5 g' : `~ ${String(val).replace('.', ',')} g`} CO₂e
                      </span>

                      {/* Chevron */}
                      <span className="eco-rank-row__chevron">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>

                    {/* ── Panel de detalle expandible ── */}
                    {isOpen && (
                      <div className="eco-rank-detail" style={{ borderColor: op.border, background: op.bg }}>
                        <p className="eco-rank-detail__desc">{op.descripcion}</p>
                        <div className="eco-rank-detail__cols">
                          <div>
                            <div className="eco-rank-detail__col-title eco-rank-detail__col-title--green">
                              ✓ Ventajas
                            </div>
                            <ul className="eco-list">
                              {op.pros.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="eco-rank-detail__col-title eco-rank-detail__col-title--red">
                              ✗ Limitaciones
                            </div>
                            <ul className="eco-list">
                              {op.contras.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        </div>
                        <div className="eco-rank-detail__ref">
                          <BookOpen size={12} /> {op.referencia}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="eco-body" style={{ marginTop: '2rem' }}>
              <strong>La evidencia disponible señala que:</strong> el reenvasado hospitalario en lámina de aluminio y PVC genera la mayor huella de carbono por dosis. Mantener el blíster comercial intacto (reetiquetando si es necesario) es la opción de menor impacto cuando el blíster original es apto para SDMDU.
            </p>
            <p className="eco-body">
              Los datos de huella de carbono presentados proceden de fuentes oficiales y estudios con revisión por pares. No existe actualmente un estudio de Análisis de Ciclo de Vida (LCA) específico sobre el reenvasado hospitalario español; las comparaciones se realizan sobre la base de los factores de emisión por material (fuente a puerta). Esta información es orientativa y no debe utilizarse como base de cálculo regulatorio sin un análisis LCA completo.
            </p>
            <p className="eco-body">
              No existe actualmente un estudio de LCA específicamente realizado sobre el proceso de reenvasado hospitalario en España. Los datos de esta página se construyen combinando factores de emisión de materiales con las conclusiones del estudio australiano más próximo en contexto (Alfred Health, 2023). Cualquier uso de esta información para comunicaciones externas debe mencionar explícitamente estas limitaciones.
            </p>
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
