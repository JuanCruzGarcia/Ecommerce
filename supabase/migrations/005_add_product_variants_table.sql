-- Create the extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    attributes JSONB NOT NULL, -- e.g. {"Color": "Red", "Size": "M"}
    stock INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2), -- Optional override price
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
USING (true);

CREATE POLICY "Variants are insertable by authenticated users only" 
ON public.product_variants FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Variants are updatable by authenticated users only" 
ON public.product_variants FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Variants are deletable by authenticated users only" 
ON public.product_variants FOR DELETE 
USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
