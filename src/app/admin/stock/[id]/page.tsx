'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Product = {
    id: string;
    name: string;
    description: string | null;
    stock: number;
    price: number;
    active: boolean;
    image_url: string | null;
    updated_at: string;
};

type StockMovement = {
    id: string;
    quantity_change: number;
    previous_stock: number;
    new_stock: number;
    movement_type: string;
    notes: string | null;
    created_at: string;
    order_id: string | null;
};

const movementLabels: Record<string, string> = {
    sale: 'Venta',
    restock: 'Reabastecimiento',
    adjustment: 'Ajuste manual',
    return: 'Devolución',
};

export default function ProductStockDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createSupabaseClient();

    // Unwrapping params using React.use() as per Next.js 15+ requirements
    const { id } = React.use(params);

    const [product, setProduct] = useState<Product | null>(null);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [adjusting, setAdjusting] = useState(false);
    const [adjustmentQty, setAdjustmentQty] = useState('');
    const [adjustmentNotes, setAdjustmentNotes] = useState('');
    const [isPositive, setIsPositive] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, id]);

    const fetchData = async () => {
        setLoading(true);

        // Obtener producto
        const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (productData) {
            setProduct(productData);
        }

        // Obtener historial de movimientos
        const { data: movementsData, error: movementsError } = await supabase
            .from('stock_movements')
            .select('*')
            .eq('product_id', id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (movementsData) {
            setMovements(movementsData);
        }

        setLoading(false);
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || !user) return;

        setAdjusting(true);

        try {
            const qty = parseInt(adjustmentQty);
            if (isNaN(qty) || qty === 0) {
                alert('Por favor ingresa una cantidad válida');
                setAdjusting(false);
                return;
            }

            const finalQty = isPositive ? qty : -qty;

            // Usar la función de Supabase para aumentar/disminuir stock
            if (finalQty > 0) {
                // Aumentar stock
                const { error } = await supabase.rpc('increase_product_stock', {
                    p_product_id: product.id,
                    p_quantity: finalQty,
                    p_movement_type: 'adjustment',
                    p_notes: adjustmentNotes || null,
                    p_user_id: user.id,
                });

                if (error) throw error;
            } else {
                // Disminuir stock
                const { error } = await supabase.rpc('decrease_product_stock', {
                    p_product_id: product.id,
                    p_quantity: Math.abs(finalQty),
                    p_order_id: null,
                    p_user_id: user.id,
                });

                if (error) throw error;
            }

            alert(`Stock ajustado correctamente: ${finalQty > 0 ? '+' : ''}${finalQty} unidades`);
            setAdjustmentQty('');
            setAdjustmentNotes('');
            fetchData(); // Recargar datos
        } catch (error: any) {
            console.error('Error adjusting stock:', error);
            alert(`Error al ajustar stock: ${error.message}`);
        } finally {
            setAdjusting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
                <Link href="/admin/stock" className="text-black underline">← Volver al inventario</Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header con breadcrumb */}
            <div className="mb-8">
                <Link href="/admin/stock" className="text-sm text-gray-500 hover:text-black mb-2 inline-block">
                    ← Volver al inventario
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-gray-500 mt-1">Gestión de stock e historial de movimientos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Información del producto */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tarjeta de información */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold mb-4">Información del Producto</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Stock Actual</p>
                                <p className={`text-4xl font-bold mt-1 ${product.stock === 0 ? 'text-red-600' :
                                    product.stock <= 5 ? 'text-yellow-600' :
                                        'text-green-600'
                                    }`}>
                                    {product.stock}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Precio</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    ${product.price.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Estado</p>
                                <p className="mt-2">
                                    {product.active ? (
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                            Inactivo
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Última actualización</p>
                                <p className="text-sm text-gray-700 mt-1">
                                    {new Date(product.updated_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        {product.description && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-sm font-medium text-gray-500 mb-2">Descripción</p>
                                <p className="text-gray-700">{product.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Historial de movimientos */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold mb-4">Historial de Movimientos</h2>
                        {movements.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Sin movimientos registrados</p>
                        ) : (
                            <div className="space-y-3">
                                {movements.map((movement) => (
                                    <div
                                        key={movement.id}
                                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${movement.quantity_change > 0
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-red-100 text-red-600'
                                            }`}>
                                            {movement.quantity_change > 0 ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {movementLabels[movement.movement_type] || movement.movement_type}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        {new Date(movement.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {movement.previous_stock} → {movement.new_stock}
                                                    </p>
                                                </div>
                                            </div>
                                            {movement.notes && (
                                                <p className="text-sm text-gray-600 mt-2 italic">"{movement.notes}"</p>
                                            )}
                                            {movement.order_id && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Orden: {movement.order_id.slice(0, 8)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel de ajuste de stock */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                        <h2 className="text-xl font-bold mb-4">Ajustar Stock</h2>
                        <form onSubmit={handleAdjustStock} className="space-y-4">
                            {/* Tipo de ajuste */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de ajuste</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsPositive(true)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${isPositive
                                            ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        + Aumentar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsPositive(false)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${!isPositive
                                            ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        - Disminuir
                                    </button>
                                </div>
                            </div>

                            {/* Cantidad */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={adjustmentQty}
                                    onChange={(e) => setAdjustmentQty(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Ej: 10"
                                />
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={adjustmentNotes}
                                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-black outline-none resize-none"
                                    placeholder="Razón del ajuste..."
                                />
                            </div>

                            {/* Vista previa */}
                            {adjustmentQty && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                                    <p className="text-lg">
                                        Stock actual: <span className="font-bold">{product.stock}</span>
                                    </p>
                                    <p className="text-lg">
                                        Nuevo stock: <span className={`font-bold ${(product.stock + (isPositive ? 1 : -1) * parseInt(adjustmentQty || '0')) < 0
                                            ? 'text-red-600'
                                            : 'text-green-600'
                                            }`}>
                                            {product.stock + (isPositive ? 1 : -1) * parseInt(adjustmentQty || '0')}
                                        </span>
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={adjusting || !adjustmentQty}
                                className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {adjusting ? 'Procesando...' : 'Confirmar Ajuste'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
