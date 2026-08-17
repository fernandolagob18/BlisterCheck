-- scripts/add-higroscopico.sql
-- Ejecuta este script en el SQL Editor de Supabase para añadir la columna higroscopico al catálogo existente.

ALTER TABLE blistercheck_catalogo ADD COLUMN IF NOT EXISTS higroscopico BOOLEAN DEFAULT NULL;
