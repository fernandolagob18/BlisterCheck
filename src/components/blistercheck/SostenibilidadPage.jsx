import React, { useState } from 'react';
import {
  Leaf, AlertTriangle, BookOpen, ExternalLink,
  ChevronDown, ChevronUp, CheckCircle, Info, Zap, Package
} from 'lucide-react';

/* ─── Datos de materiales (fuentes oficiales) ──────────────────────────────── */
const MATERIALES = [
  {
    nombre: 'Aluminio (lámina blíster)',
    factor: '6.3 kg CO₂e/kg',
    fuente: 'European Aluminium Association (2024)',
    url: 'https://european-aluminium.eu/resource/environmental-profile-report/',
    color: '#e8f4f8',
    border: '#7ecae4',
    icon: '🥫',
    nota: 'Aluminio primario de producción europea. El aluminio reciclado puede reducir hasta un 95% esta cifra.',
    fiabilidad: 'SECTORIAL',
  },
  {
    nombre: 'Plástico HDPE (frascos)',
    factor: '~1.9–3.1 kg CO₂e/kg',
    fuente: 'PlasticsEurope Eco-profiles (2022/2026)',
    url: 'https://www.plasticseurope.org/en/resources/eco-profiles',
    color: '#f0fdf4',
    border: '#86efac',
    icon: '🧴',
    nota: 'Rango típico cuna-a-puerta. Varía según la versión del eco-perfil y la energía del proceso.',
    fiabilidad: 'SECTORIAL',
  },
  {
    nombre: 'Electricidad (España)',
    factor: '0.258 kg CO₂e/kWh',
    fuente: 'MITECO — Factor de emisión mix nacional 2025',
    url: 'https://www.miteco.gob.es/es/cambio-climatico/temas/mitigacion-politicas-y-medidas/factores_emision_co2.html',
    color: '#fffbeb',
    border: '#fbbf24',
    icon: '⚡',
    nota: 'Factor oficial del Ministerio para la Transición Ecológica. Aplicable a la energía consumida por la maquinaria de reenvasado.',
    fiabilidad: 'OFICIAL',
  },
];

/* ─── Opciones de acondicionamiento (ranking) ────────────────────────────── */
const OPCIONES = [
  {
    id: 'frasco',
    label: 'Frasco original comercial (HDPE/PP)',
    rank: 1,
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#6ee7b7',
    descripcion:
      'Utilizar el frasco comercial sin intervención hospitalaria. El acondicionamiento primario ya está optimizado por el laboratorio fabricante.',
    pros: [
      'Cero material nuevo generado en el hospital',
      'No requiere energía adicional de reenvasado',
      'El HDPE/PP es el plástico con menor huella entre los comunes',
    ],
    contras: [
      'No siempre viable en SDMDU (Sistemas de Dispensación en Dosis Unitaria)',
      'Puede requerir reetiquetado de la dosis individual',
    ],
    referencia: 'Alfred Health/Monash University LCA, 2023 (peer-reviewed)',
  },
  {
    id: 'reetiquetado',
    label: 'Reetiquetado del blíster comercial',
    rank: 2,
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#93c5fd',
    descripcion:
      'Añadir una etiqueta adhesiva sobre el blíster comercial intacto (sin abrirlo ni reenvasan). Mínima intervención, máxima preservación del envase original.',
    pros: [
      'Solo se añade el peso de la etiqueta adhesiva (< 1 g)',
      'Se conserva la integridad del blíster fabricante',
      'Menor generación de residuos hospitalarios',
    ],
    contras: [
      'Puede no adaptarse a todos los formatos de blíster',
      'Requiere control estricto de la legibilidad de la etiqueta',
    ],
    referencia: 'ILAPHAR, SEFH — Proyecto "No reenvases sin necesidad", 2024',
  },
  {
    id: 'bolsa-zip',
    label: 'Reenvasado en bolsa zip PE',
    rank: 3,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    descripcion:
      'Dispensar en bolsas de polietileno con cierre zip junto con una etiqueta identificativa. Menor consumo de material que el reenvasado en lámina aluminio.',
    pros: [
      'Menos material por unidad que el reenvasado en Al/PVC',
      'Sin necesidad de maquinaria termoselladora',
      'El PE tiene una huella de producción moderada',
    ],
    contras: [
      'No garantiza la misma estabilidad del medicamento que el blíster original',
      'Aumenta el riesgo de contaminación si no se manipula correctamente',
      'No válido para todos los fármacos (fotosensibles, higroscópicos)',
    ],
    referencia: 'Estimación basada en perfil HDPE PlasticsEurope',
  },
  {
    id: 'reenvasado',
    label: 'Reenvasado hospitalario (lámina Al + PVC termosellado)',
    rank: 4,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
    descripcion:
      'Reenvasado manual o automático en lámina de aluminio + film PVC termosellable. Es el proceso de mayor impacto porque consume material nuevo y energía eléctrica de la maquinaria.',
    pros: [
      'Permite la dispensación en dosis unitarias estandarizadas',
      'Compatible con la mayoría de sistemas automatizados de SDMDU',
      'Estabilidad y trazabilidad garantizadas',
    ],
    contras: [
      'Consume lámina de Al (6.3 kg CO₂e/kg, EAA 2024) + PVC termosellable',
      'Requiere energía eléctrica de la reenvasadora (factor MITECO: 0.258 kg CO₂e/kWh)',
      'Genera residuos de materiales mixtos (Al + plástico) difíciles de reciclar',
    ],
    referencia: 'EAA 2024, MITECO 2025, Alfred Health LCA 2023',
  },
];

