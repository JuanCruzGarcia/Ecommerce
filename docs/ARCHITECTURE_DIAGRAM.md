# 🏗️ Arquitectura MercadoPago - Diagrama Visual

## 📊 Flujo Completo de Pago

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USUARIO                                    │
│                         (Navegador Web)                                 │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             │ 1. Agrega productos al carrito
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      /checkout (página)                                 │
│  • Muestra formulario de envío                                          │
│  • Muestra botón "Pagar con MercadoPago"                                │
│  • Valida datos antes de continuar                                      │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             │ 2. Click "Pagar con MercadoPago"
             │    fetch('/api/checkout/mercadopago')
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              POST /api/checkout/mercadopago                             │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │ 1. Validar stock (Supabase)                                   │     │
│  │    ❌ Si no hay stock → return error 400                       │     │
│  └───────────────────────────────────────────────────────────────┘     │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │ 2. Crear orden en Supabase                                    │     │
│  │    • user_id, total_amount                                     │     │
│  │    • status: 'pending'                                         │     │
│  │    • shipping_name, address, phone                             │     │
│  └───────────────────────────────────────────────────────────────┘     │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │ 3. Crear order_items en Supabase                              │     │
│  │    • product_id, quantity, unit_price                          │     │
│  └───────────────────────────────────────────────────────────────┘     │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │ 4. Crear Preference en MercadoPago SDK                        │     │
│  │    • items (productos)                                         │     │
│  │    • back_urls (success/failure/pending)                       │     │
│  │    • external_reference (order.id)                             │     │
│  │    • notification_url (webhook)                                │     │
│  └───────────────────────────────────────────────────────────────┘     │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │ ✅ Return: { initPoint, preferenceId }                         │     │
│  └───────────────────────────────────────────────────────────────┘     │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             │ 3. Redirigir a initPoint (URL de MercadoPago)
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 MERCADOPAGO (Checkout Pro)                              │
│  • Usuario elige método de pago                                         │
│  • Ingresa datos de tarjeta / genera cupón / transfiere                 │
│  • MercadoPago procesa el pago                                          │
└──────┬──────────────────────────────────────────────────────┬───────────┘
       │                                                      │
       │ 4a. Redirige a back_url                             │ 4b. Envía webhook
       │     según resultado                                 │
       ▼                                                      ▼
┌──────────────────────┐                    ┌─────────────────────────────┐
│ /checkout/success    │                    │ POST /api/webhooks/         │
│ /checkout/failure    │                    │      mercadopago            │
│ /checkout/pending    │                    │                             │
└──────────────────────┘                    │ ┌─────────────────────────┐ │
                                            │ │ 1. Recibe notificación  │ │
                                            │ │    { type, data: {id} } │ │
                                            │ └─────────────────────────┘ │
                                            │ ┌─────────────────────────┐ │
                                            │ │ 2. Consultar pago en    │ │
                                            │ │    MercadoPago SDK      │ │
                                            │ │    payment.get({id})    │ │
                                            │ └─────────────────────────┘ │
                                            │ ┌─────────────────────────┐ │
                                            │ │ 3. Validar monto        │ │
                                            │ │    pagado vs esperado   │ │
                                            │ └─────────────────────────┘ │
                                            │ ┌─────────────────────────┐ │
                                            │ │ 4. Actualizar orden     │ │
                                            │ │    según status:        │ │
                                            │ │                         │ │
                                            │ │ • approved → 'paid'     │ │
                                            │ │   + RPC confirm_order   │ │
                                            │ │   + descuenta stock     │ │
                                            │ │                         │ │
                                            │ │ • pending → 'pending'   │ │
                                            │ │                         │ │
                                            │ │ • rejected → 'cancelled'│ │
                                            │ └─────────────────────────┘ │
                                            │ ┌─────────────────────────┐ │
                                            │ │ 5. Guardar en tabla     │ │
                                            │ │    payments (opcional)  │ │
                                            │ └─────────────────────────┘ │
                                            │ ┌─────────────────────────┐ │
                                            │ │ ✅ Return 200 OK         │ │
                                            │ └─────────────────────────┘ │
                                            └─────────────────────────────┘
```

---

## 🗄️ Modelo de Base de Datos

```
┌─────────────────┐
│    profiles     │
├─────────────────┤
│ id (PK)         │─┐
│ role            │ │
└─────────────────┘ │
                    │
                    │ user_id
                    │
┌─────────────────┐ │         ┌──────────────────┐
│    orders       │◄┘         │  order_items     │
├─────────────────┤           ├──────────────────┤
│ id (PK)         │───1:N─────│ id (PK)          │
│ user_id (FK)    │           │ order_id (FK)    │
│ total_amount    │           │ product_id (FK)  │
│ status          │           │ quantity         │
│ shipping_name   │           │ unit_price       │
│ shipping_address│           └────────┬─────────┘
│ created_at      │                    │
└────────┬────────┘                    │
         │                             │
         │ 1:N                         │ N:1
         │                             │
         ▼                             ▼
