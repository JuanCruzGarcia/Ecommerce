import { createSupabaseServer } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import StoreHeader from '@/components/StoreHeader';
import ProductDetailClient from '@/components/ProductDetailClient';

interface ProductPageProps {
    params: {
        id: string;
    };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServer();
    const { id } = await params;

    console.log('Fetching Product ID:', id);

    // 1. Fetch Product
    const { data: product, error } = await supabase
        .from('products')
        .select(`
            *,
            categories (name)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return <div className="p-10">Error loading product: {error.message}</div>;
    }

    if (!product) {
        console.error('Product not found (null)');
        return <div className="p-10">Product not found in database</div>;
    }

    // 2. Fetch Variants
    const { data: variants } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id)
        .eq('active', true);

    return (
        <div className="min-h-screen bg-background-light transition-colors duration-500">
            <StoreHeader />
            <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
                <ProductDetailClient product={product} variants={variants || []} />
            </main>
        </div>
    );
}