/* ─── Estudio SEFH ─────────────────────────────────────────────────────────── */
const SEFH_DATA = {
  hospitales: 15,
  comprimidosNoRenvasados: '1.27 millones',
  materialEvitado: '17 km',
  residuosEvitados: '866 kg',
  fuente: 'Proyecto "No reenvases sin necesidad" – Revista Farmacia Hospitalaria, 2026',
};

/* ─── Referencias bibliográficas ─────────────────────────────────────────── */
const REFERENCIAS = [
  {
    autores: 'Alfred Health Pharmacy / University of Melbourne',
    titulo: 'The carbon footprint of different medication packaging items at an Australian tertiary hospital',
    anio: '2023',
    tipo: '📄 Peer-reviewed',
    url: 'https://www.researchgate.net',
    hallazgo: 'Los blísteres con menor huella emiten hasta un 76% menos CO₂e que los de mayor impacto dentro de la misma categoría.',
  },
  {
    autores: 'European Aluminium Association',
    titulo: 'Environmental Profile Report 2024',
    anio: '2024',
    tipo: '🔶 Sectorial Oficial',
    url: 'https://european-aluminium.eu/resource/environmental-profile-report/',
    hallazgo: 'Aluminio primario europeo: 6.3 kg CO₂e/kg (dato cuna a puerta, producción europea media).',
  },
  {
    autores: 'PlasticsEurope',
    titulo: 'Eco-profiles de plásticos (HDPE, PVC, PE)',
    anio: '2022–2026',
    tipo: '🔶 Sectorial Oficial',
    url: 'https://www.plasticseurope.org/en/resources/eco-profiles',
    hallazgo: 'Eco-profiles LCI cuna a puerta para polímeros europeos. HDPE: rango 1.9–3.1 kg CO₂e/kg según versión.',
  },
  {
    autores: 'MITECO (Ministerio para la Transición Ecológica)',
    titulo: 'Factores de emisión de CO₂ para el sector eléctrico español',
    anio: '2025',
    tipo: '✅ Regulador oficial',
    url: 'https://www.miteco.gob.es/es/cambio-climatico/temas/mitigacion-politicas-y-medidas/factores_emision_co2.html',
    hallazgo: 'Factor de emisión mix eléctrico nacional España 2025: 0.258 kg CO₂e/kWh.',
  },
  {
    autores: 'SEFH – Sociedad Española de Farmacia Hospitalaria',
    titulo: 'No reenvases sin necesidad – Evaluación del impacto en 15 hospitales',
    anio: '2026',
    tipo: '📄 Peer-reviewed',
    url: 'https://www.sefh.es',
    hallazgo: '1,27M comprimidos no reenvasados, 17 km de material evitado, 866 kg de residuos reducidos en 15 hospitales.',
  },
  {
    autores: 'SIGRE Medicamento y Medio Ambiente',
    titulo: 'Informe anual de ecodiseño de envases farmacéuticos',
    anio: '2024',
    tipo: '✅ Sectorial Oficial',
    url: 'https://www.sigre.es',
    hallazgo: '>3.900 medidas de ecodiseño, peso medio de envase reducido >25% desde 2000, >85.000 t CO₂e acumuladas evitadas.',
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
            <span>Herramientas · Sostenibilidad</span>
          </div>
          <h1 className="eco-hero__title">
            Sostenibilidad del<br />Reenvasado y Reetiquetado
          </h1>
          <p className="eco-hero__subtitle">
            Impacto ambiental del acondicionamiento de medicamentos en el hospital
          </p>
        </div>
      </div>

      {/* ── AVISO METODOLÓGICO ────────────────────────────────────────── */}
      <div className="eco-disclaimer">
        <AlertTriangle size={18} className="eco-disclaimer__icon" />
        <div>
          <strong>Nota metodológica:</strong> Los datos de huella de carbono
          presentados proceden de fuentes oficiales y estudios peer-reviewed. No
          existe actualmente un estudio LCA específico sobre el reenvasado
          hospitalario español; las comparaciones se realizan sobre la base de
          los factores de emisión por material (fuente a puerta). Esta
          información es orientativa y no debe utilizarse como base de cálculo
          regulatorio sin un análisis LCA completo.
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
                El sector sanitario representa aproximadamente el <strong>4-5% de las emisiones
                globales de CO₂e</strong>. Dentro de este sector, los medicamentos y su ciclo de
                vida —incluyendo su envase— son una parte significativa de esa huella.
                En el ámbito hospitalario, la farmacia tiene un rol decisivo: la elección de
                <strong> cómo se acondiciona y dispensa cada dosis</strong> tiene consecuencias
                ambientales directas.
              </p>
              <p className="eco-body">
                El reenvasado hospitalario —necesario en muchos contextos de SDMDU— implica
                la generación de un <strong>nuevo envase</strong> de aluminio y plástico PVC
                que se suma al envase original del laboratorio. Cuando esto no es estrictamente
                necesario, supone un incremento evitable de la huella de carbono.
              </p>

              <div className="eco-highlight-box">
                <div className="eco-highlight-box__icon">🏥</div>
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
                El siguiente gráfico, basado en datos de un estudio LCA hospitalario realizado
                en el Alfred Health (Australia, ~2023) junto con factores de emisión oficiales
                europeos, ilustra la diferencia relativa entre los distintos modos de
                acondicionamiento:
              </p>
              <div className="eco-img-wrap">
                <img
                  src="/eco_packaging_comparison.jpg"
                  alt="Comparativa de huella de carbono por tipo de envase farmacéutico"
                  className="eco-img"
                />
                <p className="eco-img-caption">
                  Comparativa orientativa por modo de acondicionamiento. Las barras
                  representan la huella relativa, no valores absolutos validados por LCA.
                </p>
              </div>

              <div className="eco-callout eco-callout--green">
                <CheckCircle size={18} />
                <div>
                  <strong>La evidencia disponible señala que:</strong> el reenvasado hospitalario
                  en lámina aluminio + PVC genera la mayor huella de carbono por dosis. Mantener
                  el blíster comercial intacto (reetiquetando si es necesario) es la opción de
                  menor impacto cuando el blíster original es apto para SDMDU.
                </div>
              </div>
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
              europeos. Son valores <em>cuna a puerta</em> (cradle-to-gate): incluyen la extracción
              de materias primas y la fabricación del material, pero no la distribución, el uso
              ni el fin de vida.
            </p>

            <div className="eco-img-wrap" style={{ marginBottom: '2rem' }}>
              <img
                src="/eco_materials_factors.jpg"
                alt="Factores de emisión oficiales de los principales materiales de envase farmacéutico"
                className="eco-img"
              />
              <p className="eco-img-caption">
                Factores de emisión oficiales (EAA, PlasticsEurope, MITECO). Los valores corresponden
                al mix de producción europeo/español.
              </p>
            </div>

            <div className="eco-materials-grid">
              {MATERIALES.map(mat => (
                <div
                  key={mat.nombre}
                  className="eco-material-card"
                  style={{ background: mat.color, borderColor: mat.border }}
                >
                  <div className="eco-material-card__header">
                    <span className="eco-material-card__icon">{mat.icon}</span>
                    <div>
                      <div className="eco-material-card__name">{mat.nombre}</div>
                      <div className="eco-material-card__factor">{mat.factor}</div>
                    </div>
                    <span
                      className={`eco-badge eco-badge--${mat.fiabilidad === 'OFICIAL' ? 'green' : 'blue'}`}
                    >
                      {mat.fiabilidad === 'OFICIAL' ? '✅' : '🔶'} {mat.fiabilidad}
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

            <div className="eco-callout eco-callout--yellow">
              <AlertTriangle size={18} />
              <div>
                <strong>Limitación importante:</strong> PlasticsEurope actualiza sus eco-perfiles
                periódicamente. Los valores de HDPE/PVC pueden variar entre versiones. Para un
                cálculo de huella corporativo, se debe consultar la versión vigente directamente en
                su base de datos pública.
              </div>
            </div>

            <h3 className="eco-subsection-title">Ciclo del blíster comercial vs. hospitalario</h3>
            <p className="eco-body">
              Un blíster comercial de aluminio + PVC contiene ya todo el material necesario para
              proteger el medicamento. Cuando se reenvasas en el hospital:
            </p>
            <ol className="eco-list eco-list--ordered">
              <li>Se rompe el blíster original (residuo Al+PVC).</li>
              <li>Se genera un <strong>segundo blíster nuevo</strong> de lámina Al + film PVC termosellado.</li>
              <li>La reenvasadora consume electricidad (0.258 kg CO₂e/kWh — MITECO 2025).</li>
              <li>
                El estudio del Alfred Health (Australia, 2023) encontró que reciclar el aluminio del
                blíster puede reducir hasta un <strong>81% la huella</strong> asociada a ese material.
              </li>
            </ol>
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
                        <div className="eco-option-card__col-title eco-option-card__col-title--green">✅ Ventajas</div>
                        <ul className="eco-list">
                          {op.pros.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="eco-option-card__col-title eco-option-card__col-title--red">⚠️ Limitaciones</div>
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

            <div className="eco-callout eco-callout--yellow" style={{ marginTop: '1.5rem' }}>
              <AlertTriangle size={18} />
              <div>
                <strong>Transparencia sobre las limitaciones:</strong> No existe actualmente
                un estudio de Análisis de Ciclo de Vida (LCA) específicamente realizado sobre
                el proceso de reenvasado hospitalario en España. Los datos de esta página
                se construyen combinando factores de emisión de materiales con las conclusiones
                del estudio australiano más próximo en contexto (Alfred Health, 2023).
                Cualquier uso de esta información para comunicaciones externas debe mencionar
                explícitamente estas limitaciones.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