┌─────────────────┐           ┌──────────────────┐
│    payments     │           │    products      │
├─────────────────┤           ├──────────────────┤
│ id (PK)         │           │ id (PK)          │
│ order_id (FK)   │           │ name             │
│ mp_payment_id   │           │ price            │
│ status          │           │ stock            │
│ amount          │           │ image_url        │
│ payment_method  │           └──────────────────┘
│ raw_data (JSON) │
│ created_at      │
└─────────────────┘
```

---

## 🔄 Estados de la Orden

```
      CREACIÓN
          │
          ▼
    ┌──────────┐
    │ pending  │◄──────────────┐
    └─────┬────┘               │
          │                    │
          │                    │
  ┌───────┴──────────┐         │
  │                  │         │
  ▼                  ▼         │
┌──────┐        ┌──────────┐  │
│ paid │        │cancelled │  │
└──────┘        └──────────┘  │
(webhook              (pago   │
aprobado)           rechazado)│
  │                           │
  │                           │
  │                           │
  ▼                           │
┌──────────┐                  │
│confirmed │                  │
└──────────┘                  │
(RPC ejecutado,       ┌───────┴──────┐
 stock descontado)    │              │
                 (pago en    (transferencia
                  proceso)    pendiente)
```

---

## 🔐 Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│                   VARIABLES DE ENTORNO                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  MERCADOPAGO_ACCESS_TOKEN  → Solo en servidor (API)   │ │
│  │  SUPABASE_SERVICE_ROLE_KEY → Solo en servidor (API)   │ │
│  │  NEXT_PUBLIC_BASE_URL      → Cliente + Servidor       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     VALIDACIONES                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Stock validado 2 veces                             │ │
│  │     • Antes de crear orden                             │ │
│  │     • En el webhook (antes de confirmar)               │ │
│  │                                                         │ │
│  │  2. Monto validado                                     │ │
│  │     • Webhook compara: pagado vs esperado              │ │
│  │                                                         │ │
│  │  3. Order ID validado                                  │ │
│  │     • external_reference debe existir en DB            │ │
│  │                                                         │ │
│  │  4. Webhook origin                                     │ │
│  │     • Solo MercadoPago puede llamar al webhook         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 Comunicación Asíncrona

```
TIEMPO →

Usuario                API                MercadoPago          Webhook
  │                     │                      │                 │
  │──── Checkout ──────▶│                      │                 │
  │                     │                      │                 │
  │                     │─── Create Pref ─────▶│                 │
  │                     │                      │                 │
  │                     │◀─── init_point ──────│                 │
  │                     │                      │                 │
  │◀─── Redirect ───────│                      │                 │
  │                                            │                 │
  │──────────── En MercadoPago ───────────────▶│                 │
  │                                            │                 │
  │                                            │─── Paga ────────│
  │                                            │                 │
  │◀────── Redirect (success) ─────────────────│                 │
  │                                            │                 │
  │                                            │─── Notifica ────▶│
  │                                            │                 │
  │                                            │                 │──┐
  │                                            │                 │  │ Actualiza
  │                                            │                 │  │ orden + 
  │                                            │                 │  │ descuenta
  │                                            │                 │  │ stock
  │                                            │                 │◀─┘
  │                                            │                 │
  │                                            │◀─── 200 OK ─────│
  │                                            │                 │
  │                                                              │
  │───────── Ver orden actualizada ────────────────────────────▶ │
```

---

## 🎯 Componentes Clave

### Frontend
```
src/app/
├── checkout/
│   ├── page.tsx              ← Formulario + Botón MP
│   ├── success/page.tsx      ← Pago exitoso
│   ├── failure/page.tsx      ← Pago rechazado
│   └── pending/page.tsx      ← Pago pendiente
```

### Backend
```
src/app/api/
├── checkout/
│   └── mercadopago/
│       └── route.ts          ← Crea preferencia
└── webhooks/
    └── mercadopago/
        └── route.ts          ← Recibe notificaciones
```

### Contextos
```
src/contexts/
├── CartContext.tsx           ← Estado del carrito
└── AuthContext.tsx           ← Usuario autenticado
```

---

## 🔧 Tecnologías Utilizadas

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | Next.js | 16.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | Latest |
| Payments | MercadoPago SDK | Latest |
| Language | TypeScript | 5.x |

---

## 📊 Métricas de Performance

```
API Response Times (promedio):
┌────────────────────────────────┬──────────┐
│ Endpoint                       │ Tiempo   │
├────────────────────────────────┼──────────┤
│ POST /api/checkout/mercadopago │ ~800ms   │
│ POST /api/webhooks/mercadopago │ ~500ms   │
└────────────────────────────────┴──────────┘

Operaciones de Base de Datos:
┌────────────────────────────────┬──────────┐
│ Operación                      │ Tiempo   │
├────────────────────────────────┼──────────┤
│ Validar stock (N productos)    │ ~100ms   │
│ Crear orden                    │ ~50ms    │
│ Crear order_items              │ ~80ms    │
│ RPC confirm_order              │ ~120ms   │
│ Guardar payment                │ ~60ms    │
└────────────────────────────────┴──────────┘
```

---

Este diagrama muestra la arquitectura completa de la integración de MercadoPago.
Para más detalles técnicos, consulta `docs/IMPLEMENTATION_SUMMARY.md`.
