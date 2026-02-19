import { createSupabaseServer } from '@/lib/supabase/server';
import StoreHeader from '@/components/StoreHeader';
import ProductCard from '@/components/ProductCard';

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

export default async function Home() {
  const supabase = await createSupabaseServer();

  // Obtener productos activos con su categoría
  const { data: products } = await supabase
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

  // Obtener categorías
  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />

      {/* Categorías */}
      {categories && categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-2 flex-wrap">
            <span className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium">
              Todos
            </span>
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grid de productos */}
      <main className="max-w-7xl mx-auto px-4 pb-12 mt-10">
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(products as Product[]).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No hay productos disponibles</h3>
            <p className="text-gray-500 mt-1">Vuelve más tarde para ver nuevas colecciones.</p>
          </div>
        )}
      </main>
    </div>
  );
}