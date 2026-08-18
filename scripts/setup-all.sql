-- =============================================
-- BlisterCheck — Setup Unificado en Supabase
-- Ejecutar TODO en: Supabase Dashboard > SQL Editor
-- Incluye: Auth (Perfiles), Catálogo, Clasificaciones y Desabastecimientos
-- =============================================

-- =======================================================================
-- PARTE 1: SISTEMA DE AUTENTICACIÓN Y PERFILES (AUTH)
-- =======================================================================

-- 1. Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT,
  hospital TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Seguridad por Nivel de Fila (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para perfiles
-- Los usuarios pueden leer su propio perfil
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Función y Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, hospital)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'hospital'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Borrar el trigger si existe para evitar errores al re-ejecutar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Función RPC para que un usuario pueda borrar su propia cuenta
-- Esto es necesario porque por seguridad el cliente no puede hacer DELETE en auth.users
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER -- Se ejecuta con permisos de admin (postgres)
AS $$
  -- Borra el usuario autenticado de la tabla auth.users
  -- Debido al "ON DELETE CASCADE", esto borrará su perfil en public.profiles automáticamente
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

-- =======================================================================
-- PARTE 2: DATOS DE LA APLICACIÓN BLISTERCHECK (CATÁLOGO Y CLASIFICACIÓN)
-- =======================================================================

