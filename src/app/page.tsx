import { createSupabaseServer } from '@/lib/supabase/server';
import StoreHeader from '@/components/StoreHeader';
import CategoryFilterGrid from '@/components/CategoryFilterGrid';

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
  is_featured: boolean;
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
      ),
      is_featured
    `)
    .eq('active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  // Obtener categorías
  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  return (
    <div className="min-h-screen bg-background-light text-slate-900 antialiased font-display">
      <StoreHeader />

      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 hero-gradient z-0"></div>
          <div className="absolute -top-40 -right-40 size-[600px] bg-primary/20 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-40 -left-40 size-[600px] bg-secondary/10 blur-[120px] rounded-full"></div>

          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-8">
              <span className="size-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary font-display">Colección Exclusiva</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">
              Nuestros <span className="gradient-text">Destacados</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Explorá la selección especial que hemos preparado con los mejores productos para tu día a día.
            </p>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
            <span className="material-symbols-outlined text-primary text-3xl">keyboard_double_arrow_down</span>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">Productos Destacados</h2>
            <p className="text-slate-500 font-medium">La mejor selección que tenemos para ofrecerte.</p>
          </div>
          <CategoryFilterGrid
            products={(products as Product[]) || []}
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
                <span className="material-symbols-outlined text-2xl">location_on</span>
              </div>
              <span className="text-2xl font-black tracking-tight">DISTRIPHONE</span>
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
            <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Categorías</h4>
            <ul className="space-y-4 text-slate-500 text-sm font-bold">
              <li><a className="hover:text-primary transition-colors" href="#">Hombres</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Mujeres</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Accesorios</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Lanzamientos</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Ayuda</h4>
            <ul className="space-y-4 text-slate-500 text-sm font-bold">
              <li><a className="hover:text-primary transition-colors" href="#">Estado de Pedido</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Envíos y Entregas</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Devoluciones</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Pagos</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Contacto</h4>
            <ul className="space-y-5 text-slate-500 text-sm font-bold">
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
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 E-COMMERCE. FrameDigitalStudio</p>
          <div className="flex items-center gap-8 opacity-40 transition-opacity hover:opacity-100">
            <img className="h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTBS2KimGMTYmdTy6z8QdBTUFdJkxFYpafCUa8wcjb2fnez2JqMxmlDjRZbeMqYPIv586PikJm2K8JPersfdUB58PVc3fW9N0Mv65AOXOaAhqTWImCQ5zCxweEWpb-A989aj1kcum805GlNDWC9czMYkiZINLM0UQiSK0qKYEt1EEYPxTLXbxya1u9u8vFdCSnCCwXrMRG8vigX_teqjRxzdse1ZaklN_q9xFmQbrybkMXokE0pUwjDAFECRn_9ODw1IP2hJM0OV8" alt="Visa" />
            <img className="h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoE7DfbLKVLxDCRSIzb1zkc3-6fNbHmipnH0QkGV2gJsYFvoD3CFEMPtpKMa01bxzl0vH3hGs5MENJg0vGQmeCwk1N4ccao71nBDPlN8Mg6nTbjJd8Q7prOqIRhgGgMg8Vu3vbhonfVaNFqnN-ZgCvS7EB2BjyypXuCTJKiSWJjVegX2rTMxSZ36DeJrakWjq9WR_XG-B6Wj55748uAH_BSMW9uAJkN66zLZPfZ5HzwqTZB942Tnx6x9XBhZMYe41dkN6usTBytM4" alt="Mastercard" />
          </div>
        </div>
      </footer>
    </div>
  );
}