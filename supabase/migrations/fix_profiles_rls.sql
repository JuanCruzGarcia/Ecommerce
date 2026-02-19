-- ================================================================
-- ARREGLO DE PERMISOS (RLS) PARA LA TABLA PROFILES
-- ================================================================

-- 1. Asegurarnos que RLS está activo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Borrar políticas antiguas para evitar conflictos y errores
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. CREAR POLÍTICA DE LECTURA (La más importante ahora mismo)
-- Permite que el usuario logueado pueda leer SU propia fila en 'profiles'
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- 4. CREAR POLÍTICA DE ACTUALIZACIÓN
-- Permite que el usuario edite sus datos (nombre, avatar, etc.)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( auth.uid() = id );

-- 5. CREAR POLÍTICA DE INSERCIÓN
-- Permite insertar (necesario si el trigger fallara y hubiera que hacerlo manual)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = id );
