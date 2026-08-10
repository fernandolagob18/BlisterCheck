/**
 * Utilidades para el formateo de fechas.
 */

/**
 * Formatea una cadena de fecha ISO a un formato legible en español.
 * @param {string|null} isoDateStr - Cadena de fecha en formato ISO (e.g. "2024-03-15")
 * @returns {string} Fecha formateada (e.g. "15 mar. 2024") o '-' si es null/undefined
 */
export function formatDate(isoDateStr) {
  if (!isoDateStr) return '-';

  try {
    const date = new Date(isoDateStr);
    if (isNaN(date.getTime())) return isoDateStr;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDateStr;
  }
}

/**
 * Devuelve la diferencia en días entre hoy y una fecha dada.
 * @param {string} isoDateStr
 * @returns {number}
 */
export function daysSince(isoDateStr) {
  if (!isoDateStr) return 0;
  const diff = Date.now() - new Date(isoDateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
