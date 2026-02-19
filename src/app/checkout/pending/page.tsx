'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StoreHeader from '@/components/StoreHeader';
import { Clock, Package, Home, RefreshCcw } from 'lucide-react';

export default function CheckoutPendingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const externalReference = searchParams.get('external_reference');

        console.log('⏳ Pago pendiente:', {
            paymentId,
            status,
            externalReference,
        });

        if (externalReference) {
            setOrderId(externalReference);
        }
    }, [searchParams]);

    const getPendingMessage = () => {
        const statusDetail = searchParams.get('status_detail');

        switch (statusDetail) {
            case 'pending_contingency':
                return 'Estamos procesando tu pago. Te notificaremos por email cuando se confirme.';
            case 'pending_review_manual':
                return 'Tu pago está siendo revisado. Te confirmaremos en menos de 2 días hábiles.';
            default:
                return 'Tu pago está siendo procesado. Te notificaremos cuando sea acreditado.';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
            <StoreHeader />

            <main className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                    {/* Icon de pendiente */}
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-12 h-12 text-yellow-600 animate-pulse" />
                    </div>

                    {/* Título */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Pago Pendiente ⏳
                    </h1>

                    <p className="text-lg text-gray-600 mb-8">
                        {getPendingMessage()}
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

                    {/* Información según método de pago */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                        <p className="text-sm text-blue-900 leading-relaxed">
                            <strong>Métodos de pago que requieren aprobación:</strong>
                            <br />
                            • <strong>Transferencia bancaria:</strong> Puede tardar 1-3 días hábiles
                            <br />
                            • <strong>Efectivo:</strong> Paga en puntos autorizados (Rapipago, Pago Fácil)
                            <br />
                            • <strong>Tarjetas:</strong> Algunos pagos requieren verificación adicional
                        </p>
                    </div>

                    {/* Timeline */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                        <h3 className="font-semibold text-gray-900 mb-4">¿Qué sigue?</h3>
                        <div className="space-y-3 text-left max-w-md mx-auto">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">1</span>
                                </div>
                                <p className="text-sm text-gray-700">
                                    Completa el pago según las instrucciones de MercadoPago
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">2</span>
                                </div>
                                <p className="text-sm text-gray-700">
                                    Recibirás un email de confirmación cuando se acredite
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">3</span>
                                </div>
                                <p className="text-sm text-gray-700">
                                    Procesaremos y enviaremos tu pedido
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/orders"
                            className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            Ver Estado del Pedido
                        </Link>
                        <Link
                            href="/"
                            className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Volver a la Tienda
                        </Link>
                    </div>

                    {/* Nota de ayuda */}
                    <p className="text-xs text-gray-500 mt-8">
                        Puedes revisar el estado de tu pago en{' '}
                        <a
                            href="https://www.mercadopago.com.ar/activities"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            MercadoPago
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}
