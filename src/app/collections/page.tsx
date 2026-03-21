import { createSupabaseServer } from '@/lib/supabase/server';
import StoreHeader from '@/components/StoreHeader';
import ProductCard from '@/components/ProductCard';
import ProductSearch from '@/components/ProductSearch';
import { Suspense } from 'react';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  gallery_images: string[] | null;
  active: boolean;
  categories: {
    name: string;
  }[] | null;
};

// Forzar revalidación dinámica (si se quiere siempre fresco) o mantener caché. 
// Usamos force-dynamic al depender de searchParams en un listado de productos
export const dynamic = 'force-dynamic';

export default async function CollectionsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createSupabaseServer();
  const searchParams = await props.searchParams;

  const queryParam = typeof searchParams.q === 'string' ? searchParams.q : '';
  const categoryParam = typeof searchParams.category === 'string' ? searchParams.category : '';

  // Get categories for the search component
  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  // Build the product query
  let supabaseQuery = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      stock,
      image_url,
      gallery_images,
      active,
      categories (
        name
      )
    `)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (queryParam) {
    supabaseQuery = supabaseQuery.ilike('name', `%${queryParam}%`);
  }

  const { data: rawProducts } = await supabaseQuery;
  
  // Cast products
  let products = (rawProducts as Product[]) || [];

  // Manual fallback for category filtering if PostgREST nested filters are tricky
  if (categoryParam) {
    products = products.filter(p => 
      p.categories?.some(cat => cat.name.toLowerCase() === categoryParam.toLowerCase())
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-slate-900 antialiased font-display">
      <StoreHeader />

      <main className="pt-32 pb-24">
        {/* Header Section */}
        <section className="max-w-7xl mx-auto px-6 mb-12 text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
                Nuestros <span className="gradient-text">Productos</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
                Explora todo nuestro catálogo. Buscá por nombre o filtrá por tus categorías favoritas.
            </p>
        </section>

        {/* Search & Filter Section */}
        <section className="max-w-7xl mx-auto px-6">
            <Suspense fallback={<div className="h-20 animate-pulse bg-slate-100 rounded-full mb-12"></div>}>
                <ProductSearch categories={categories || []} />
            </Suspense>
        </section>

        {/* Product Grid */}
        <section className="max-w-7xl mx-auto px-6 text-center">
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 text-left">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
                    <h3 className="text-xl font-bold text-slate-900">Sin resultados</h3>
                    <p className="text-slate-500 mt-2">No se encontraron productos que coincidan con tu búsqueda.</p>
                </div>
            )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-primary/10 pt-24 pb-12 transition-colors">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-8 group cursor-pointer">
              <div className="size-10 gradient-bg rounded-lg flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
                <span className="text-xl font-black">E</span>
              </div>
              <span className="text-2xl font-black tracking-tight">E-Shop</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Buscando siempre la innovación y la calidad premium en cada uno de nuestros diseños exclusivos.</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 E-COMMERCE. FrameDigitalStudio</p>
        </div>
      </footer>
    </div>
  );
}
