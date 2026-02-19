'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';

type Stats = {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    pendingOrders: number;
};

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createSupabaseClient();

    const [stats, setStats] = useState<Stats>({
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        pendingOrders: 0,
    });
    const [recentProducts, setRecentProducts] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);

            // Obtener productos
            const { data: products } = await supabase
                .from('products')
                .select('id, name, price, stock, active, image_url, created_at')
                .order('created_at', { ascending: false });

            // Obtener órdenes
            const { data: orders } = await supabase
                .from('orders')
                .select('id, created_at, status, total_amount, shipping_name')
                .order('created_at', { ascending: false });

            setStats({
                totalProducts: products?.length || 0,
                activeProducts: products?.filter(p => p.active).length || 0,
                lowStockProducts: products?.filter(p => p.stock <= 5).length || 0,
                pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
            });

            if (products) setRecentProducts(products.slice(0, 5));
            if (orders) setRecentOrders(orders.slice(0, 5));

            setLoading(false);
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    if (!authLoading && (!user || user.role !== 'admin')) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-red-900 mb-2">Acceso Denegado</h1>
                    <p className="text-red-700 mb-6">
                        No tienes permisos para ver esta página.
                    </p>

                    <div className="bg-white p-4 rounded-lg text-left text-sm font-mono overflow-auto border border-red-100 mb-6">
                        <p className="font-bold text-gray-700 mb-2">Debug Info:</p>
                        <p>User ID: {user?.id || 'No user'}</p>
                        <p>Role: {user?.role || 'No role'}</p>
                        <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors w-full sm:w-auto"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    if (authLoading) {
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
                <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-gray-500 mt-1">Bienvenido</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pedidos Pendientes</p>
                            <p className="text-3xl font-bold text-orange-600 mt-1">
                                {loading ? '—' : stats.pendingOrders}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Productos</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {loading ? '—' : stats.totalProducts}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Productos Activos</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">
                                {loading ? '—' : stats.activeProducts}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <Link href="/admin/stock?filter=low" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer block">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Stock Bajo (≤5)</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">
                                {loading ? '—' : stats.lowStockProducts}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Últimos Pedidos</h2>
                        <Link href="/admin/orders" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
                            Ver todos →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="py-8 text-center">
                            <div className="inline-block w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                            <p>No hay pedidos aún</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/admin/orders/${order.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-gray-500">{order.shipping_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">${order.total_amount.toLocaleString()}</p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {order.status === 'pending' ? 'Pendiente' :
                                                order.status === 'confirmed' ? 'Confirmado' :
                                                    order.status === 'delivered' ? 'Entregado' : order.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Productos Recientes</h2>
                        <Link href="/admin/products" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
                            Ver todos →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="py-8 text-center">
                            <div className="inline-block w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                        </div>
                    ) : recentProducts.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                            <p>No hay productos aún</p>
                            <Link href="/admin/products/new" className="text-black font-medium hover:underline">
                                Crear el primero →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/admin/products/${product.id}`}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                >
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
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                        <p className="text-sm text-gray-500">${product.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {product.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
