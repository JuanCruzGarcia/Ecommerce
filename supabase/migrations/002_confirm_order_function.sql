-- Función segura para confirmar una orden
-- Permite que el usuario confirme su propia orden, saltándose las restricciones de UPDATE directas
CREATE OR REPLACE FUNCTION public.confirm_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con permisos de admin
SET search_path = public
AS $$
DECLARE
    v_order_exists BOOLEAN;
BEGIN
    -- Verificar que la orden existe y pertenece al usuario actual (o es nueva)
    -- Nota: auth.uid() devuelve el ID del usuario autenticado
    SELECT EXISTS (
        SELECT 1 
        FROM orders 
        WHERE id = p_order_id 
        AND user_id = auth.uid()
    ) INTO v_order_exists;

    IF NOT v_order_exists THEN
        RAISE EXCEPTION 'Orden no encontrada o no pertenece al usuario';
    END IF;

    -- Actualizar el estado a confirmed
    -- Esto disparará automáticamente el trigger handle_order_stock_decrease
    UPDATE orders
    SET status = 'confirmed'
    WHERE id = p_order_id;
END;
$$;
