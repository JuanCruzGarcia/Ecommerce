'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';

type Product = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    active: boolean;
    is_featured: boolean;
    image_url: string | null;
    categories: {
        name: string;
    }[] | null;
};

export default function AdminProductsPage() {
    const supabase = createSupabaseClient();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('products')
                .select(`
                    id,
                    name,
                    description,
                    price,
                    stock,
                    active,
                    is_featured,
                    image_url,
                    category_id,
                    categories!category_id (
                        name
                    )
                `)
                .order('created_at', { ascending: false });
            if (data) setProducts(data);
            setLoading(false);
        };

        fetchProducts();
    }, []);

    const toggleFeatured = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setProducts(products.map(p => p.id === id ? { ...p, is_featured: !currentStatus } : p));
        
        const { error } = await supabase
            .from('products')
            .update({ is_featured: !currentStatus })
            .eq('id', id);

        if (error) {
            // Revert on error
            setProducts(products.map(p => p.id === id ? { ...p, is_featured: currentStatus } : p));
            alert('Error al actualizar destacado: ' + error.message);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {products.length} producto{products.length !== 1 ? 's' : ''} en total
                    </p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo producto
                </Link>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-6">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>

            {/* Tabla de productos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                        <p className="mt-3 text-gray-500">Cargando productos...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="mt-3 text-gray-500">
                            {searchTerm ? 'No se encontraron productos' : 'No hay productos aún'}
                        </p>
                        {!searchTerm && (
                            <Link
                                href="/admin/products/new"
                                className="inline-block mt-4 text-black font-medium hover:underline"
                            >
                                Crear el primer producto →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Categoría
                                    </th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Precio
                                    </th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Destacado
                                    </th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Producto con imagen */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </p>
                                                    {product.description && (
                                                        <p className="text-sm text-gray-500 truncate max-w-xs">
                                                            {product.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Categoría */}
                                        <td className="px-6 py-4">
                                            {product.categories?.[0]?.name ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    {product.categories[0].name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">—</span>
                                            )}
                                        </td>

                                        {/* Precio */}
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-gray-900">
                                                ${product.price.toLocaleString()}
                                            </span>
                                        </td>

                                        {/* Stock */}
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10
                                                ? 'bg-green-100 text-green-700'
                                                : product.stock > 0
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {product.stock}
                                            </span>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${product.active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${product.active ? 'bg-green-500' : 'bg-gray-400'
                                                    }`}></span>
                                                {product.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>

                                        {/* Destacado */}
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => toggleFeatured(product.id, product.is_featured)}
                                                className={`p-1.5 rounded-full transition-colors ${product.is_featured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:text-yellow-500 hover:bg-gray-50'}`}
                                                title={product.is_featured ? "Quitar de destacados" : "Destacar producto"}
                                            >
                                                <svg className="w-5 h-5" fill={product.is_featured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            </button>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/products/${product.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Editar
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
