'use client';

import { useState } from 'react';
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

type Category = {
  id: string;
  name: string;
};

interface CategoryFilterGridProps {
  products: Product[];
  categories: Category[];
}

export default function CategoryFilterGrid({ products, categories }: CategoryFilterGridProps) {
  const [activeCategory, setActiveCategory] = useState('');

  const normalizedProducts = products.map((p) => ({
    ...p,
    categories: p.categories
      ? Array.isArray(p.categories)
        ? p.categories
        : [p.categories as { name: string }]
      : [],
  }));

  const filteredProducts = activeCategory
    ? normalizedProducts.filter((p) =>
        p.categories.some(
          (cat) => cat.name.toLowerCase() === activeCategory.toLowerCase()
        )
      )
    : normalizedProducts;

  return (
    <>
      {/* Category Buttons + Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-primary/10 pb-8">
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-8 py-2.5 rounded-full text-sm font-black shrink-0 shadow-md transition-colors ${
              !activeCategory
                ? 'gradient-bg text-white'
                : 'bg-primary/5 hover:bg-primary/10 border border-primary/10 text-slate-700'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setActiveCategory(activeCategory === cat.name ? '' : cat.name)
              }
              className={`px-8 py-2.5 rounded-full text-sm font-bold shrink-0 shadow-md transition-colors ${
                activeCategory === cat.name
                  ? 'gradient-bg text-white'
                  : 'bg-primary/5 hover:bg-primary/10 border border-primary/10 text-slate-700'
              }`}
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

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">
            search_off
          </span>
          <h3 className="text-xl font-bold text-slate-900">Sin resultados</h3>
          <p className="text-slate-500 mt-2">
            No hay productos en la categoría <span className="font-bold text-primary">{activeCategory}</span>.
          </p>
        </div>
      )}
    </>
  );
}
