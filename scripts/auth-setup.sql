-- =======================================================================
-- MIGRATION SCRIPT: Supabase Auth & Profiles Setup
-- Ejecutar en: Supabase Dashboard > SQL Editor
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
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
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
