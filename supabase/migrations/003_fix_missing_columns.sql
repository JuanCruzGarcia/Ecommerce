-- =====================================================
-- FIX: Agregar columnas updated_at faltantes
-- Descripción: Soluciona el error 'record "new" has no field "updated_at"'
--              que ocurre porque un trigger intenta actualizar una columna que no existe.
-- =====================================================

-- 1. Agregar updated_at a ORDERS
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Agregar updated_at a PRODUCTS (para evitar error similar al descontar stock)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Asegurar que los triggers de update timestamp existan y funcionen
-- (Esto es preventivo, por si el trigger original estaba roto o mal definido)

CREATE OR REPLACE FUNCTION public.handle_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Trigger para orders
DROP TRIGGER IF EXISTS handle_orders_updated_at ON public.orders;
CREATE TRIGGER handle_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_column();

-- Trigger para products
DROP TRIGGER IF EXISTS handle_products_updated_at ON public.products;
CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_column();
