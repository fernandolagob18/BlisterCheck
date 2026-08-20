-- Funciones RPC para solucionar cuellos de botella en Exportación y Mis Laboratorios
-- Ejecutar en el SQL Editor de Supabase

BEGIN;

-- 1. Función para Exportación de CSV (Evita bucles de React)
CREATE OR REPLACE FUNCTION bc_get_export_data(
  p_modo TEXT DEFAULT 'clasificados',
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'cn', glob.cn,
      'requiere_reenvasado', glob.requiere_reenvasado,
      'requiere_reetiquetado', glob.requiere_reetiquetado,
      'apto_sdmdu_blister', glob.apto_sdmdu_blister,
      'solo_envase_clinico', glob.solo_envase_clinico,
      'updated_at', glob.updated_at,
      'blistercheck_catalogo', json_build_object(
        'cn', cat.cn,
        'nregistro', cat.nregistro,
        'nombre', cat.nombre,
        'laboratorio', cat.laboratorio,
        'dosis', cat.dosis,
        'principio_activo', cat.principio_activo,
        'forma_farmaceutica', cat.forma_farmaceutica,
        'forma_simplificada', cat.forma_simplificada,
        'via_administracion', cat.via_administracion,
        'tipo_prescripcion', cat.tipo_prescripcion,
        'fotosensible', cat.fotosensible,
        'higroscopico', cat.higroscopico
      ),
      'en_mi_farmacia', COALESCE(uf.en_mi_farmacia, false),
      'notas', COALESCE(uf.notas, ''),
      'fecha_clasificacion', COALESCE(uf.fecha_clasificacion, glob.updated_at)
    )
  ) INTO result
  FROM blistercheck_clasificacion_global glob
  LEFT JOIN blistercheck_catalogo cat ON glob.cn = cat.cn
  LEFT JOIN blistercheck_user_farmacia uf ON glob.cn = uf.cn AND uf.user_id = p_user_id
  WHERE 
    (p_modo = 'todos') OR
    (p_modo = 'clasificados' AND (glob.requiere_reenvasado IS NOT NULL OR glob.requiere_reetiquetado IS NOT NULL OR glob.apto_sdmdu_blister IS NOT NULL OR glob.solo_envase_clinico IS NOT NULL)) OR
    (p_modo = 'mi_farmacia' AND uf.en_mi_farmacia = true);
    
  RETURN COALESCE(result, '[]'::JSON);
END;
$$;


-- 2. Función para Mis Laboratorios (Evita descargar la tabla de farmacia y catálogo por separado)
CREATE OR REPLACE FUNCTION bc_get_user_catalog_with_custom(
  p_user_id UUID,
  p_custom_cns TEXT[] DEFAULT '{}'::TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE 
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'cn', cat.cn,
      'nregistro', cat.nregistro,
      'nombre', cat.nombre,
      'laboratorio', cat.laboratorio,
      'dosis', cat.dosis,
      'principio_activo', cat.principio_activo,
      'forma_farmaceutica', cat.forma_farmaceutica,
      'forma_simplificada', cat.forma_simplificada,
      'via_administracion', cat.via_administracion,
      'tipo_prescripcion', cat.tipo_prescripcion,
      'fotosensible', cat.fotosensible,
      'higroscopico', cat.higroscopico,
      'blistercheck_clasificacion_global', json_build_object(
         'apto_sdmdu_blister', glob.apto_sdmdu_blister,
         'requiere_reenvasado', glob.requiere_reenvasado,
         'requiere_reetiquetado', glob.requiere_reetiquetado,
         'solo_envase_clinico', glob.solo_envase_clinico
      )
    )
  ) INTO result
  FROM blistercheck_catalogo cat
  LEFT JOIN blistercheck_user_farmacia uf ON cat.cn = uf.cn AND uf.user_id = p_user_id
  LEFT JOIN blistercheck_clasificacion_global glob ON cat.cn = glob.cn
  WHERE (uf.en_mi_farmacia = true) OR (cat.cn = ANY(p_custom_cns));

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

COMMIT;
