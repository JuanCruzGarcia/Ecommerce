'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';

function ProductSearchInner({ categories }: { categories: { id: string, name: string }[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const currentCategory = searchParams.get('category') || '';

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            router.push(`/collections?${createQueryString('q', searchTerm)}`);
        });
    };

    const handleCategoryClick = (categoryName: string) => {
        startTransition(() => {
            router.push(`/collections?${createQueryString('category', categoryName)}`);
        });
    };

    return (
        <div className="mb-12">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
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
                <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-primary text-white px-6 rounded-full font-bold hover:bg-primary/90 transition-colors"
                >
                    Buscar
                </button>
            </form>

            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth justify-center">
                <button 
                    onClick={() => handleCategoryClick('')}
                    className={`px-8 py-2.5 rounded-full text-sm font-black shrink-0 shadow-md transition-colors ${!currentCategory ? 'gradient-bg text-white' : 'bg-primary/5 hover:bg-primary/10 text-slate-700'}`}
                >
                    Todos
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.name)}
                        className={`px-8 py-2.5 rounded-full text-sm font-bold shrink-0 shadow-md transition-colors ${currentCategory === cat.name ? 'gradient-bg text-white' : 'bg-primary/5 hover:bg-primary/10 border border-primary/10 text-slate-700'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            
            {(searchTerm || currentCategory) && (
                <div className="text-center mt-4 text-slate-500">
                    {isPending ? (
                        <span className="animate-pulse">Buscando...</span>
                    ) : (
                        <span>
                            Mostrando resultados para: 
                            {searchTerm && <span className="font-bold text-slate-900 ml-2">"{searchTerm}"</span>}
                            {currentCategory && <span className="font-bold text-primary ml-2">[{currentCategory}]</span>}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ProductSearch({ categories }: { categories: { id: string, name: string }[] }) {
    return (
        <Suspense fallback={
            <div className="mb-12">
                <div className="relative max-w-2xl mx-auto mb-8">
                    <div className="w-full h-14 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-3 justify-center">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-24 h-10 bg-gray-100 rounded-full animate-pulse" />
                    ))}
                </div>
            </div>
        }>
            <ProductSearchInner categories={categories} />
        </Suspense>
    );
}
