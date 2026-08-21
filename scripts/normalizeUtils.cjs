'use strict';

/**
 * normalizeUtils.cjs — Utilidades de normalización compartidas entre scripts de Node.js
 *
 * IMPORTANTE: Esta lógica debe mantenerse sincronizada con `normalizeDosis()` en
 * src/services/blistercheckService.js. Si modificas una, modifica la otra.
 */

/**
 * Mapa de sinónimos de unidades → abreviatura estándar (minúsculas).
 * No se realizan conversiones entre unidades (ej. g ≠ mg).
 */
const UNIT_MAP = {
  'microgramos': 'mcg', 'microgramo': 'mcg', 'ug': 'mcg', 'µg': 'mcg', 'mcg': 'mcg',
  'miligramos':  'mg',  'miligramo':  'mg',  'mg':  'mg',
  'gramos':      'g',   'gramo':      'g',   'g':   'g',
  'mililitros':  'ml',  'mililitro':  'ml',  'ml':  'ml',
  'litros':      'l',   'litro':      'l',   'l':   'l',
  'unidades':    'ui',  'unidad':     'ui',  'u.i.': 'ui', 'ui': 'ui', 'u': 'ui',
  'mui': 'mui', 'meq': 'meq', 'mmol': 'mmol', '%': '%',
};

// Patrón de unidades (más largo primero para evitar matches parciales)
const UNITS_PATTERN = 'microgramos|microgramo|mcg|µg|ug|miligramos|miligramo|mg|gramos|gramo|mililitros|mililitro|ml|litros|litro|unidades|unidad|u\\.i\\.|mui|meq|mmol|ui|u|g|l|%';

/**
 * Normaliza una cadena de dosis de CIMA eliminando texto libre extra
 * (ej. nombre del principio activo) y estandarizando las unidades.
 *
 * NO convierte entre unidades — "1 g" y "1000 mg" siguen siendo distintas.
 *
 * Casos cubiertos:
 *   "16 MG betahistina"   → "16 mg"
 *   "500/125 mg"          → "500/125 mg"    (combinaciones)
 *   "500 mg/5 ml"         → "500 mg/5 ml"   (concentraciones)
 *   "0,5 mg"              → "0.5 mg"        (decimal con coma)
 *   "100 microgramos"     → "100 mcg"
 *   "texto sin número"    → ""
 *
 * @param {string|null|undefined} dosisStr
 * @returns {string}
 */
function normalizeDosis(dosisStr) {
  if (!dosisStr) return '';
  const d = String(dosisStr).toLowerCase().trim();

  // ── Patrón 1: concentración  →  "500 mg/5 ml"
  const reConcentracion = new RegExp(
    `([\\d,\\.]+)\\s*(${UNITS_PATTERN})\\s*/\\s*([\\d,\\.]+)\\s*(${UNITS_PATTERN})`,
    'i'
  );
  const mConc = reConcentracion.exec(d);
  if (mConc) {
    const num1  = mConc[1].replace(',', '.');
    const unit1 = UNIT_MAP[mConc[2].toLowerCase()] || mConc[2].toLowerCase();
    const num2  = mConc[3].replace(',', '.');
    const unit2 = UNIT_MAP[mConc[4].toLowerCase()] || mConc[4].toLowerCase();
    return `${num1} ${unit1}/${num2} ${unit2}`;
  }

  // ── Patrón 2: combinación    →  "500/125 mg"
  const reCombinado = new RegExp(
    `([\\d,\\.]+)\\/([\\d,\\.]+)\\s*(${UNITS_PATTERN})`,
    'i'
  );
  const mComb = reCombinado.exec(d);
  if (mComb) {
    const num1 = mComb[1].replace(',', '.');
    const num2 = mComb[2].replace(',', '.');
    const unit = UNIT_MAP[mComb[3].toLowerCase()] || mComb[3].toLowerCase();
    return `${num1}/${num2} ${unit}`;
  }

  // ── Patrón 3: múltiples pares número+unidad  →  "16 mg" o "10 mg / 5 mg"
  const reSimple = new RegExp(`([\\d,\\.]+)\\s*(${UNITS_PATTERN})`, 'gi');
  const parts = [];
  let match;
  while ((match = reSimple.exec(d)) !== null) {
    const num  = match[1].replace(',', '.');
    const unit = UNIT_MAP[match[2].toLowerCase()] || match[2].toLowerCase();
    parts.push(`${num} ${unit}`);
  }

  if (parts.length > 0) return parts.join(' / ');

  // Sin ningún patrón reconocible
  return '';
}

module.exports = { normalizeDosis };
