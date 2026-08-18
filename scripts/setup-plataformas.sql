-- 1. Añadir columna a la tabla existente
ALTER TABLE blistercheck_user_laboratorios 
ADD COLUMN IF NOT EXISTS is_plataforma BOOLEAN DEFAULT false;

-- 2. Crear nueva tabla para enlazar medicamentos a plataformas
CREATE TABLE IF NOT EXISTS blistercheck_user_plataforma_medicamentos (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  laboratorio_nombre VARCHAR(255) NOT NULL,
  cn VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, laboratorio_nombre, cn)
);

ALTER TABLE blistercheck_user_plataforma_medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own platform meds" 
  ON blistercheck_user_plataforma_medicamentos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
