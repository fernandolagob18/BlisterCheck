-- Script para crear la tabla de configuraciones por laboratorio para cada usuario

CREATE TABLE blistercheck_user_laboratorios (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  laboratorio TEXT NOT NULL,
  pedido_minimo NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, laboratorio)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE blistercheck_user_laboratorios ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view their own laboratory data" 
  ON blistercheck_user_laboratorios FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own laboratory data" 
  ON blistercheck_user_laboratorios FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own laboratory data" 
  ON blistercheck_user_laboratorios FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own laboratory data" 
  ON blistercheck_user_laboratorios FOR DELETE 
  USING (auth.uid() = user_id);
