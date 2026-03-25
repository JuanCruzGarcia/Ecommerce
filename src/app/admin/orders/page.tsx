'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

type Order = {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    payment_method: 'mercadopago' | 'transferencia' | 'efectivo' | null;
    payment_status: 'pending' | 'paid';
    shipping_name: string;
    user: {
        email: string;
    };
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
};

const paymentMethodInfo: Record<string, { label: string; icon: string }> = {
    transferencia: { label: 'Transferencia', icon: '🏦' },
    efectivo:      { label: 'Efectivo',       icon: '💵' },
    mercadopago:   { label: 'MercadoPago',    icon: '💳' },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseClient();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setOrders(data as any);
            setLoading(false);
        };

        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Pedidos</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 font-medium text-gray-500">ID Pedido</th>
                                <th className="p-4 font-medium text-gray-500">Cliente</th>
                                <th className="p-4 font-medium text-gray-500">Fecha</th>
                                <th className="p-4 font-medium text-gray-500">Estado</th>
                                <th className="p-4 font-medium text-gray-500">Pago</th>
                                <th className="p-4 font-medium text-gray-500 text-right">Total</th>
                                <th className="p-4 font-medium text-gray-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-sm text-gray-600">
                                        #{order.id.slice(0, 8)}
                                    </td>
                                    <td className="p-4">
                                        <p className="font-medium text-gray-900">{order.shipping_name}</p>
                                        <p className="text-sm text-gray-500">{order.user?.email || 'Email no disponible'}</p>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                                            {statusLabels[order.status] || order.status}
                                        </span>
                                    </td>
                                    {/* Columna Pago */}
                                    <td className="p-4">
                                        {order.payment_method ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-gray-500">
                                                    {paymentMethodInfo[order.payment_method]?.icon}{' '}
                                                    {paymentMethodInfo[order.payment_method]?.label}
                                                </span>
                                                <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    order.payment_status === 'paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {order.payment_status === 'paid' ? '✅ Pagado' : '⏳ Sin cobrar'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 font-bold text-gray-900 text-right">
                                        ${order.total_amount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="text-sm font-medium text-black hover:underline"
                                        >
                                            Ver detalle
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500">
                                        No hay pedidos registrados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
