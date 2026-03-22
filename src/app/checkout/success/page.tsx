'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StoreHeader from '@/components/StoreHeader';
import { CheckCircle, Package, Home } from 'lucide-react';

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const externalReference = searchParams.get('external_reference');

        console.log('✅ Pago exitoso recibido:', {
            paymentId,
            status,
            externalReference,
        });

        if (externalReference) {
            setOrderId(externalReference);
        }
    }, [searchParams]);

    return (
        <main className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                {/* Icon de éxito */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                {/* Título */}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    ¡Pago Exitoso! 🎉
                </h1>

                <p className="text-lg text-gray-600 mb-8">
                    Tu pago ha sido procesado correctamente.
                </p>

                {/* Información de la orden */}
                {orderId && (
                    <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Package className="w-5 h-5 text-gray-600" />
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Número de Orden
                            </h2>
                        </div>
                        <p className="text-2xl font-mono font-bold text-gray-900">
                            #{orderId.slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                )}

                {/* Información adicional */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <p className="text-sm text-blue-900 leading-relaxed">
                        <strong>¿Qué sigue?</strong>
                        <br />
                        Recibirás un email de confirmación con los detalles de tu pedido.
                        <br />
                        Tu pedido será procesado y enviado en las próximas 48-72 horas.
                    </p>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/orders"
                        className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                    >
                        Ver mis Pedidos
                    </Link>
                    <Link
                        href="/"
                        className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Volver a la Tienda
                    </Link>
                </div>

                {/* Nota de seguridad */}
                <p className="text-xs text-gray-500 mt-8">
                    Tu pago está siendo procesado por MercadoPago de forma segura.
                </p>
            </div>
        </main>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
            <StoreHeader />
            <Suspense fallback={
                <main className="max-w-2xl mx-auto px-4 py-12">
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" />
                        <div className="h-8 bg-gray-200 rounded w-48 mx-auto animate-pulse" />
                    </div>
                </main>
            }>
                <CheckoutSuccessContent />
            </Suspense>
        </div>
    );
}
