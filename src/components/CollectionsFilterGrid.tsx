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
  categories: { name: string }[] | null;
};

type Category = {
  id: string;
  name: string;
};

interface CollectionsFilterGridProps {
  products: Product[];
  categories: Category[];
}

export default function CollectionsFilterGrid({ products, categories }: CollectionsFilterGridProps) {
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Normalize categories to always be an array (Supabase returns object on many-to-one)
  const normalizedProducts = products.map((p) => ({
    ...p,
    categories: p.categories
      ? Array.isArray(p.categories)
        ? p.categories
        : [p.categories as { name: string }]
      : [],
  }));

  // Apply filters
  const filteredProducts = normalizedProducts.filter((p) => {
    const matchesSearch = searchTerm
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesCategory = activeCategory
      ? p.categories.some(
          (cat) => cat.name.toLowerCase() === activeCategory.toLowerCase()
        )
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full bg-white border-2 border-slate-200 rounded-full px-6 py-4 pl-14 text-lg focus:outline-none focus:border-primary transition-colors text-slate-900"
        />
        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
          search
        </span>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Category Buttons */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth justify-center mb-6">
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

      {/* Active filters indicator */}
      {(searchTerm || activeCategory) && (
        <div className="text-center mb-8 text-slate-500 text-sm">
          Mostrando{' '}
          <span className="font-bold text-slate-900">{filteredProducts.length}</span>{' '}
          {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
          {searchTerm && (
            <> para <span className="font-bold text-slate-900">"{searchTerm}"</span></>
          )}
          {activeCategory && (
            <> en <span className="font-bold text-primary">{activeCategory}</span></>
          )}
          <button
            onClick={() => { setSearchTerm(''); setActiveCategory(''); }}
            className="ml-3 text-primary hover:underline font-bold"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 text-left">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
            search_off
          </span>
          <h3 className="text-xl font-bold text-slate-900">Sin resultados</h3>
          <p className="text-slate-500 mt-2">
            No se encontraron productos que coincidan con tu búsqueda.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setActiveCategory(''); }}
            className="mt-6 px-6 py-2.5 gradient-bg text-white rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Ver todos los productos
          </button>
        </div>
      )}
    </>
  );
}
