-- =============================================
-- BlisterCheck — Setup de tablas en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- Tabla 1: Catálogo completo de medicamentos comercializados (sincronizado cada 14 días)
CREATE TABLE IF NOT EXISTS blistercheck_catalogo (
  nregistro              TEXT PRIMARY KEY,
  cn                     TEXT,
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
CREATE TABLE IF NOT EXISTS blistercheck_clasificacion (
  nregistro                TEXT PRIMARY KEY
                           REFERENCES blistercheck_catalogo(nregistro) ON DELETE CASCADE,
  requiere_reenvasado      BOOLEAN DEFAULT NULL,
  requiere_reetiquetado    BOOLEAN DEFAULT NULL,
  apto_sdmdu_blister       BOOLEAN DEFAULT NULL,
  en_mi_farmacia           BOOLEAN DEFAULT FALSE,
  notas                    TEXT,
  fecha_clasificacion      TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
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
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
