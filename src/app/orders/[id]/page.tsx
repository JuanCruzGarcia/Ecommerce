'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StoreHeader from '@/components/StoreHeader';

type OrderItem = {
    id: string;
    quantity: number;
    unit_price: number;
    products: {
        name: string;
        image_url: string | null;
    };
};

type OrderDetail = {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    shipping_name: string;
    shipping_address: string;
    shipping_phone: string;
    notes: string | null;
    items: OrderItem[];
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createSupabaseClient();

    // Unwrapping params using React.use() as per Next.js 15+ requirements
    const { id } = React.use(params);

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchOrderDetail();
        }
    }, [user, id]);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);

            // Fetch order and items with joins
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        quantity,
                        unit_price,
                        products (
                            name,
                            image_url
                        )
                    )
                `)
                .eq('id', id)
                .eq('user_id', user!.id) // Ensure user owns the order
                .single();

            if (error) throw error;

            if (data) {
                // Transform data structure to match OrderDetail type
                const formattedOrder: OrderDetail = {
                    ...data,
                    items: data.order_items.map((item: any) => ({
                        id: item.id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        products: item.products
                    }))
                };
                setOrder(formattedOrder);
            }
        } catch (error) {
            console.error('Error al cargar detalle de orden:', error);
            // If order not found or not authorized, redirect to list
            router.push('/orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending':
                return { label: 'Pendiente', color: 'text-yellow-700 bg-yellow-100', icon: '⏳' };
            case 'confirmed':
                return { label: 'Confirmado', color: 'text-green-700 bg-green-100', icon: '✅' };
            case 'shipped':
                return { label: 'Enviado', color: 'text-blue-700 bg-blue-100', icon: '🚚' };
            case 'cancelled':
                return { label: 'Cancelado', color: 'text-red-700 bg-red-100', icon: '❌' };
            default:
                return { label: status, color: 'text-gray-700 bg-gray-100', icon: '📄' };
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) return null;

    const statusInfo = getStatusInfo(order.status);

    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Link */}
                <div className="mb-6">
                    <Link href="/orders" className="text-sm font-medium text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver a Mis Pedidos
                    </Link>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header Details */}
                    <div className="p-6 md:p-8 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Detalle del Pedido</h1>
                                <p className="text-gray-500 text-sm mt-1 font-mono">#{order.id}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 self-start md:self-auto ${statusInfo.color}`}>
                                <span>{statusInfo.icon}</span>
                                {statusInfo.label}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div>
                                <p className="text-gray-500 font-medium mb-1">Fecha de compra</p>
                                <p className="text-gray-900">{new Date(order.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 font-medium mb-1">Total</p>
                                <p className="text-gray-900 font-bold text-lg">${order.total_amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 font-medium mb-1">Envío a</p>
                                <p className="text-gray-900 font-medium">{order.shipping_name}</p>
                                <p className="text-gray-600 truncate">{order.shipping_address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6 md:p-8 bg-gray-50/50">
                        <h2 className="font-bold text-gray-900 mb-4">Productos</h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.products.image_url ? (
                                            <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.products.name}</p>
                                        <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">${(item.unit_price * item.quantity).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">${item.unit_price.toLocaleString()} c/u</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support / Actions */}
                    <div className="p-6 md:p-8 bg-white border-t border-gray-100 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                            ¿Necesitas ayuda con este pedido?
                        </span>
                        <a href="mailto:soporte@ecommerce.com" className="text-sm font-medium text-black underline">
                            Contactar soporte
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
