/**
 * Utilidades para el manejo de desabastecimientos (shortages).
 */

/**
 * Determina si un desabastecimiento es "crítico" basándose en sus propiedades.
 * @param {{ activo: number, observ?: string }} shortage
 * @returns {boolean}
 */
export function isCriticalShortage(shortage) {
  if (!shortage) return false;

  // Si está activo y tiene observaciones, se considera crítico
  if (shortage.activo === 1) {
    const obs = (shortage.observ || '').toLowerCase();
    // Palabras clave que indican criticidad
    const criticalKeywords = ['sin alternativa', 'critico', 'crítico', 'urgente', 'agotado', 'no disponible'];
    return criticalKeywords.some(kw => obs.includes(kw)) || !shortage.observ;
  }

  return false;
}
