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
        console.log('📬 Webhook recibido de MercadoPago:', JSON.stringify(body, null, 2));

        // MercadoPago envía diferentes tipos de notificaciones
        // Nos interesa principalmente el tipo "payment"
        const { type, data } = body;

        if (type !== 'payment') {
            console.log('ℹ️ Notificación ignorada, no es de tipo payment');
            return NextResponse.json({ received: true });
        }

        const paymentId = data?.id;

        if (!paymentId) {
            console.error('❌ No se recibió ID de pago');
            return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
        }

        // 1. CONSULTAR EL ESTADO DEL PAGO EN MERCADOPAGO
        console.log(`🔍 Consultando estado del pago ${paymentId}...`);

        const payment = new Payment(client);
        const paymentData = await payment.get({ id: paymentId });

        console.log('💳 Estado del pago:', paymentData.status);
        console.log('📦 Referencia externa (Order ID):', paymentData.external_reference);

        const orderId = paymentData.external_reference;

        if (!orderId) {
            console.error('❌ No se encontró external_reference (order_id)');
            return NextResponse.json({ error: 'Missing order reference' }, { status: 400 });
        }

        // 2. VALIDAR EL MONTO
        // Obtener la orden de la base de datos
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('total_amount, status')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            console.error('❌ Error obteniendo orden:', orderError);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Validar que el monto pagado coincida con el total de la orden
        const totalPaid = paymentData.transaction_amount || 0;
        const expectedTotal = orderData.total_amount;

        if (Math.abs(totalPaid - expectedTotal) > 0.01) {
            console.error(
                `⚠️ Monto no coincide! Pagado: ${totalPaid}, Esperado: ${expectedTotal}`
            );
            // Aquí podrías enviar una alerta o registrar el fraude
        }

        // 3. ACTUALIZAR ESTADO DE LA ORDEN SEGÚN EL ESTADO DEL PAGO
        let newOrderStatus: string | null = null;

        switch (paymentData.status) {
            case 'approved':
                console.log('✅ Pago aprobado - actualizando orden a "paid"');
                newOrderStatus = 'paid';
                break;

            case 'in_process':
            case 'pending':
                console.log('⏳ Pago pendiente - manteniendo orden en "pending"');
                newOrderStatus = 'pending';
                break;

            case 'rejected':
            case 'cancelled':
                console.log('❌ Pago rechazado/cancelado - actualizando orden a "cancelled"');
                newOrderStatus = 'cancelled';
                break;

            default:
                console.log(`ℹ️ Estado desconocido: ${paymentData.status}`);
        }

        if (newOrderStatus && orderData.status !== newOrderStatus) {
            // Si el pago fue aprobado y la orden aún no está confirmada
            if (newOrderStatus === 'paid') {
                // Usar update directo en lugar de RPC para evitar restricción de auth.uid()
                // El cambio a 'confirmed' disparará el trigger handle_order_stock_decrease automáticamente
                console.log('🔄 Confirmando orden y descontando stock (via update)...');

                const { error: confirmError } = await supabase
                    .from('orders')
                    .update({ status: 'confirmed' })
                    .eq('id', orderId);

                if (confirmError) {
                    console.error('❌ Error confirmando orden:', confirmError);
                    throw confirmError;
                }

                console.log('🎉 ¡Orden confirmada y trigger de stock activado!');
            } else {
                // Para otros estados, solo actualizar el status
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({ status: newOrderStatus })
                    .eq('id', orderId);

                if (updateError) {
                    console.error('❌ Error actualizando orden:', updateError);
                    throw updateError;
                }

                console.log(`📝 Orden actualizada a estado: ${newOrderStatus}`);
            }
        }

        // 4. REGISTRAR INFORMACIÓN DEL PAGO (OPCIONAL)
        // Podrías crear una tabla "payments" para guardar el historial
        console.log('💾 Guardando información del pago...');

        const { error: paymentInsertError } = await supabase.from('payments').insert({
            order_id: orderId,
            mercadopago_payment_id: paymentId.toString(),
            status: paymentData.status,
            status_detail: paymentData.status_detail,
            payment_type: paymentData.payment_type_id,
            payment_method: paymentData.payment_method_id,
            transaction_amount: totalPaid,
            currency: paymentData.currency_id,
            payer_email: paymentData.payer?.email,
            raw_data: paymentData,
        });

        if (paymentInsertError) {
            // No lanzar error, solo logear (no es crítico si esta tabla no existe)
            console.warn('⚠️ No se pudo guardar el registro de pago:', paymentInsertError);
        } else {
            console.log('✅ Información del pago guardada');
        }

        return NextResponse.json({
            received: true,
            orderId,
            status: newOrderStatus
        });

    } catch (error: any) {
        console.error('❌ Error procesando webhook:', error);
        return NextResponse.json(
            {
                error: 'Error processing webhook',
                details: error.message,
            },
            { status: 500 }
        );
    }
}

// Método GET para verificar que el webhook está activo
export async function GET() {
    return NextResponse.json({
        status: 'active',
        message: 'MercadoPago Webhook Endpoint'
    });
}
