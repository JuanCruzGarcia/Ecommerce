// React.use is needed for unwrapping params/searchParams in Next.js 15+
'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Product = {
    id: string;
    name: string;
    stock: number;
    price: number;
    active: boolean;
    image_url: string | null;
    category_id: string | null;
    categories?: {
        name: string;
    } | null;
};

type StockFilter = 'all' | 'low' | 'out' | 'ok';

export default function StockManagementPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createSupabaseClient();

    // Unwrap searchParams
    const resolvedParams = React.use(searchParams);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    // Initialize filter based on URL param
    const [filter, setFilter] = useState<StockFilter>(
        (resolvedParams.filter as StockFilter) || 'all'
    );
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                stock,
                price,
                active,
                image_url,
                category_id,
                categories (
                    name
                )
            `)
            .order('stock', { ascending: true });

        if (data) {
            setProducts(data as any);
        }
        if (error) {
            console.error('Error fetching products:', error);
        }
        setLoading(false);
    };

    const getFilteredProducts = () => {
        let filtered = products;

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por nivel de stock
        switch (filter) {
            case 'low':
                return filtered.filter(p => p.stock > 0 && p.stock <= 5);
            case 'out':
                return filtered.filter(p => p.stock === 0);
            case 'ok':
                return filtered.filter(p => p.stock > 5);
            default:
                return filtered;
        }
    };

    const filteredProducts = getFilteredProducts();

    const stats = {
        total: products.length,
        lowStock: products.filter(p => p.stock > 0 && p.stock <= 5).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        ok: products.filter(p => p.stock > 5).length,
    };

    const getStockBadge = (stock: number) => {
        if (stock === 0) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Agotado</span>;
        }
        if (stock <= 5) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Stock bajo</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Disponible</span>;
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
                        <p className="text-gray-500 mt-1">Administra el stock de tus productos</p>
                    </div>
                    <button
                        onClick={fetchProducts}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <button
                    onClick={() => setFilter('all')}
                    className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all hover:shadow-md ${filter === 'all' ? 'ring-2 ring-black' : 'border-gray-200'}`}
                >
                    <p className="text-sm font-medium text-gray-500">Total Productos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </button>

                <button
                    onClick={() => setFilter('ok')}
                    className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all hover:shadow-md ${filter === 'ok' ? 'ring-2 ring-green-500' : 'border-gray-200'}`}
                >
                    <p className="text-sm font-medium text-gray-500">Stock OK (&gt;5)</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.ok}</p>
                </button>

                <button
                    onClick={() => setFilter('low')}
                    className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all hover:shadow-md ${filter === 'low' ? 'ring-2 ring-yellow-500' : 'border-gray-200'}`}
                >
                    <p className="text-sm font-medium text-gray-500">Stock Bajo (≤5)</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.lowStock}</p>
                </button>

                <button
                    onClick={() => setFilter('out')}
                    className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all hover:shadow-md ${filter === 'out' ? 'ring-2 ring-red-500' : 'border-gray-200'}`}
                >
                    <p className="text-sm font-medium text-gray-500">Agotados</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
                </button>
            </div>

            {/* Búsqueda */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar productos por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Tabla de productos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500">Cargando inventario...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 font-medium text-gray-500">Producto</th>
                                    <th className="p-4 font-medium text-gray-500">Categoría</th>
                                    <th className="p-4 font-medium text-gray-500">Precio</th>
                                    <th className="p-4 font-medium text-gray-500 text-center">Stock</th>
                                    <th className="p-4 font-medium text-gray-500">Estado</th>
                                    <th className="p-4 font-medium text-gray-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500">
                                            No hay productos que coincidan con los filtros
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                        <p className="text-xs text-gray-500">ID: {product.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {product.categories?.name || '—'}
                                            </td>
                                            <td className="p-4 font-medium text-gray-900">
                                                ${product.price.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-2xl font-bold ${product.stock === 0 ? 'text-red-600' :
                                                    product.stock <= 5 ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {getStockBadge(product.stock)}
                                            </td>
                                            <td className="p-4">
                                                <Link
                                                    href={`/admin/stock/${product.id}`}
                                                    className="text-sm font-medium text-black hover:underline"
                                                >
                                                    Ver detalles →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
