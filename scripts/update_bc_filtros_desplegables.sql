-- Función RPC para obtener valores únicos de una columna (Filtros Desplegables) sin descargar toda la tabla
-- Ejecutar en el SQL Editor de Supabase

CREATE OR REPLACE FUNCTION bc_get_distinct_values(p_column text)
RETURNS TABLE(valor text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usamos IF/ELSIF en lugar de SQL dinámico puro para evitar vulnerabilidades de Inyección SQL
  IF p_column = 'forma_farmaceutica' THEN
    RETURN QUERY 
      SELECT DISTINCT forma_farmaceutica::text 
      FROM blistercheck_catalogo 
      WHERE forma_farmaceutica IS NOT NULL 
        AND forma_farmaceutica != ''
      ORDER BY forma_farmaceutica;
      
  ELSIF p_column = 'via_administracion' THEN
    RETURN QUERY 
      SELECT DISTINCT via_administracion::text 
      FROM blistercheck_catalogo 
      WHERE via_administracion IS NOT NULL 
        AND via_administracion != ''
      ORDER BY via_administracion;
      
  ELSE
    RAISE EXCEPTION 'Columna no permitida por seguridad';
  END IF;
END;
$$;
