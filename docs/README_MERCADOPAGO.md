# 💳 Integración MercadoPago - Quick Start

## 🚀 Inicio Rápido (5 minutos)

### 1. Instalar Dependencias
```bash
# Ya instalado, pero si necesitas reinstalar:
npm install mercadopago
```

### 2. Configurar Variables de Entorno

Edita `.env.local` y agrega tu Access Token de MercadoPago:

```env
# Obtén tu token en: https://www.mercadopago.com.ar/developers/panel/credentials
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-xxxxxx-xxxxxxxxxxxxxxxx

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Crear Tabla de Pagos en Supabase

Ejecuta el script SQL en el SQL Editor de Supabase:

```sql
-- Copia y ejecuta el contenido de:
supabase/migrations/create_payments_table.sql
```

### 4. Configurar Webhooks (Para Testing)

#### Opción A: Testing sin Webhooks
- Los pagos funcionarán, pero los estados no se actualizarán automáticamente
- Útil para desarrollo inicial

#### Opción B: Testing con ngrok (Recomendado)

```bash
# 1. Instalar ngrok
# Windows: https://ngrok.com/download

# 2. Iniciar ngrok
ngrok http 3000

# 3. Copiar la URL HTTPS que te da
# Ejemplo: https://abcd-1234.ngrok-free.app

# 4. Configurar en MercadoPago:
# Dashboard > Webhooks > Agregar endpoint
# URL: https://abcd-1234.ngrok-free.app/api/webhooks/mercadopago
# Evento: payment
```

### 5. ¡Probar!

1. Inicia el servidor:
   ```bash
   npm run dev
   ```

2. Ve a: `http://localhost:3000`

3. Agrega productos al carrito

4. Ve a checkout y haz click en "Pagar con MercadoPago"

5. Usa una **tarjeta de prueba**:
   - Número: `4509 9535 6623 3704`
   - Vencimiento: `11/25`
   - CVV: `123`
   - Nombre: Cualquiera

6. ¡Listo! El pago debe procesarse correctamente

---

## 📁 Archivos Implementados

### Backend (API Routes)
- ✅ `src/app/api/checkout/mercadopago/route.ts` - Crea preferencia de pago
- ✅ `src/app/api/webhooks/mercadopago/route.ts` - Recibe notificaciones

### Frontend (Páginas)
- ✅ `src/app/checkout/page.tsx` - Botón de pago integrado
- ✅ `src/app/checkout/success/page.tsx` - Pago exitoso
- ✅ `src/app/checkout/failure/page.tsx` - Pago rechazado
- ✅ `src/app/checkout/pending/page.tsx` - Pago pendiente

### Configuración
- ✅ `.env.local` - Variables de entorno
- ✅ `.env.example` - Ejemplo de configuración
- ✅ `supabase/migrations/create_payments_table.sql` - Tabla de pagos

### Documentación
- ✅ `docs/MERCADOPAGO_SETUP.md` - Guía completa de configuración
- ✅ `docs/IMPLEMENTATION_SUMMARY.md` - Resumen ejecutivo
- ✅ `docs/README_MERCADOPAGO.md` - Este archivo

---

## 🎨 Flujo de Usuario

```
1. Usuario add productos → carrito
2. Usuario → /checkout
3. Completa formulario (nombre, dirección)
4. Click "Pagar con MercadoPago"
   ↓
5. API crea orden (pending) → MercadoPago Preference
   ↓
6. Usuario → MercadoPago (paga con tarjeta/efectivo/transfer)
   ↓
7. MercadoPago → Webhook (notifica resultado)
   ↓
8. Webhook → Actualiza orden a 'paid' → Descuenta stock
   ↓
9. Usuario → /checkout/success ✅
```

---

## 🧪 Testing

### Tarjetas de Prueba

| Tarjeta | Número | Resultado |
|---------|--------|-----------|
| ✅ Visa Aprobada | `4509 9535 6623 3704` | Pago exitoso |
| ✅ Mastercard Aprobada | `5031 7557 3453 0604` | Pago exitoso |
| ❌ Fondos Insuficientes | `4074 0959 5370 5604` | Rechazado |

- **CVV**: `123`
- **Vencimiento**: `11/25` (o cualquier fecha futura)
- **Titular**: Cualquier nombre

### Checklist

- [ ] Pago exitoso → orden en `paid`
- [ ] Pago rechazado → orden sigue en `pending`
- [ ] Stock se descuenta correctamente
- [ ] Webhook recibe notificaciones
- [ ] Redirección a páginas correctas

---

## 🐛 Problemas Comunes

### "Error al crear la preferencia de pago"
- ✅ Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté configurado
- ✅ Asegúrate de usar un Access Token válido (TEST- o APP_USR-)

### "Webhook no actualiza la orden"
- ✅ Verifica que ngrok esté corriendo
- ✅ Revisa la URL del webhook en MercadoPago dashboard
- ✅ Mira los logs del servidor (`console.log`)

### "Stock no se descuenta"
- ✅ Verifica que exista la función RPC `confirm_order` en Supabase
- ✅ Revisa los logs del webhook

---

## 📚 Documentación Completa

Para información detallada, ver:
- **Setup completo**: `docs/MERCADOPAGO_SETUP.md`
- **Resumen técnico**: `docs/IMPLEMENTATION_SUMMARY.md`
- **Docs oficiales**: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing

---

## 🎯 Producción

Para usar en producción:

1. Obtén credenciales de producción en MercadoPago
2. Actualiza `.env.local`:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxx-prod
   NEXT_PUBLIC_BASE_URL=https://tudominio.com
   ```
3. Configura webhook en producción:
   ```
   https://tudominio.com/api/webhooks/mercadopago
   ```
4. ¡Listo! Ya puedes recibir pagos reales 💰

---

## ✅ ¿Todo Funciona?

Si completaste todos los pasos, deberías poder:
- ✅ Crear una orden de compra
- ✅ Redirigir a MercadoPago
- ✅ Procesar un pago
- ✅ Recibir la notificación del webhook
- ✅ Actualizar la orden automáticamente
- ✅ Ver el pedido confirmado

**¡Felicitaciones! 🎉 Tu e-commerce ya acepta pagos con MercadoPago.**

---

**¿Preguntas?** Consulta `docs/MERCADOPAGO_SETUP.md` para más detalles.
