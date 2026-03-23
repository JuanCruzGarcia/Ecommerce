import { createSupabaseServer } from '@/lib/supabase/server';
import StoreHeader from '@/components/StoreHeader';
import CollectionsFilterGrid from '@/components/CollectionsFilterGrid';

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

export default async function CollectionsPage() {
  const supabase = await createSupabaseServer();

  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  const { data: rawProducts } = await supabase
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

  const products = (rawProducts as Product[]) || [];

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

        {/* Search, Filter & Grid */}
        <section className="max-w-7xl mx-auto px-6">
          <CollectionsFilterGrid
            products={products}
            categories={categories || []}
          />
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
