-- Script para habilitar Supabase Realtime en las tablas de clasificaciones
-- Ejecutar en el SQL Editor del panel de Supabase

BEGIN;

-- 1. Intentar eliminar de la publicación por si ya estuvieran (evita errores de duplicados)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS blistercheck_clasificacion_global;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS blistercheck_user_farmacia;

-- 2. Añadir las tablas a la publicación de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE blistercheck_clasificacion_global;
ALTER PUBLICATION supabase_realtime ADD TABLE blistercheck_user_farmacia;

COMMIT;