-- Tabla 1: Catálogo completo de medicamentos comercializados (sincronizado regularmente)
CREATE TABLE IF NOT EXISTS blistercheck_catalogo (
  cn                     TEXT PRIMARY KEY,
  nregistro              TEXT NOT NULL,
  nombre                 TEXT NOT NULL,
  laboratorio            TEXT,
  dosis                  TEXT,
  principio_activo       TEXT,
  forma_farmaceutica     TEXT,
  forma_simplificada     TEXT,
  via_administracion     TEXT,
  tipo_prescripcion      TEXT,
  foto_envase_url        TEXT,
  foto_forma_url         TEXT,
  url_ficha_tecnica      TEXT,
  url_prospecto          TEXT,
  fotosensible           BOOLEAN DEFAULT NULL,
  higroscopico           BOOLEAN DEFAULT NULL,
  last_sync              TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurarse de que el índice en nregistro existe
CREATE INDEX IF NOT EXISTS idx_bc_catalogo_nregistro ON blistercheck_catalogo(nregistro);

-- RLS para Catálogo de Medicamentos: Lectura y Escritura permitidas
ALTER TABLE blistercheck_catalogo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica catalogo" ON blistercheck_catalogo;
CREATE POLICY "Lectura publica catalogo" ON blistercheck_catalogo
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Escritura catalogo" ON blistercheck_catalogo;
CREATE POLICY "Escritura catalogo" ON blistercheck_catalogo
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabla: Clasificación Global SDMDU (COMÚN Y COMPARTIDA PARA TODOS LOS USUARIOS)
-- Si un usuario modifica si es Apto, Reenvasado, Reetiquetado o Envase Clínico, se actualiza para TODOS.
CREATE TABLE IF NOT EXISTS blistercheck_clasificacion_global (
  cn                       TEXT PRIMARY KEY REFERENCES blistercheck_catalogo(cn) ON DELETE CASCADE,
  requiere_reenvasado      BOOLEAN DEFAULT NULL,
  requiere_reetiquetado    BOOLEAN DEFAULT NULL,
  apto_sdmdu_blister       BOOLEAN DEFAULT NULL,
  solo_envase_clinico      BOOLEAN DEFAULT NULL,
  updated_by               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Clasificación Global: Cualquier usuario autenticado puede LEER y ACTUALIZAR la base común
ALTER TABLE blistercheck_clasificacion_global ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global read clasificacion" ON blistercheck_clasificacion_global;
CREATE POLICY "Global read clasificacion" ON blistercheck_clasificacion_global
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Global write clasificacion" ON blistercheck_clasificacion_global;
CREATE POLICY "Global write clasificacion" ON blistercheck_clasificacion_global
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 3. Tabla: Datos Privados del Hospital / Usuario (ESTRICTAMENTE PRIVADO POR USUARIO)
-- Registra si el hospital tiene el fármaco en su stock (en_mi_farmacia) y sus notas internas.
CREATE TABLE IF NOT EXISTS blistercheck_user_farmacia (
  cn                       TEXT REFERENCES blistercheck_catalogo(cn) ON DELETE CASCADE,
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  en_mi_farmacia           BOOLEAN DEFAULT FALSE,
  notas                    TEXT DEFAULT NULL,
  fecha_clasificacion      TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cn, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bc_user_farmacia_stock ON blistercheck_user_farmacia(user_id, en_mi_farmacia);

-- RLS para Datos Privados: SOLO el propio usuario puede leer y escribir su stock y notas
ALTER TABLE blistercheck_user_farmacia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Private user farmacia policy" ON blistercheck_user_farmacia;
CREATE POLICY "Private user farmacia policy" ON blistercheck_user_farmacia
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Migración automática si existe la tabla previa de modelo unificado (blistercheck_clasificacion)
DO $$
DECLARE
  has_ec_col BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blistercheck_clasificacion' AND table_type = 'BASE TABLE') THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'blistercheck_clasificacion' AND column_name = 'solo_envase_clinico'
    ) INTO has_ec_col;

    IF has_ec_col THEN
      EXECUTE '
        INSERT INTO blistercheck_clasificacion_global (cn, requiere_reenvasado, requiere_reetiquetado, apto_sdmdu_blister, solo_envase_clinico, updated_at)
        SELECT DISTINCT ON (cn) cn, requiere_reenvasado, requiere_reetiquetado, apto_sdmdu_blister, solo_envase_clinico, updated_at
        FROM blistercheck_clasificacion
        ON CONFLICT (cn) DO UPDATE SET
          requiere_reenvasado = EXCLUDED.requiere_reenvasado,
          requiere_reetiquetado = EXCLUDED.requiere_reetiquetado,
          apto_sdmdu_blister = EXCLUDED.apto_sdmdu_blister,
          solo_envase_clinico = EXCLUDED.solo_envase_clinico;
      ';
    ELSE
      EXECUTE '
        INSERT INTO blistercheck_clasificacion_global (cn, requiere_reenvasado, requiere_reetiquetado, apto_sdmdu_blister, updated_at)
        SELECT DISTINCT ON (cn) cn, requiere_reenvasado, requiere_reetiquetado, apto_sdmdu_blister, updated_at
        FROM blistercheck_clasificacion
        ON CONFLICT (cn) DO UPDATE SET
          requiere_reenvasado = EXCLUDED.requiere_reenvasado,
          requiere_reetiquetado = EXCLUDED.requiere_reetiquetado,
          apto_sdmdu_blister = EXCLUDED.apto_sdmdu_blister;
      ';
    END IF;

    -- Copiar stock y notas privadas a la tabla privada por usuario
    INSERT INTO blistercheck_user_farmacia (cn, user_id, en_mi_farmacia, notas, fecha_clasificacion, updated_at)
    SELECT cn, user_id, COALESCE(en_mi_farmacia, false), notas, fecha_clasificacion, updated_at
    FROM blistercheck_clasificacion
    ON CONFLICT (cn, user_id) DO NOTHING;
  END IF;
END $$;

-- =============================================
-- PARTE 3: DESABASTECIMIENTOS ACTIVOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.desabastecimientos_activos (
    cn VARCHAR PRIMARY KEY,
    nombre TEXT,
    observaciones TEXT,
    fecha_inicio BIGINT,
    fecha_fin BIGINT,
    criticidad VARCHAR,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.desabastecimientos_activos ENABLE ROW LEVEL SECURITY;

-- Políticas para desabastecimientos_activos
-- Lectura pública para el frontend autenticado
DROP POLICY IF EXISTS "Lectura pública de desabastecimientos" ON public.desabastecimientos_activos;
CREATE POLICY "Lectura pública de desabastecimientos"
    ON public.desabastecimientos_activos
    FOR SELECT
    TO authenticated
    USING (true);

-- =======================================================================
-- PARTE 4: FUNCIONES DE BÚSQUEDA RPC (bc_search_simple y bc_search_avanzado)
-- =======================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- RPC: Búsqueda simple
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

-- RPC: Búsqueda avanzada
CREATE OR REPLACE FUNCTION public.bc_search_avanzado(
  p_cn text DEFAULT NULL,
  p_nombre text DEFAULT NULL,
  p_principio_activo text DEFAULT NULL,
  p_laboratorio text DEFAULT NULL,
  p_forma_farmaceutica text DEFAULT NULL,
  p_via_administracion text DEFAULT NULL,
  p_solo_clasificados boolean DEFAULT false
)
RETURNS SETOF public.blistercheck_catalogo
LANGUAGE sql
STABLE
AS $$
  SELECT c.*
  FROM public.blistercheck_catalogo c
  LEFT JOIN public.blistercheck_clasificacion_global cl ON c.cn = cl.cn
  WHERE
    (p_cn IS NULL OR c.cn ILIKE p_cn || '%')
    AND (p_nombre IS NULL OR unaccent(c.nombre) ILIKE '%' || unaccent(p_nombre) || '%')
    AND (p_principio_activo IS NULL OR unaccent(COALESCE(c.principio_activo, '')) ILIKE '%' || unaccent(p_principio_activo) || '%')
    AND (p_laboratorio IS NULL OR unaccent(COALESCE(c.laboratorio, '')) ILIKE '%' || unaccent(p_laboratorio) || '%')
    AND (p_forma_farmaceutica IS NULL OR c.forma_farmaceutica = p_forma_farmaceutica OR c.forma_simplificada = p_forma_farmaceutica)
    AND (p_via_administracion IS NULL OR c.via_administracion = p_via_administracion)
    AND (
      NOT p_solo_clasificados OR 
      (cl.requiere_reenvasado IS NOT NULL OR cl.requiere_reetiquetado IS NOT NULL OR cl.apto_sdmdu_blister IS NOT NULL)
    )
  ORDER BY c.nombre ASC
  LIMIT 3000;
$$;

GRANT EXECUTE ON FUNCTION public.bc_search_simple(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bc_search_avanzado(text, text, text, text, text, text, boolean) TO anon, authenticated, service_role;

-- Recargar la caché de esquema de PostgREST para asegurar que reconoce la Primary Key en upserts
NOTIFY pgrst, 'reload schema';

