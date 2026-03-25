'use client';

import { useState, useEffect, use } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type OrderItem = {
    id: string;
    quantity: number;
    unit_price: number;
    product: {
        name: string;
        image_url: string;
    };
};

type Order = {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    payment_method: 'mercadopago' | 'transferencia' | 'efectivo' | null;
    payment_status: 'pending' | 'paid';
    shipping_name: string;
    shipping_address: string;
    shipping_phone: string;
    notes: string;
    user: {
        email: string;
    };
    items: OrderItem[];
};

const statusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' },
];

const paymentStatusOptions = [
    { value: 'pending', label: 'Sin cobrar', icon: '⏳' },
    { value: 'paid',    label: 'Pagado',     icon: '✅' },
];

const paymentMethodLabels: Record<string, { label: string; icon: string }> = {
    transferencia: { label: 'Transferencia bancaria', icon: '🏦' },
    efectivo:      { label: 'Efectivo',               icon: '💵' },
    mercadopago:   { label: 'MercadoPago',            icon: '💳' },
};


export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const supabase = createSupabaseClient();
    const router = useRouter();

    useEffect(() => {
        const fetchOrder = async () => {
            // First fetch order
            const { data: orderData, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }

            // Then fetch items
            const { data: itemsData } = await supabase
                .from('order_items')
                .select('*, product:product_id(name, image_url)')
                .eq('order_id', id);

            setOrder({ ...orderData, items: itemsData } as any);
            setLoading(false);
        };

        fetchOrder();
    }, [id]);

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating status:', error);
            alert(`Error al actualizar estado: ${error.message}`);
        } else {
            setOrder((prev) => prev ? { ...prev, status: newStatus } : null);
        }
        setUpdating(false);
    };

    const updatePaymentStatus = async (newPaymentStatus: 'pending' | 'paid') => {
        setUpdating(true);
        const { error } = await supabase
            .from('orders')
            .update({ payment_status: newPaymentStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating payment status:', error);
            alert(`Error al actualizar estado de pago: ${error.message}`);
        } else {
            setOrder((prev) => prev ? { ...prev, payment_status: newPaymentStatus } : null);
        }
        setUpdating(false);
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;
    if (!order) return <div className="p-8 text-center">Pedido no encontrado</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/orders" className="text-gray-500 hover:text-black">
                    ← Volver
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.id.slice(0, 8)}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Items y Detalles */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="font-semibold text-gray-900">Productos ({order.items.length})</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-4 flex gap-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
                                        {item.product?.image_url && (
                                            <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.product?.name || 'Producto eliminado'}</p>
                                        <p className="text-sm text-gray-500">
                                            {item.quantity} x ${item.unit_price.toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="font-medium text-gray-900">
                                        ${(item.quantity * item.unit_price).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <span className="font-medium text-gray-600">Total Pedido</span>
                            <span className="text-xl font-bold text-gray-900">${order.total_amount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Envío */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-900 mb-4">Información de Envío</h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <dt className="text-sm text-gray-500">Nombre</dt>
                                <dd className="font-medium text-gray-900">{order.shipping_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Email (Cuenta)</dt>
                                <dd className="font-medium text-gray-900">{order.user?.email || 'Email no disponible'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Teléfono</dt>
                                <dd className="font-medium text-gray-900">{order.shipping_phone || '-'}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-gray-500">Dirección</dt>
                                <dd className="font-medium text-gray-900">{order.shipping_address}</dd>
                            </div>
                            {order.notes && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm text-gray-500">Notas</dt>
                                    <dd className="font-medium text-gray-900 bg-yellow-50 p-2 rounded border border-yellow-100 mt-1">
                                        "{order.notes}"
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Columna Derecha: Acciones */}
                <div className="space-y-6">

                    {/* Estado del Pedido */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-900 mb-4">Estado del Pedido</h2>
                        <div className="space-y-3">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => updateStatus(option.value)}
                                    disabled={updating}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex justify-between items-center ${
                                        order.status === option.value
                                            ? 'border-black bg-gray-900 text-white shadow-md'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <span className="font-medium">{option.label}</span>
                                    {order.status === option.value && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estado de Pago — solo para pedidos offline */}
                    {(order.payment_method === 'transferencia' || order.payment_method === 'efectivo') && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-1">Estado de Pago</h2>

                            {/* Método de pago */}
                            {order.payment_method && (
                                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                    <span>{paymentMethodLabels[order.payment_method]?.icon}</span>
                                    <span>{paymentMethodLabels[order.payment_method]?.label}</span>
                                </p>
                            )}

                            <div className="space-y-3">
                                {paymentStatusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => updatePaymentStatus(option.value as 'pending' | 'paid')}
                                        disabled={updating}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex justify-between items-center ${
                                            order.payment_status === option.value
                                                ? 'border-black bg-gray-900 text-white shadow-md'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span className="font-medium flex items-center gap-2">
                                            <span>{option.icon}</span>
                                            <span>{option.label}</span>
                                        </span>
                                        {order.payment_status === option.value && (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pago MercadoPago — solo informativo */}
                    {order.payment_method === 'mercadopago' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-1">Estado de Pago</h2>
                            <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                                <span>💳</span><span>MercadoPago</span>
                            </p>
                            <div className={`px-4 py-3 rounded-lg border flex items-center gap-2 ${
                                order.payment_status === 'paid'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-yellow-200 bg-yellow-50 text-yellow-800'
                            }`}>
                                <span>{order.payment_status === 'paid' ? '✅' : '⏳'}</span>
                                <span className="font-medium text-sm">
                                    {order.payment_status === 'paid' ? 'Pago confirmado por MP' : 'Pendiente de confirmación MP'}
                                </span>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
