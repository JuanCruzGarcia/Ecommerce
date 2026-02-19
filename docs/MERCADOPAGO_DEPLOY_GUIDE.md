# 🚀 Guía de Deploy MercadoPago - Configuración por Ambiente

## 📋 Resumen de Problemas Resueltos (4 Feb 2026)

### Problemas encontrados durante el desarrollo:

1. **Credenciales incorrectas**: Se estaban usando credenciales de producción (`APP_USR-...`) con tarjetas de prueba, lo cual no funciona.

2. **Sandbox con problemas**: El entorno sandbox de MercadoPago (`sandboxInitPoint`) presentaba errores 404 intermitentes.

3. **Bloqueadores de anuncios**: Extensiones como AdBlock/uBlock bloqueaban requests a `api.mercadolibre.com` y `sandbox.mercadopago.com.ar`.

4. **Modo incógnito**: El sistema antifraude de MercadoPago detectaba el modo incógnito y rechazaba pagos.

5. **Email del payer**: El email enviado en la preferencia debía coincidir con usuarios de prueba de MercadoPago.

### Solución aplicada:
- Se cambió a usar `initPoint` (producción) en lugar de `sandboxInitPoint`
- Se configuró el email del payer como usuario de prueba

---

## 🔧 Configuración por Ambiente

### Localhost (Desarrollo)

```env
# .env.local
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx  # Credenciales de PRUEBA del panel
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Archivos a configurar:**

1. `src/app/checkout/page.tsx` - Línea ~250:
```typescript
// Para desarrollo local (usar initPoint porque sandbox tiene problemas)
const paymentUrl = data.initPoint || data.sandboxInitPoint;
```

2. `src/app/api/checkout/mercadopago/route.ts` - Línea ~155:
```typescript
// Para testing con usuarios de prueba
email: 'test_user_xxxxx@testuser.com', // Email del Buyer Test User
```

**Notas:**
- ❌ Webhooks NO funcionarán (localhost no es accesible desde internet)
- ✅ Las back_urls funcionan para redirección
- ⚠️ Desactivar bloqueadores de anuncios para probar

---

### Staging/Test (Servidor de pruebas)

```env
# .env.local o variables de entorno del servidor
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx  # Credenciales de PRUEBA
NEXT_PUBLIC_BASE_URL=https://staging.tudominio.com
```

**Archivos a configurar:**

1. `src/app/checkout/page.tsx` - Línea ~250:
```typescript
// En staging puedes probar ambos
const paymentUrl = data.sandboxInitPoint || data.initPoint;
```

2. `src/app/api/checkout/mercadopago/route.ts`:
   - Descomentar `notification_url` (línea ~152):
```typescript
notification_url: `${baseUrl}/api/webhooks/mercadopago`,
```

3. Configurar Webhook en MercadoPago:
   - URL: `https://staging.tudominio.com/api/webhooks/mercadopago`
   - Eventos: `payment`

---

### Producción

```env
# Variables de entorno del servidor de producción
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx  # ⚠️ Credenciales de PRODUCCIÓN
NEXT_PUBLIC_BASE_URL=https://tudominio.com
```

**Archivos a configurar:**

1. `src/app/checkout/page.tsx` - Línea ~250:
```typescript
// En producción SIEMPRE usar initPoint
const paymentUrl = data.initPoint;
```

2. `src/app/api/checkout/mercadopago/route.ts`:
   - Email del payer debe ser dinámico:
```typescript
email: userData?.email || shippingData?.email,
```
   - Descomentar `notification_url`:
```typescript
notification_url: `${baseUrl}/api/webhooks/mercadopago`,
```
   - Descomentar `auto_return`:
```typescript
auto_return: 'all' as const,
```

3. Configurar Webhook en MercadoPago:
   - URL: `https://tudominio.com/api/webhooks/mercadopago`
   - Eventos: `payment`

---

## 📝 Checklist de Deploy

### Antes de subir a Staging:
- [ ] Cambiar `NEXT_PUBLIC_BASE_URL` a la URL del staging
- [ ] Configurar webhook en panel de MercadoPago
- [ ] Descomentar `notification_url` en route.ts
- [ ] Probar flujo completo con usuarios de prueba

### Antes de subir a Producción:
- [ ] Cambiar a credenciales de PRODUCCIÓN en MercadoPago
- [ ] Actualizar `MERCADOPAGO_ACCESS_TOKEN` con token de producción
- [ ] Cambiar `NEXT_PUBLIC_BASE_URL` a dominio de producción
- [ ] Cambiar email del payer a email dinámico del usuario
- [ ] Descomentar `auto_return: 'all'`
- [ ] Configurar webhook de producción en MercadoPago
- [ ] Usar `initPoint` (no `sandboxInitPoint`)
- [ ] Probar con una compra real de bajo monto

---

## 🔗 Links Útiles

- [Panel de MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel)
- [Credenciales](https://www.mercadopago.com.ar/developers/panel/credentials)
- [Tarjetas de Prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards)
- [Cuentas de Prueba](https://www.mercadopago.com.ar/developers/panel/test-users)
- [Webhooks](https://www.mercadopago.com.ar/developers/panel/webhooks)

---

## 🆘 Troubleshooting

### "No pudimos procesar tu pago"
1. Verificar que el `MERCADOPAGO_ACCESS_TOKEN` sea correcto
2. Si usas sandbox, iniciar sesión con usuario de prueba
3. Desactivar bloqueadores de anuncios
4. No usar modo incógnito

### Webhooks no funcionan
1. Verificar URL del webhook en panel de MercadoPago
2. Verificar que el servidor sea accesible públicamente
3. Revisar logs del servidor

### Error de stock
1. Verificar que los productos tengan stock en la BD
2. Revisar la función `confirm_order` en Supabase
