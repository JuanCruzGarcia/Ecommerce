-- 1. Modify order_items table to support variants
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id),
ADD COLUMN IF NOT EXISTS attributes JSONB;

-- 2. Update decrease_product_stock function to handle variants
CREATE OR REPLACE FUNCTION public.decrease_product_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_order_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_variant_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_previous_stock INTEGER;
    v_new_stock INTEGER;
    v_table_name TEXT;
BEGIN
    IF p_variant_id IS NOT NULL THEN
        -- Variant stock logic
        v_table_name := 'product_variants';
        
        SELECT stock INTO v_previous_stock
        FROM product_variants
        WHERE id = p_variant_id
        FOR UPDATE;
        
        IF v_previous_stock IS NULL THEN
             RAISE EXCEPTION 'Variante con ID % no existe', p_variant_id;
        END IF;

         IF v_previous_stock < p_quantity THEN
            RAISE EXCEPTION 'Stock insuficiente para variante %. Stock actual: %, Solicitado: %', 
                p_variant_id, v_previous_stock, p_quantity;
        END IF;

        v_new_stock := v_previous_stock - p_quantity;

        UPDATE product_variants
        SET stock = v_new_stock,
            updated_at = now()
        WHERE id = p_variant_id;

        -- También descontar del stock total del producto padre
        UPDATE products
        SET stock = stock - p_quantity,
            updated_at = now()
        WHERE id = p_product_id;

    ELSE
        -- Original product stock logic
        v_table_name := 'products';

        SELECT stock INTO v_previous_stock
        FROM products
        WHERE id = p_product_id
        FOR UPDATE;
        
        IF v_previous_stock IS NULL THEN
            RAISE EXCEPTION 'Producto con ID % no existe', p_product_id;
        END IF;
        
        IF v_previous_stock < p_quantity THEN
            RAISE EXCEPTION 'Stock insuficiente para producto %. Stock actual: %, Solicitado: %', 
                p_product_id, v_previous_stock, p_quantity;
        END IF;
        
        v_new_stock := v_previous_stock - p_quantity;
        
        UPDATE products
        SET stock = v_new_stock,
            updated_at = now()
        WHERE id = p_product_id;
    END IF;

    
    -- Registrar movimiento en historial (Product Level always for reference, or variant specific?)
    -- Let's keep product_id reference but maybe add note about variant
    INSERT INTO stock_movements (
        product_id,
        order_id,
        quantity_change,
        previous_stock,
        new_stock,
        movement_type,
        created_by,
        notes
    ) VALUES (
        p_product_id,
        p_order_id,
        -p_quantity,
        v_previous_stock,
        v_new_stock,
        'sale',
        p_user_id,
        CASE WHEN p_variant_id IS NOT NULL THEN 'Variant deduction: ' || p_variant_id ELSE NULL END
    );
END;
$$;


-- 3. Update handle_order_stock_decrease trigger to pass variant_id
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
            SELECT product_id, quantity, variant_id 
            FROM order_items 
            WHERE order_id = NEW.id
        LOOP
            -- Descontar stock usando la función segura
            PERFORM decrease_product_stock(
                v_item.product_id,
                v_item.quantity,
                NEW.id,
                NEW.user_id,
                v_item.variant_id -- Pass new parameter
            );
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$;
