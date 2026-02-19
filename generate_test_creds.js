const { MercadoPagoConfig, Customer } = require('mercadopago');

// Tu Token actual (que permite crear usuarios de prueba)
const client = new MercadoPagoConfig({
    accessToken: 'APP_USR-3540179556431722-020219-01bb0f620c129ecf59adc91fef97c2a1-3176385649'
});

async function createTestUsers() {
    try {
        console.log('🔄 Generando credenciales de prueba robustas...');

        // El endpoint para crear usuarios de prueba es especial y requiere fetch directo
        // porque no siempre está expuesto igual en todas las versiones del SDK
        const response = await fetch('https://api.mercadopago.com/users/test_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${client.accessToken}`
            },
            body: JSON.stringify({
                site_id: 'MLA',
                description: 'ecommerce_tester'
            })
        });

        const data = await response.json();

        if (data.id) {
            console.log('\n✅ ¡USUARIO DE PRUEBA CREADO EXITOSAMENTE!\n');
            console.log('------------------------------------------------');
            console.log('🔑 NUEVO ACCESS TOKEN (Copia este en tu .env.local):');
            console.log(`TEST-${data.id}-${data.password}`); // Formato usual de tokens de usuarios de prueba antigua data.access_token si existe

            // A veces la API devuelve nickname y password, y el token se construye o viene explícito
            // Vamos a intentar mostrar todo lo útil
            console.log('\n📋 Detalles completos:');
            console.log('ID:', data.id);
            console.log('Nickname:', data.nickname);
            console.log('Password:', data.password);
            console.log('Site Status:', data.site_status);
            console.log('------------------------------------------------');
            console.log('\n⚠️ IMPORTANTE: Intenta usar el ACCESS TOKEN de prueba.');
            console.log('Si la respuesta no incluyó un campo "access_token" directo, prueba usar tus credenciales actuales pero en MODO SANDBOX explícito, o busca el token que empiece con TEST- en el panel.');
        } else {
            console.error('❌ Error creando usuario:', data);
        }
    } catch (error) {
        console.error('❌ Error fatal:', error);
    }
}

createTestUsers();
