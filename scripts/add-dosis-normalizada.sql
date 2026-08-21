-- =============================================
-- BlisterCheck — Migración: añadir dosis_normalizada
-- Ejecutar UNA SOLA VEZ en: Supabase Dashboard > SQL Editor
-- IMPORTANTE: ejecutar ANTES del siguiente sync del catálogo
-- =============================================

-- 1. Añadir la columna dosis_normalizada
ALTER TABLE blistercheck_catalogo
  ADD COLUMN IF NOT EXISTS dosis_normalizada TEXT;

-- 2. Crear índice para búsquedas eficientes por dosis normalizada
CREATE INDEX IF NOT EXISTS idx_bc_catalogo_dosis_norm
  ON blistercheck_catalogo(dosis_normalizada);

-- 3. Recargar el esquema de PostgREST para que reconozca la nueva columna
NOTIFY pgrst, 'reload schema';
