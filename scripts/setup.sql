-- =============================================
-- BlisterCheck — Setup de tablas en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- Tabla 1: Catálogo completo de medicamentos comercializados (sincronizado cada 14 días)
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
  last_sync              TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla 2: Clasificación Global SDMDU (COMÚN Y COMPARTIDA PARA TODOS LOS USUARIOS)
CREATE TABLE IF NOT EXISTS blistercheck_clasificacion_global (
  cn                       TEXT PRIMARY KEY REFERENCES blistercheck_catalogo(cn) ON DELETE CASCADE,
  requiere_reenvasado      BOOLEAN DEFAULT NULL,
  requiere_reetiquetado    BOOLEAN DEFAULT NULL,
  apto_sdmdu_blister       BOOLEAN DEFAULT NULL,
  solo_envase_clinico      BOOLEAN DEFAULT NULL,
  updated_by               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blistercheck_clasificacion_global ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global read clasificacion" ON blistercheck_clasificacion_global;
CREATE POLICY "Global read clasificacion" ON blistercheck_clasificacion_global FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Global write clasificacion" ON blistercheck_clasificacion_global;
CREATE POLICY "Global write clasificacion" ON blistercheck_clasificacion_global FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabla 3: Datos Privados del Hospital / Usuario (ESTRICTAMENTE PRIVADO POR USUARIO)
CREATE TABLE IF NOT EXISTS blistercheck_user_farmacia (
  cn                       TEXT REFERENCES blistercheck_catalogo(cn) ON DELETE CASCADE,
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  en_mi_farmacia           BOOLEAN DEFAULT FALSE,
  notas                    TEXT DEFAULT NULL,
  fecha_clasificacion      TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cn, user_id)
);

ALTER TABLE blistercheck_user_farmacia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Private user farmacia policy" ON blistercheck_user_farmacia;
CREATE POLICY "Private user farmacia policy" ON blistercheck_user_farmacia FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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
-- Tabla 3: Desabastecimientos Activos (Actualizado diariamente por CIMA Watch / BlisterCheck)
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
CREATE POLICY "Lectura pública de desabastecimientos"
    ON public.desabastecimientos_activos
    FOR SELECT
    TO authenticated
    USING (true);
