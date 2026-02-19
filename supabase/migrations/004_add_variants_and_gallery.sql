-- =====================================================
-- MIGRACIÓN: Agregar Variantes y Galería de Imágenes
-- Descripción: Agrega soporte para variantes visuales (JSON)
--              y múltiples imágenes (Array) a la tabla products.
-- =====================================================

-- 1. Agregar columna 'variants' (JSONB)
-- Estructura esperada: [{"name": "Color", "values": ["Rojo", "Azul"]}, {"name": "Talle", "values": ["S", "M"]}]
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- 2. Agregar columna 'gallery_images' (ARRAY TEXT)
-- Almacenará URLs de imágenes adicionales
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';

-- 3. Comentarios para documentación
COMMENT ON COLUMN public.products.variants IS 'Lista de variantes visuales (ej: Color, Talle) sin control de stock individual.';
COMMENT ON COLUMN public.products.gallery_images IS 'URLs de imágenes adicionales del producto (galería).';
