-- =====================================================
-- MIGRACIÓN: Sistema de Gestión de Stock Automático
-- Descripción: Implementa descuento automático de stock,
--              validaciones y registro de movimientos
-- =====================================================

-- =====================================================
-- 1. TABLA: stock_movements (Historial de movimientos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    quantity_change INTEGER NOT NULL, -- negativo para ventas, positivo para restock
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'restock', 'adjustment', 'return')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_order_id ON public.stock_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

-- =====================================================
-- 2. FUNCIÓN: Verificar disponibilidad de stock
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_stock_availability(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INTEGER;
BEGIN
    -- Obtener stock actual del producto
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id;
    
    -- Si el producto no existe, retornar false
    IF v_current_stock IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar si hay stock suficiente
    RETURN v_current_stock >= p_quantity;
END;
$$;

-- =====================================================
-- 3. FUNCIÓN: Descontar stock y registrar movimiento
-- =====================================================
CREATE OR REPLACE FUNCTION public.decrease_product_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_order_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_previous_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Bloquear la fila del producto para evitar condiciones de carrera
    SELECT stock INTO v_previous_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;
    
    -- Verificar que el producto existe
    IF v_previous_stock IS NULL THEN
        RAISE EXCEPTION 'Producto con ID % no existe', p_product_id;
    END IF;
    
    -- Verificar que hay stock suficiente
    IF v_previous_stock < p_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente para producto %. Stock actual: %, Solicitado: %', 
            p_product_id, v_previous_stock, p_quantity;
    END IF;
    
    -- Calcular nuevo stock
    v_new_stock := v_previous_stock - p_quantity;
    
    -- Actualizar stock del producto
    UPDATE products
    SET stock = v_new_stock,
        updated_at = now()
    WHERE id = p_product_id;
    
    -- Registrar movimiento en historial
    INSERT INTO stock_movements (
        product_id,
        order_id,
        quantity_change,
        previous_stock,
        new_stock,
        movement_type,
        created_by
    ) VALUES (
        p_product_id,
        p_order_id,
        -p_quantity, -- negativo porque es una venta
        v_previous_stock,
        v_new_stock,
        'sale',
        p_user_id
    );
END;
$$;

-- =====================================================
-- 4. FUNCIÓN: Aumentar stock (para restock/ajustes)
-- =====================================================
CREATE OR REPLACE FUNCTION public.increase_product_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_movement_type TEXT DEFAULT 'restock',
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_previous_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Validar tipo de movimiento
    IF p_movement_type NOT IN ('restock', 'adjustment', 'return') THEN
        RAISE EXCEPTION 'Tipo de movimiento inválido: %', p_movement_type;
    END IF;
    
    -- Bloquear la fila del producto
    SELECT stock INTO v_previous_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;
    
    -- Verificar que el producto existe
    IF v_previous_stock IS NULL THEN
        RAISE EXCEPTION 'Producto con ID % no existe', p_product_id;
    END IF;
    
    -- Calcular nuevo stock
    v_new_stock := v_previous_stock + p_quantity;
    
    -- Actualizar stock del producto
    UPDATE products
    SET stock = v_new_stock,
        updated_at = now()
    WHERE id = p_product_id;
    
    -- Registrar movimiento en historial
    INSERT INTO stock_movements (
        product_id,
        quantity_change,
        previous_stock,
        new_stock,
        movement_type,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_quantity, -- positivo porque es un aumento
        v_previous_stock,
        v_new_stock,
        p_movement_type,
        p_notes,
        p_user_id
    );
END;
$$;

-- =====================================================
-- 5. TRIGGER: Descuento automático al confirmar orden
-- =====================================================

-- Función del trigger
CREATE OR REPLACE FUNCTION public.handle_order_stock_decrease()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- Solo procesar si el estado cambió a 'confirmed'
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        
        -- Iterar sobre todos los items de la orden
        FOR v_item IN 
            SELECT product_id, quantity 
            FROM order_items 
            WHERE order_id = NEW.id
        LOOP
            -- Descontar stock usando la función segura
            PERFORM decrease_product_stock(
                v_item.product_id,
                v_item.quantity,
                NEW.id,
                NEW.user_id
            );
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS trigger_order_confirmed_stock_decrease ON public.orders;

CREATE TRIGGER trigger_order_confirmed_stock_decrease
    AFTER INSERT OR UPDATE OF status
    ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_stock_decrease();

-- =====================================================
-- 6. POLÍTICAS RLS para stock_movements
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Admins pueden ver todos los movimientos
CREATE POLICY "Admins can view all stock movements"
ON public.stock_movements
FOR SELECT
TO authenticated
USING (
    public.is_admin() -- Usar la función is_admin() existente del fix_rls.sql
);

-- Policy: Sistema puede insertar movimientos (via triggers/functions)
-- Esta policy permite que las funciones SECURITY DEFINER inserten registros
CREATE POLICY "System can insert stock movements"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (true); -- Las funciones SECURITY DEFINER verifican los permisos

-- Policy: Admins pueden insertar movimientos manuales
CREATE POLICY "Admins can insert stock movements"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);

-- =====================================================
-- 7. FUNCIÓN AUXILIAR: Obtener historial de un producto
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_product_stock_history(
    p_product_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    movement_type TEXT,
    quantity_change INTEGER,
    previous_stock INTEGER,
    new_stock INTEGER,
    order_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        id,
        movement_type,
        quantity_change,
        previous_stock,
        new_stock,
        order_id,
        notes,
        created_at,
        created_by
    FROM stock_movements
    WHERE product_id = p_product_id
    ORDER BY created_at DESC
    LIMIT p_limit;
$$;

-- =====================================================
-- 8. COMENTARIOS para documentación
-- =====================================================
COMMENT ON TABLE public.stock_movements IS 'Registro de todos los movimientos de stock (ventas, restock, ajustes)';
COMMENT ON FUNCTION public.check_stock_availability IS 'Verifica si hay stock suficiente para un producto';
COMMENT ON FUNCTION public.decrease_product_stock IS 'Descuenta stock de un producto y registra el movimiento (usado en ventas)';
COMMENT ON FUNCTION public.increase_product_stock IS 'Aumenta stock de un producto y registra el movimiento (usado en restock/ajustes)';
COMMENT ON FUNCTION public.handle_order_stock_decrease IS 'Trigger function que descuenta stock automáticamente cuando una orden se confirma';
COMMENT ON FUNCTION public.get_product_stock_history IS 'Obtiene el historial de movimientos de stock de un producto';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
