-- =======================================================================
-- MIGRATION SCRIPT: BlisterCheck -> BlisterCheck
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ¡ATENCIÓN! Ejecuta esto ANTES o DESPUÉS de hacer el despliegue del frontend
-- para que las tablas coincidan con el código de React.
-- =======================================================================

-- 1. Renombrar tablas principales
ALTER TABLE IF EXISTS blistercheck_catalogo RENAME TO blistercheck_catalogo;
ALTER TABLE IF EXISTS blistercheck_clasificacion RENAME TO blistercheck_clasificacion;

-- 2. Renombrar la función del trigger
ALTER FUNCTION IF EXISTS update_blistercheck_updated_at() RENAME TO update_blistercheck_updated_at;

-- 3. Renombrar el trigger en sí (la sintaxis en Postgres requiere especificar la tabla)
ALTER TRIGGER IF EXISTS set_blistercheck_updated_at ON blistercheck_clasificacion RENAME TO set_blistercheck_updated_at;

-- 4. Renombrar los índices (Opcional, pero recomendado por limpieza)
ALTER INDEX IF EXISTS idx_bc_catalogo_nombre RENAME TO idx_ab_catalogo_nombre;
ALTER INDEX IF EXISTS idx_bc_catalogo_cn RENAME TO idx_ab_catalogo_cn;
ALTER INDEX IF EXISTS idx_bc_catalogo_principio RENAME TO idx_ab_catalogo_principio;
ALTER INDEX IF EXISTS idx_bc_catalogo_laboratorio RENAME TO idx_ab_catalogo_laboratorio;
ALTER INDEX IF EXISTS idx_bc_catalogo_forma RENAME TO idx_ab_catalogo_forma;
ALTER INDEX IF EXISTS idx_bc_clasificacion_farmacia RENAME TO idx_ab_clasificacion_farmacia;

-- Nota: Las políticas RLS (Row Level Security) se mantienen atadas a la tabla incluso al cambiar el nombre,
-- por lo que no es estrictamente necesario recrearlas si el nombre de la política en sí no contenía "blistercheck".
-- ("Auth read catalogo" y "Auth all clasificacion" siguen funcionando).
