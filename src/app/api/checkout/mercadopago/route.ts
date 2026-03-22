import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
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
        const { items, userData, shippingData } = body;

        // Validar datos
        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'El carrito está vacío' },
                { status: 400 }
            );
        }

        if (!userData?.userId) {
            return NextResponse.json(
                { error: 'Usuario no autenticado' },
                { status: 401 }
            );
        }

        // Calcular total
        const totalAmount = items.reduce(
            (acc: number, item: any) => acc + item.price * item.quantity,
            0
        );

        console.log('💰 Total calculado:', totalAmount);

        // 1. VERIFICAR STOCK
        console.log('🔍 Verificando stock...');
        const stockChecks = await Promise.all(
            items.map((item: any) =>
                supabase
                    .from('products')
                    .select('id, name, stock')
                    .eq('id', item.id)
                    .single()
            )
        );

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
                    requested: requestedQty,
                });
            }
        });

        if (outOfStockItems.length > 0) {
            return NextResponse.json(
                {
                    error: 'Stock insuficiente',
                    details: outOfStockItems,
                },
                { status: 400 }
            );
        }

        console.log('✅ Stock verificado correctamente');

        // 2. CREAR ORDEN EN SUPABASE (estado pending)
        console.log('📦 Creando orden...');
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userData.userId,
                total_amount: totalAmount,
                status: 'pending',
                shipping_name: shippingData?.name || '',
                shipping_address: shippingData?.address || '',
                shipping_phone: shippingData?.phone || '',
                notes: shippingData?.notes || '',
            })
            .select()
            .single();

        if (orderError) {
            console.error('❌ Error creando orden:', orderError);
            throw orderError;
        }

        console.log('✅ Orden creada con ID:', order.id);

        // 3. CREAR ITEMS DE LA ORDEN
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('❌ Error creando order items:', itemsError);
            throw itemsError;
        }

        console.log('✅ Items de orden creados');

        // 4. CREAR PREFERENCIA DE MERCADOPAGO
        console.log('💳 Creando preferencia de MercadoPago...');

        const preference = new Preference(client);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const preferenceData = {
            items: items.map((item: any) => ({
                id: item.id,
                title: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                currency_id: 'ARS', // Cambiar según tu país
            })),
            back_urls: {
                success: `${baseUrl}/checkout/success`,
                failure: `${baseUrl}/checkout/failure`,
                pending: `${baseUrl}/checkout/pending`,
            },
            // auto_return: 'all' as const, // Desactivado temporalmente para evitar error con localhost
            external_reference: order.id, // ID de la orden para tracking

            // Webhook URL dinámica (funciona tanto en local como en Vercel)
            notification_url: `${baseUrl}/api/webhooks/mercadopago`,

            payer: {
                name: shippingData?.name || 'Test User',
                email: 'test_user_7972565967529607437@testuser.com', // Email del usuario de prueba comprador
                // Quitamos el teléfono para evitar errores de formato
            },
            statement_descriptor: 'TU_TIENDA', // Nombre que aparece en la tarjeta
            metadata: {
                order_id: order.id,
                user_id: userData.userId,
            },
        };

        console.log('📋 Datos de preferencia:', JSON.stringify(preferenceData, null, 2));

        const response = await preference.create({ body: preferenceData });

        console.log('✅ Preferencia creada:', response.id);
        console.log('🔗 init_point:', response.init_point);
        console.log('🧪 sandbox_init_point:', response.sandbox_init_point);
        console.log('📦 Respuesta completa:', JSON.stringify(response, null, 2));

        // Modo SANDBOX (test): usar sandbox_init_point para no cobrar dinero real
        // Para pasar a producción real: cambiar a init_point y usar ACCESS TOKEN de producción
        const isSandbox = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-');

        return NextResponse.json({
            success: true,
            orderId: order.id,
            preferenceId: response.id,
            initPoint: response.init_point,
            sandboxInitPoint: response.sandbox_init_point,
            // Le dice al frontend qué URL usar
            isSandbox,
        });
    } catch (error: any) {
        console.error('❌ Error en /api/checkout/mercadopago:', error);
        return NextResponse.json(
            {
                error: 'Error al procesar el pago',
                details: error.message,
            },
            { status: 500 }
        );
    }
}
