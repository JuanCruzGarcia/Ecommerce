# 🚀 Integración de MercadoPago - Guía de Configuración

## 📋 Tabla de Contenidos
1. [Requisitos](#requisitos)
2. [Configuración de MercadoPago](#configuración-de-mercadopago)
3. [Variables de Entorno](#variables-de-entorno)
4. [Configuración de Webhooks](#configuración-de-webhooks)
5. [Base de Datos](#base-de-datos)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Requisitos

- Cuenta de MercadoPago (crear en [mercadopago.com](https://www.mercadopago.com.ar))
- Credenciales de API (Access Token)
- URL pública para webhooks (usar ngrok para desarrollo local)

---

## 🔑 Configuración de MercadoPago

### 1. Obtener Credenciales

1. Ingresa a tu cuenta de MercadoPago
2. Ve a **Tus integraciones** → **Credenciales**
3. Copia tu **Access Token** (para producción) o **Test Access Token** (para pruebas)

### 2. Tipos de Credenciales

- **Modo Sandbox (Test)**: Para desarrollo y pruebas
  - Usa tarjetas de prueba: [Ver tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards)
  
- **Modo Producción**: Para cobros reales
  - Requiere validación de cuenta
  - Usa credenciales de producción

---

## 🔐 Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui

# Supabase (Service Role Key para operaciones del servidor)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# URL Base de tu aplicación
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # En producción: https://tudominio.com
```

⚠️ **IMPORTANTE**: 
- Nunca compartas tu `Access Token` ni tu `Service Role Key`
- No las subas a repositorios públicos
- Agrega `.env.local` a tu `.gitignore`

---

## 🔔 Configuración de Webhooks

Los webhooks son **CRUCIALES** para actualizar automáticamente el estado de los pedidos.

### Desarrollo Local (usando ngrok)

1. **Instalar ngrok**:
   ```bash
   # Windows (con chocolatey)
   choco install ngrok
   
   # O descarga desde https://ngrok.com/download
   ```

2. **Iniciar ngrok**:
   ```bash
   ngrok http 3000
   ```

3. **Copiar URL HTTPS**:
   ```
   Forwarding   https://xxxx-xxx-xxx-xxx.ngrok-free.app -> http://localhost:3000
   ```

4. **Configurar en MercadoPago**:
   - Ve a **Tus integraciones** → **Webhooks**
   - Click en **Agregar endpoint**
   - URL: `https://xxxx-xxx-xxx-xxx.ngrok-free.app/api/webhooks/mercadopago`
   - Eventos: Selecciona `payment`
   - Guarda

### Producción

1. **URL del Webhook**: `https://tudominio.com/api/webhooks/mercadopago`
2. Configura en el dashboard de MercadoPago como se indicó arriba
3. Asegúrate de que tu servidor esté accesible públicamente

### Verificar Webhook

Puedes verificar que tu webhook esté activo visitando:
```
GET https://tudominio.com/api/webhooks/mercadopago
```

Debería responder:
```json
{
  "status": "active",
  "message": "MercadoPago Webhook Endpoint"
}
```

---

## 💾 Base de Datos

### Tabla `payments` (Opcional pero Recomendada)

Ejecuta el script SQL en Supabase:

```bash
# Ubicación del archivo
supabase/migrations/create_payments_table.sql
```

O copia y ejecuta el contenido en el **SQL Editor** de Supabase.

Esta tabla te permitirá:
- 📊 Auditar todas las transacciones
- 🔍 Debugging de problemas de pago
- 📈 Analizar métodos de pago más usados
- 💰 Conciliar pagos con tu banco

---

## 🧪 Testing

### Modo Sandbox (Recomendado para desarrollo)

1. **Usa credenciales de prueba** (Test Access Token)

2. **Tarjetas de prueba** de MercadoPago:

| Tipo | Número | CVV | Fecha | Resultado |
|------|---------|-----|-------|-----------|
| Visa | 4509 9535 6623 3704 | 123 | 11/25 | ✅ Aprobado |
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 | ✅ Aprobado |
| Visa | 4074 0959 5370 5604 | 123 | 11/25 | ❌ Rechazado (fondos insuficientes) |

3. **Flujo de prueba**:
   ```
   1. Agrega productos al carrito
   2. Ve a checkout
   3. Completa datos de envío
   4. Click en "Pagar con MercadoPago"
   5. Usa tarjeta de prueba
   6. Verifica que se actualiza el estado en /orders
   ```

### Checklist de Testing

- [ ] ✅ Pago exitoso redirige a `/checkout/success`
- [ ] ❌ Pago rechazado redirige a `/checkout/failure`
- [ ] ⏳ Pago pendiente redirige a `/checkout/pending`
- [ ] 📦 La orden se crea con estado `pending`
- [ ] 💰 El webhook actualiza la orden a `paid` o `confirmed`
- [ ] 📉 El stock se descuenta automáticamente
- [ ] 🔔 El webhook se ejecuta correctamente (revisar logs)
- [ ] 🛒 El carrito se limpia después del pago

---

## 🐛 Troubleshooting

### El webhook no se ejecuta

1. **Verifica que ngrok esté corriendo** (modo desarrollo)
2. **Revisa los logs** en el dashboard de MercadoPago:
   - Ve a **Webhooks** → **Historial de notificaciones**
3. **Verifica la URL** del webhook
4. **Revisa la consola del servidor** para errores

### El pago no actualiza la orden

1. **Revisa los logs del webhook** en la consola del servidor
2. **Verifica que el `external_reference`** coincida con el ID de la orden
3. **Comprueba que exista la función RPC** `confirm_order` en Supabase:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'confirm_order';
   ```

### Error: "Missing payment ID"

- El webhook recibió una notificación pero sin `data.id`
- Esto es normal para notificaciones de prueba
- Ignora si solo ocurre en testing

### Error de stock insuficiente

- El webhook valida stock antes de confirmar
- Revisa que los productos tengan stock disponible en la base de datos
- Si el problema persiste, revisa la tabla `products`

### Payments nunca cambian de "pending"

1. **Verifica que el webhook esté configurado correctamente**
2. **Usa ngrok** para desarrollo local
3. **Revisa el historial de webhooks** en MercadoPago
4. **Simula un webhook manualmente** (ver sección Testing avanzado)

---

## 📚 Recursos Adicionales

- [Documentación de MercadoPago Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Tarjetas de Prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards)
- [Testing de Webhooks](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/testing)
- [Códigos de Estado de Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/payment-status)

---

## 🎯 Próximos Pasos

1. ✅ Configura tus credenciales en `.env.local`
2. ✅ Ejecuta el script SQL para crear la tabla `payments`
3. ✅ Configure ngrok y el webhook en MercadoPago
4. ✅ Realiza una compra de prueba
5. ✅ Verifica que todo funcione correctamente
6. ✅ Cambia a modo producción cuando estés listo

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor (`console.log`)
2. Revisa el historial de webhooks en MercadoPago
3. Verifica las variables de entorno
4. Consulta la documentación oficial de MercadoPago

---

**¡Listo! 🎉** Tu e-commerce ya puede recibir pagos reales con MercadoPago.
