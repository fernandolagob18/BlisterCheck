-- Función RPC para calcular estadísticas por laboratorio de forma nativa
-- Ejecutar en el SQL Editor de Supabase

CREATE OR REPLACE FUNCTION bc_get_estadisticas_laboratorios(
  p_user_id UUID DEFAULT NULL,
  p_solo_mi_farmacia BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  laboratorio TEXT,
  total_clasificados BIGINT,
  aptos_directos BIGINT,
  requieren_intervencion BIGINT,
  pendientes BIGINT,
  score_sdmdu NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COALESCE(cat.laboratorio, 'Sin laboratorio') AS lab,
      COUNT(*) FILTER (
        WHERE glob.apto_sdmdu_blister IS NOT NULL 
           OR glob.requiere_reenvasado IS NOT NULL 
           OR glob.requiere_reetiquetado IS NOT NULL
      ) AS total_clas,
      COUNT(*) FILTER (WHERE glob.apto_sdmdu_blister = true) AS aptos,
      COUNT(*) FILTER (WHERE glob.requiere_reenvasado = true OR glob.requiere_reetiquetado = true) AS intervencion,
      COUNT(*) FILTER (
        WHERE glob.apto_sdmdu_blister IS NULL 
          AND glob.requiere_reenvasado IS NULL 
          AND glob.requiere_reetiquetado IS NULL
      ) AS pend
    FROM blistercheck_clasificacion_global glob
    LEFT JOIN blistercheck_catalogo cat ON glob.cn = cat.cn
    LEFT JOIN blistercheck_user_farmacia uf ON glob.cn = uf.cn AND uf.user_id = p_user_id
    WHERE (NOT p_solo_mi_farmacia OR (uf.en_mi_farmacia = true AND p_user_id IS NOT NULL))
    GROUP BY COALESCE(cat.laboratorio, 'Sin laboratorio')
  )
  SELECT 
    s.lab::TEXT AS laboratorio,
    s.total_clas AS total_clasificados,
    s.aptos AS aptos_directos,
    s.intervencion AS requieren_intervencion,
    s.pend AS pendientes,
    CASE 
      WHEN s.total_clas > 0 THEN ROUND((s.aptos::NUMERIC / s.total_clas::NUMERIC) * 100.0)
      ELSE 0
    END AS score_sdmdu
  FROM stats s
  ORDER BY 
    CASE WHEN s.total_clas > 0 THEN ROUND((s.aptos::NUMERIC / s.total_clas::NUMERIC) * 100.0) ELSE 0 END DESC,
    s.total_clas DESC;
END;
$$;
