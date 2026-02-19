'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StoreHeader from '@/components/StoreHeader';
import { XCircle, AlertTriangle, Home, RefreshCcw } from 'lucide-react';

export default function CheckoutFailurePage() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const statusDetail = searchParams.get('status_detail');

        console.log('❌ Pago fallido:', {
            paymentId,
            status,
            statusDetail,
        });
    }, [searchParams]);

    const getErrorMessage = () => {
        const statusDetail = searchParams.get('status_detail');

        switch (statusDetail) {
            case 'cc_rejected_insufficient_amount':
                return 'Fondos insuficientes en la tarjeta';
            case 'cc_rejected_bad_filled_security_code':
                return 'Código de seguridad incorrecto';
            case 'cc_rejected_bad_filled_date':
                return 'Fecha de vencimiento incorrecta';
            case 'cc_rejected_bad_filled_other':
                return 'Revisa los datos de tu tarjeta';
            case 'cc_rejected_blacklist':
                return 'La tarjeta no puede ser procesada';
            case 'cc_rejected_call_for_authorize':
                return 'Debes autorizar el pago con tu banco';
            case 'cc_rejected_card_disabled':
                return 'La tarjeta está deshabilitada';
            case 'cc_rejected_duplicated_payment':
                return 'Ya existe un pago con estos datos';
            case 'cc_rejected_high_risk':
                return 'El pago fue rechazado por alto riesgo';
            default:
                return 'El pago no pudo ser procesado';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <StoreHeader />

            <main className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                    {/* Icon de error */}
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>

                    {/* Título */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Pago Rechazado
                    </h1>

                    <p className="text-lg text-gray-600 mb-8">
                        {getErrorMessage()}
                    </p>

                    {/* Información adicional */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                            <p className="text-sm text-yellow-900 leading-relaxed">
                                <strong className="block mb-2">¿Qué puedes hacer?</strong>
                                • Verifica que los datos de tu tarjeta sean correctos
                                <br />
                                • Asegúrate de tener fondos suficientes
                                <br />
                                • Intenta con otro método de pago
                                <br />
                                • Contacta a tu banco si el problema persiste
                            </p>
                        </div>
                    </div>

                    {/* Nota importante */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
                        <p className="text-sm text-blue-900">
                            <strong>No te preocupes:</strong> No se realizó ningún cargo a tu tarjeta.
                            <br />
                            Tu carrito sigue guardado y puedes intentar nuevamente.
                        </p>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/checkout"
                            className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            Intentar Nuevamente
                        </Link>
                        <Link
                            href="/"
                            className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Volver a la Tienda
                        </Link>
                    </div>

                    {/* Ayuda */}
                    <p className="text-sm text-gray-500 mt-8">
                        ¿Necesitas ayuda?{' '}
                        <Link href="/contacto" className="text-blue-600 hover:underline">
                            Contáctanos
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
