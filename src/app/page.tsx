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
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased font-display">
      <StoreHeader />

      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 hero-gradient z-0"></div>
          <div className="absolute -top-40 -right-40 size-[600px] bg-primary/20 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-40 -left-40 size-[600px] bg-blue-500/10 blur-[120px] rounded-full"></div>

          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-8">
              <span className="size-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary font-display">Nueva Temporada 2024</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">
              Descubrí lo <span className="gradient-text">Nuevo</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Explora la colección premium con diseños exclusivos que fusionan el estilo urbano con la máxima elegancia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="gradient-bg text-white px-10 py-5 rounded-full text-lg font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-transform uppercase tracking-wider">
                Ver Colección
              </button>
              <button className="bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white px-10 py-5 rounded-full text-lg font-bold border border-slate-200 dark:border-slate-700 transition-colors">
                Explorar Ofertas
              </button>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
            <span className="material-symbols-outlined text-primary text-3xl">keyboard_double_arrow_down</span>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-primary/10 pb-8">
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
              <button className="gradient-bg text-white px-8 py-2.5 rounded-full text-sm font-black shrink-0 shadow-md">Todos</button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  className="bg-primary/5 hover:bg-primary/10 border border-primary/10 px-8 py-2.5 rounded-full text-sm font-bold shrink-0 transition-colors text-slate-700 dark:text-slate-300"
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-xl">filter_list</span>
              <span className="text-sm font-bold uppercase tracking-wider">Filtrar y Ordenar</span>
            </div>
          </div>

          {/* PRODUCT GRID */}
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {(products as Product[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">inventory_2</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Próximamente...</h3>
              <p className="text-slate-500 mt-2">Estamos curando las mejores piezas para vos.</p>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900/50 border-t border-primary/10 pt-24 pb-12 transition-colors">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-8 group cursor-pointer">
              <div className="size-10 gradient-bg rounded-lg flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
                <span className="text-xl font-black">E</span>
              </div>
              <span className="text-2xl font-black tracking-tight dark:text-white">E-Shop</span>
            </div>
            <div className="flex gap-4">
              {['public', 'alternate_email', 'share'].map((icon) => (
                <a key={icon} className="size-12 bg-primary/5 hover:bg-primary rounded-full flex items-center justify-center text-primary hover:text-white transition-all duration-300" href="#">
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-black text-slate-900 dark:text-white mb-8 uppercase tracking-widest text-xs">Categorías</h4>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm font-bold">
              <li><a className="hover:text-primary transition-colors" href="#">Hombres</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Mujeres</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Accesorios</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Lanzamientos</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-slate-900 dark:text-white mb-8 uppercase tracking-widest text-xs">Ayuda</h4>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm font-bold">
              <li><a className="hover:text-primary transition-colors" href="#">Estado de Pedido</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Envíos y Entregas</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Devoluciones</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Pagos</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-slate-900 dark:text-white mb-8 uppercase tracking-widest text-xs">Contacto</h4>
            <ul className="space-y-5 text-slate-500 dark:text-slate-400 text-sm font-bold">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Buenos Aires, AR
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">mail</span>
                hola@eshop.com.ar
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">phone</span>
                +54 (11) 4XXX-8XXX
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 E-COMMERCE. FrameDigitalStudio</p>
          <div className="flex items-center gap-8 opacity-40 dark:invert transition-opacity hover:opacity-100">
            <img className="h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTBS2KimGMTYmdTy6z8QdBTUFdJkxFYpafCUa8wcjb2fnez2JqMxmlDjRZbeMqYPIv586PikJm2K8JPersfdUB58PVc3fW9N0Mv65AOXOaAhqTWImCQ5zCxweEWpb-A989aj1kcum805GlNDWC9czMYkiZINLM0UQiSK0qKYEt1EEYPxTLXbxya1u9u8vFdCSnCCwXrMRG8vigX_teqjRxzdse1ZaklN_q9xFmQbrybkMXokE0pUwjDAFECRn_9ODw1IP2hJM0OV8" alt="Visa" />
            <img className="h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoE7DfbLKVLxDCRSIzb1zkc3-6fNbHmipnH0QkGV2gJsYFvoD3CFEMPtpKMa01bxzl0vH3hGs5MENJg0vGQmeCwk1N4ccao71nBDPlN8Mg6nTbjJd8Q7prOqIRhgGgMg8Vu3vbhonfVaNFqnN-ZgCvS7EB2BjyypXuCTJKiSWJjVegX2rTMxSZ36DeJrakWjq9WR_XG-B6Wj55748uAH_BSMW9uAJkN66zLZPfZ5HzwqTZB942Tnx6x9XBhZMYe41dkN6usTBytM4" alt="Mastercard" />
          </div>
        </div>
      </footer>
    </div>
  );
}