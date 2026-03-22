import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// Cliente Supabase (usando service key para operaciones del servidor)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { payment_id, external_reference } = body;

        if (!payment_id || !external_reference) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        console.log(`🔍 Verificando manualmente pago ${payment_id} para orden ${external_reference}...`);

        // 1. Obtener pago desde MercadoPago
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: payment_id });

        console.log(`💳 Estado del pago en MercadoPago: ${paymentData.status}`);

        // 2. Obtener la orden de la base de datos
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('status, id')
            .eq('id', external_reference)
            .single();

        if (orderError || !orderData) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 3. Si el pago fue aprobado pero la orden sigue pendiente, actualizamos!
        if (paymentData.status === 'approved' && orderData.status !== 'confirmed' && orderData.status !== 'paid') {
            console.log('✅ Pago verificado como aprobado, confirmando orden y descontando stock (via update)...');

            const { error: confirmError } = await supabase
                .from('orders')
                .update({ status: 'confirmed' })
                .eq('id', external_reference);

            if (confirmError) {
                console.error('❌ Error confirmando orden manualmente:', confirmError);
                throw confirmError;
            }

            console.log('🎉 ¡Orden confirmada manualmente correctamente!');

            return NextResponse.json({ success: true, status: 'confirmed' });
        }

        return NextResponse.json({
            success: true,
            status: orderData.status,
            payment_status: paymentData.status
        });

    } catch (error: any) {
        console.error('❌ Error verificando pago manualmente:', error);
        return NextResponse.json(
            { error: 'Error verifying payment', details: error.message },
            { status: 500 }
        );
    }
}
