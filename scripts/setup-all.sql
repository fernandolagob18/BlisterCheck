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
  nregistro              TEXT PRIMARY KEY,
  cn                     TEXT UNIQUE,
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
  last_sync              TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla 2: Clasificaciones SDMDU del usuario (NUNCA tocada por el cron)
DROP TABLE IF EXISTS blistercheck_clasificacion CASCADE;
CREATE TABLE IF NOT EXISTS blistercheck_clasificacion (
  cn                       TEXT REFERENCES blistercheck_catalogo(cn) ON DELETE CASCADE,
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requiere_reenvasado      BOOLEAN DEFAULT NULL,
  requiere_reetiquetado    BOOLEAN DEFAULT NULL,
  apto_sdmdu_blister       BOOLEAN DEFAULT NULL,
  en_mi_farmacia           BOOLEAN DEFAULT FALSE,
  notas                    TEXT,
  fecha_clasificacion      TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cn, user_id)
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_bc_catalogo_nombre
  ON blistercheck_catalogo(nombre);
CREATE INDEX IF NOT EXISTS idx_bc_catalogo_cn
  ON blistercheck_catalogo(cn);
CREATE INDEX IF NOT EXISTS idx_bc_catalogo_principio
  ON blistercheck_catalogo(principio_activo);
CREATE INDEX IF NOT EXISTS idx_bc_catalogo_laboratorio
  ON blistercheck_catalogo(laboratorio);
CREATE INDEX IF NOT EXISTS idx_bc_catalogo_forma
  ON blistercheck_catalogo(forma_simplificada);
CREATE INDEX IF NOT EXISTS idx_bc_clasificacion_farmacia
  ON blistercheck_clasificacion(en_mi_farmacia);

-- RLS: solo usuarios autenticados pueden leer/escribir
ALTER TABLE blistercheck_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE blistercheck_clasificacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read catalogo" ON blistercheck_catalogo;
CREATE POLICY "Auth read catalogo" ON blistercheck_catalogo
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth all clasificacion" ON blistercheck_clasificacion;
CREATE POLICY "Auth all clasificacion" ON blistercheck_clasificacion
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_blistercheck_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_blistercheck_updated_at ON blistercheck_clasificacion;
CREATE TRIGGER set_blistercheck_updated_at
  BEFORE UPDATE ON blistercheck_clasificacion
  FOR EACH ROW EXECUTE FUNCTION update_blistercheck_updated_at();

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
