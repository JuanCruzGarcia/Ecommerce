'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import StoreHeader from '@/components/StoreHeader';
import Link from 'next/link';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createSupabaseClient();

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessingMercadoPago, setIsProcessingMercadoPago] = useState(false);
    const [stockError, setStockError] = useState<string | null>(null);
    const [offlinePaymentMethod, setOfflinePaymentMethod] = useState<'transferencia' | 'efectivo'>('transferencia');

    useEffect(() => {
        if (!authLoading && !user) {
            // Si no está logueado, redirigir a login
            router.push('/auth/login?redirect=/checkout');
        }
    }, [user, authLoading, router]);

    // Pre-fill email if user data available (optional)
    useEffect(() => {
        if (user) {
            // Could fetch profile data here to prefill
        }
    }, [user]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">El carrito está vacío</h1>
                <Link href="/" className="text-black underline">Volver a la tienda</Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStockError(null);

        try {
            // 1. VALIDAR STOCK ANTES DE CREAR LA ORDEN
            console.log('🔍 Verificando disponibilidad de stock...');

            const stockChecks = await Promise.all(
                items.map(item =>
                    supabase
                        .from('products')
                        .select('id, name, stock')
                        .eq('id', item.id)
                        .single()
                )
            );

            // Verificar si hay productos sin stock suficiente
            const outOfStockItems: { name: string; available: number; requested: number }[] = [];

            stockChecks.forEach((check, idx) => {
                if (check.error) {
                    console.error('Error verificando stock:', check.error);
                    throw new Error(`Error al verificar stock del producto`);
                }

                const currentStock = check.data?.stock || 0;
                const requestedQty = items[idx].quantity;

                if (currentStock < requestedQty) {
                    outOfStockItems.push({
                        name: check.data?.name || items[idx].name,
                        available: currentStock,
                        requested: requestedQty
                    });
                }
            });

            // Si hay productos sin stock, mostrar error detallado
            if (outOfStockItems.length > 0) {
                const errorMessage = outOfStockItems.map(item =>
                    `• ${item.name}: solicitaste ${item.requested} pero solo hay ${item.available} disponibles`
                ).join('\n');

                setStockError(
                    `❌ Stock insuficiente:\n\n${errorMessage}\n\nPor favor, ajusta las cantidades en tu carrito.`
                );

                console.error('Stock insuficiente:', outOfStockItems);
                return;
            }

            console.log('✅ Stock verificado correctamente');

            // 2. CREAR LA ORDEN (estado inicial pending)
            console.log('📦 Creando orden...');

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    total_amount: total,
                    status: 'pending', // 1. Primero pending
                    shipping_name: formData.name,
                    shipping_address: formData.address,
                    shipping_phone: formData.phone,
                    notes: formData.notes,
                    payment_method: offlinePaymentMethod,  // 'transferencia' | 'efectivo'
                    payment_status: 'pending',             // pendiente de cobro hasta que el admin confirme
                })
                .select()
                .single();

            if (orderError) {
                console.error('Error creando orden:', orderError);
                throw orderError;
            }

            console.log('✅ Orden creada (pending):', order.id);

            // 3. CREAR LOS ITEMS DE LA ORDEN
            console.log('📝 Registrando items de la orden...');

            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price,
                variant_id: item.variantId || null,
                attributes: item.attributes || null
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('Error creando order items:', itemsError);
                // Aquí idealmente revertiríamos la orden o mostraríamos error
                throw itemsError;
            }

            console.log('✅ Items registrados correctamente');

            // 4. CONFIRMAR LA ORDEN (Usando función segura para activar trigger)
            console.log('⚡ Confirmando orden para descontar stock...');

            const { error: confirmError } = await supabase
                .rpc('confirm_order', {
                    p_order_id: order.id
                });

            if (confirmError) {
                console.error('Error confirmando orden:', confirmError);
                throw confirmError;
            }

            console.log('🎉 ¡Orden completada! El stock se ha descontado automáticamente.');

            // 5. LIMPIAR CARRITO Y REDIRIGIR
            clearCart();
            const paymentMethodLabel = offlinePaymentMethod === 'transferencia' ? 'transferencia bancaria' : 'efectivo';
            alert(`¡Pedido confirmado! Gracias por tu compra.\n\nMétodo de pago: ${paymentMethodLabel}\nUn administrador verificará tu pago y actualizará el estado del pedido.`);
            router.push('/');

        } catch (error: any) {
            console.error('❌ Error procesando orden:', error);

            // Mensajes de error más específicos
            let errorMessage = 'Hubo un error al procesar tu pedido.';

            if (error.message?.includes('Stock insuficiente')) {
                errorMessage = 'No hay stock suficiente para completar tu pedido. Por favor, revisa tu carrito.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            setStockError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Función para manejar el pago con MercadoPago
    const handleMercadoPago = async () => {
        // Validar que los campos requeridos estén llenos
        if (!formData.name || !formData.address) {
            alert('Por favor completa tu nombre y dirección antes de continuar.');
            return;
        }

        setIsProcessingMercadoPago(true);
        setStockError(null);

        try {
            console.log('💳 Iniciando pago con MercadoPago...');

            // Obtener el email del usuario de Supabase auth
            const { data: { user: authUser } } = await supabase.auth.getUser();

            // Llamar a la API para crear la preferencia
            const response = await fetch('/api/checkout/mercadopago', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: items.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    })),
                    userData: {
                        userId: user.id,
                        email: authUser?.email || '',
                    },
                    shippingData: formData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al crear la preferencia de pago');
            }

            console.log('✅ Preferencia creada:', data.preferenceId);

            // El backend detecta automáticamente si es modo TEST o Producción
            // y nos dice cuál URL usar mediante la bandera `isSandbox`
            const paymentUrl = data.isSandbox
                ? data.sandboxInitPoint  // Credenciales TEST-xxx → sandbox (sin cobro real)
                : data.initPoint;        // Credenciales APP_USR-xxx → producción real

            if (!paymentUrl) {
                throw new Error('No se recibió URL de pago');
            }

            console.log('🔄 Redirigiendo a MercadoPago...');

            // Limpiar el carrito antes de redirigir
            clearCart();

            // Redirigir al usuario a MercadoPago
            window.location.href = paymentUrl;

        } catch (error: any) {
            console.error('❌ Error procesando pago con MercadoPago:', error);
            setStockError(error.message || 'Error al procesar el pago con MercadoPago');
            setIsProcessingMercadoPago(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <main className="max-w-7xl mx-auto px-4 pt-28 pb-12 sm:pt-32">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Formulario de envío */}
                    <div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold mb-6">Datos de Envío</h2>

                            {/* Alerta de error de stock */}
                            {stockError && (
                                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-red-800 mb-1">Error al procesar el pedido</h3>
                                            <p className="text-sm text-red-700 whitespace-pre-line">{stockError}</p>
                                            <Link
                                                href="/cart"
                                                className="inline-block mt-3 text-sm font-medium text-red-600 hover:text-red-700 underline"
                                            >
                                                ← Volver al carrito para ajustar cantidades
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Entrega *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Calle 123, Ciudad"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
                                    <input
                                        type="tel"
                                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+54 9 11..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas del Pedido</label>
                                    <textarea
                                        rows={3}
                                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none resize-none"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Instrucciones especiales para el envío..."
                                    />
                                </div>

                                {/* Divisor visual */}
                                <div className="border-t border-gray-200 my-6"></div>

                                {/* Título de métodos de pago */}
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Método de Pago</h3>

                                {/* Botón de MercadoPago (primario) */}
                                <button
                                    type="button"
                                    onClick={handleMercadoPago}
                                    disabled={isProcessingMercadoPago || !formData.name || !formData.address}
                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-3"
                                >
                                    {isProcessingMercadoPago ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L8.544 13.48l-2.893-.902c-.63-.196-.64-.63.135-.93l11.292-4.35c.528-.196.99.12.817.923z" />
                                            </svg>
                                            Pagar con MercadoPago
                                        </>
                                    )}
                                </button>

                                {/* Divisor "O" */}
                                <div className="flex items-center gap-3 my-4">
                                    <div className="flex-1 border-t border-gray-300"></div>
                                    <span className="text-sm text-gray-500 font-medium">o</span>
                                    <div className="flex-1 border-t border-gray-300"></div>
                                </div>

                                {/* Selector de método de pago offline */}
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Método de pago offline:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Opción: Transferencia */}
                                        <label
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${offlinePaymentMethod === 'transferencia'
                                                    ? 'border-gray-900 bg-white shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="offlinePaymentMethod"
                                                value="transferencia"
                                                checked={offlinePaymentMethod === 'transferencia'}
                                                onChange={() => setOfflinePaymentMethod('transferencia')}
                                                className="sr-only"
                                            />
                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${offlinePaymentMethod === 'transferencia' ? 'border-gray-900' : 'border-gray-300'
                                                }`}>
                                                {offlinePaymentMethod === 'transferencia' && (
                                                    <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-xl">🏦</span>
                                                <p className="text-sm font-medium text-gray-800 leading-tight">Transferencia</p>
                                            </div>
                                        </label>

                                        {/* Opción: Efectivo */}
                                        <label
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${offlinePaymentMethod === 'efectivo'
                                                    ? 'border-gray-900 bg-white shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="offlinePaymentMethod"
                                                value="efectivo"
                                                checked={offlinePaymentMethod === 'efectivo'}
                                                onChange={() => setOfflinePaymentMethod('efectivo')}
                                                className="sr-only"
                                            />
                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${offlinePaymentMethod === 'efectivo' ? 'border-gray-900' : 'border-gray-300'
                                                }`}>
                                                {offlinePaymentMethod === 'efectivo' && (
                                                    <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-xl">💵</span>
                                                <p className="text-sm font-medium text-gray-800 leading-tight">Efectivo</p>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Nota según método elegido */}
                                    {offlinePaymentMethod === 'transferencia' ? (
                                        <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
                                            <span>ℹ️</span>
                                            <span>Nos pondremos en contacto y te enviaremos los datos para realizar la transferencia.</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
                                            <span>ℹ️</span>
                                            <span>Coordiná el pago en efectivo al momento de la entrega o retiro del pedido.</span>
                                        </p>
                                    )}
                                </div>

                                {/* Botón de pago offline (secundario) */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gray-800 text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-900 transition-colors shadow-lg disabled:opacity-50 mt-1"
                                >
                                    {isSubmitting
                                        ? 'Procesando...'
                                        : `Confirmar Pedido — ${offlinePaymentMethod === 'transferencia' ? 'Transferencia' : 'Efectivo'}`
                                    }
                                </button>

                                {/* Nota informativa MercadoPago */}
                                <p className="text-xs text-gray-500 text-center mt-3">
                                    💡 Con MercadoPago puedes pagar con tarjeta, transferencia o efectivo
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* Resumen de orden */}
                    <div>
                        <div className="bg-gray-100 rounded-xl p-6 sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Resumen de la Orden</h2>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-16 h-16 bg-white rounded border overflow-hidden flex-shrink-0">
                                            {item.image_url && (
                                                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium line-clamp-2">{item.name}</p>
                                            <p className="text-sm text-gray-500">Cant: {item.quantity}</p>
                                        </div>
                                        <p className="font-medium">${(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Envío</span>
                                    <span className="text-green-600">Gratis</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl text-gray-900 pt-2 border-t border-gray-200 mt-2">
                                    <span>Total a Pagar</span>
                                    <span>${total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
