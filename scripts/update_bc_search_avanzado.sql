-- Script para optimizar la búsqueda avanzada de BlisterCheck
-- Ejecutar en el SQL Editor del panel de Supabase

CREATE OR REPLACE FUNCTION bc_search_avanzado(
    p_cn text DEFAULT NULL,
    p_nombre text DEFAULT NULL,
    p_principio_activo text DEFAULT NULL,
    p_laboratorio text DEFAULT NULL,
    p_forma_farmaceutica text DEFAULT NULL,
    p_via_administracion text DEFAULT NULL,
    p_solo_clasificados boolean DEFAULT false,
    p_user_id uuid DEFAULT NULL,
    p_solo_en_mi_farmacia boolean DEFAULT false,
    p_solo_fotosensibles boolean DEFAULT false,
    p_solo_higroscopicos boolean DEFAULT false,
    p_estado_acondicionamiento text DEFAULT 'todos'
)
RETURNS SETOF blistercheck_catalogo
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT c.*
    FROM blistercheck_catalogo c
    -- Hacemos JOIN con la tabla de farmacia del usuario solo si pasó un user_id
    LEFT JOIN blistercheck_user_farmacia u 
        ON u.cn = c.cn AND u.user_id = p_user_id
    -- Hacemos JOIN con la clasificación global
    LEFT JOIN blistercheck_clasificacion_global g 
        ON g.cn = c.cn
    WHERE 
        -- Filtros de texto (ilike insensible a mayúsculas)
        (p_cn IS NULL OR p_cn = '' OR c.cn ILIKE p_cn || '%')
        AND (p_nombre IS NULL OR p_nombre = '' OR unaccent(c.nombre) ILIKE '%' || unaccent(p_nombre) || '%')
        AND (p_principio_activo IS NULL OR p_principio_activo = '' OR unaccent(c.principio_activo) ILIKE '%' || unaccent(p_principio_activo) || '%')
        AND (p_laboratorio IS NULL OR p_laboratorio = '' OR unaccent(c.laboratorio) ILIKE '%' || unaccent(p_laboratorio) || '%')
        
        -- Filtros exactos
        AND (p_forma_farmaceutica IS NULL OR p_forma_farmaceutica = '' OR c.forma_farmaceutica = p_forma_farmaceutica)
        AND (p_via_administracion IS NULL OR p_via_administracion = '' OR c.via_administracion = p_via_administracion)
        
        -- Filtros booleanos del catálogo
        AND (p_solo_fotosensibles = false OR c.fotosensible = true)
        AND (p_solo_higroscopicos = false OR c.higroscopico = true)
        
        -- Filtro: Solo en mi farmacia
        AND (p_solo_en_mi_farmacia = false OR (u.user_id = p_user_id AND u.en_mi_farmacia = true))
        
        -- Filtro: Solo clasificados
        AND (p_solo_clasificados = false OR g.cn IS NOT NULL)

        -- Filtro: Estado de acondicionamiento clínico
        AND (
            p_estado_acondicionamiento IS NULL 
            OR p_estado_acondicionamiento = '' 
            OR p_estado_acondicionamiento = 'todos'
            OR (p_estado_acondicionamiento = 'reenvasado' AND g.requiere_reenvasado = true)
            OR (p_estado_acondicionamiento = 'reetiquetado' AND g.requiere_reetiquetado = true)
            OR (p_estado_acondicionamiento = 'apto_sdmdu' AND g.apto_sdmdu_blister = true)
        )
    ORDER BY c.nombre ASC
    LIMIT 3000;
END;
$$;
