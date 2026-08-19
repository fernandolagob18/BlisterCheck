-- Script para optimizar la búsqueda simple de BlisterCheck
-- Ejecutar en el SQL Editor del panel de Supabase

CREATE OR REPLACE FUNCTION public.bc_search_simple(q text)
RETURNS SETOF public.blistercheck_catalogo
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.blistercheck_catalogo
  WHERE 
    unaccent(nombre) ILIKE '%' || unaccent(q) || '%'
    OR unaccent(COALESCE(principio_activo, '')) ILIKE '%' || unaccent(q) || '%'
    OR unaccent(COALESCE(laboratorio, '')) ILIKE '%' || unaccent(q) || '%'
    OR cn ILIKE q || '%'
  ORDER BY 
    CASE WHEN cn ILIKE q || '%' THEN 1 ELSE 2 END,
    nombre ASC
  LIMIT 3000;
$$;
