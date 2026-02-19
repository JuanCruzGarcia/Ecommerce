# Prompt para Integración de Mercado Pago

**Contexto del Proyecto:**
Estoy desarrollando un e-commerce utilizando **Next.js (App Router)** y **Supabase** como backend. Ya cuento con:
1.  Tabla de `products` con manejo de stock.
2.  Tabla de `orders` con estados (`pending`, `confirmed`, `paid`).
3.  Lógica de carrito de compras en el frontend.
4.  Un sistema que descuenta stock automáticamente cuando una orden pasa a estado `confirmed`.

**Objetivo:**
Integrar la pasarela de pagos de **Mercado Pago (Checkout Pro)** para procesar cobros reales.

**Requerimientos Técnicos:**

1.  **Frontend (Next.js):**
    - Crear un botón "Pagar con Mercado Pago" en la página de Checkout.
    - Este botón debe llamar a un endpoint de mi API (`/api/checkout/mercadopago`) para crear la preferencia de pago.
    - Redirigir al usuario a la URL de pago retornada por Mercado Pago (`init_point`).
    - Crear páginas de retorno: `/checkout/success`, `/checkout/failure`, `/checkout/pending`.

2.  **Backend (Next.js API Routes):**
    - Ruta `POST /api/checkout/mercadopago`:
        - Recibe los items del carrito.
        - Crea una orden en Supabase con estado `pending`.
        - Usa el SDK de Mercado Pago para crear una preferencia (`preference`), incluyendo el ID de la orden como `external_reference`.
        - Retorna la URL de pago.

3.  **Webhooks (Crucial):**
    - Ruta `POST /api/webhooks/mercadopago`:
        - Recibe las notificaciones de Mercado Pago (cuando el pago se acredita).
        - Verifica la firma/seguridad de la notificación.
        - Consulta el estado del pago en Mercado Pago usando el ID recibido.
        - Si el pago está `approved`, actualiza la orden en Supabase a estado `paid` (o `confirmed`).
        - **Importante:** Asegurar que esta actualización dispare mi trigger existente de descuento de stock.

4.  **Seguridad:**
    - Manejo de credenciales (`ACCESS_TOKEN`) usando variables de entorno.
    - Validación de que el monto pagado coincida con el total de la orden.

**Tecnologías:**
- Next.js (App Router)
- Supabase (PostgreSQL + RLS)
- Mercado Pago SDK (Node.js)

**Documentación de Referencia:**
- [Mercado Pago - Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)

**Entregables Esperados:**
- Código para la API Route de creación de preferencia.
- Código para el componente del botón de pago.
- Código robusto para el Webhook handler.
- Instrucciones para configurar las URLs de notificación en el dashboard de Mercado Pago.
