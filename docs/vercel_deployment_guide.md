# Guía de Despliegue en Vercel (Modo Prueba / Demo)

Esta guía te ayudará a desplegar tu aplicación E-commerce en Vercel manteniendo la integración con Mercado Pago en **modo de prueba (Sandbox)**. Esto es ideal para mostrar la funcionalidad completa del template sin procesar pagos reales.

## 1. Preparación del Entorno en Vercel

Al importar tu repositorio en Vercel, deberás configurar las siguientes **Environment Variables** (Variables de Entorno) antes de hacer el despliegue final.

Ve a la sección **Settings** > **Environment Variables** de tu proyecto en Vercel e ingresa las siguientes claves y valores:

| Variable | Descripción | Valor Recomendado |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública de Supabase | `tu_anon_key_publica` |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave secreta de Supabase (necesaria para admin) | `tu_service_role_key_secreta` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acceso de MP (Modo Prueba) | `TEST-xxxx...` o `APP_USR-xxxx...` (Ver detalle abajo) |
| `NEXT_PUBLIC_BASE_URL` | URL de tu dominio en Vercel | `https://tu-proyecto.vercel.app` (sin barra al final) |

---

## 2. Configuración de Mercado Pago (Modo Prueba)

Para que el checkout funcione sin cobrar dinero real y puedas probar todo el flujo (pendiente, aprobado, rechazado), es CRUCIAL usar las credenciales de prueba.

1.  Ve al [Panel de Desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers/panel).
2.  Selecciona tu aplicación o crea una nueva.
3.  Ve a **Credenciales de prueba** (Test Credentials).
4.  Copia el **Access Token** (suele empezar con `TEST-` o `APP_USR-`).
5.  Pega este valor en la variable `MERCADOPAGO_ACCESS_TOKEN` en Vercel.

**⚠️ Importante**:
*   NO uses las "Credenciales de producción".
*   Para probar la compra, usa las [Tarjetas de Prueba](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/cards) que provee Mercado Pago.

---

## 3. Configuración de Supabase (Auth Redirects)

Una vez que Vercel te haya asignado un dominio (ej. `https://mi-ecommerce.vercel.app`), debes autorizarlo en Supabase para que el Login funcione correctamente.

1.  Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navega a **Authentication** > **URL Configuration**.
3.  En **Site URL**, puedes poner tu dominio de Vercel.
4.  En **Redirect URLs**, añade:
    *   `https://mi-ecommerce.vercel.app/**`
    *   (Asegúrate de incluir `https://` y el dominio exacto).
5.  Guarda los cambios.

---

## 4. Webhooks y Notificaciones

Para que Mercado Pago notifique a tu aplicación cuando un pago se aprueba:

1.  Asegúrate de haber definido `NEXT_PUBLIC_BASE_URL` en Vercel con tu dominio de producción (`https://mi-ecommerce.vercel.app`).
2.  El código de la aplicación usa esta variable para construir la URL del Webhook automáticamente (`${NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`).
3.  Si Mercado Pago intenta notificar a `localhost`, fallará. Por eso es vital que `NEXT_PUBLIC_BASE_URL` sea correcta en Vercel.

## 5. Verificación Final

Una vez desplegado:

1.  Abre tu sitio en Vercel.
2.  Inicia sesión (verifica que Supabase Auth funcione).
3.  Agrega un producto al carrito e inicia el pago.
4.  Deberías ser redirigido a Mercado Pago (Sandbox).
5.  Usa una tarjeta de prueba de MP:
    *   **Número**: `5303 1475 7260 0014` (Mastercard) o busca otras en la doc.
    *   **Fecha**: Cualquiera futura (ej. 11/2029).
    *   **CVC**: `123`.
    *   **Titular**: `APRO` (para pago aprobado).
6.  Al finalizar, deberías volver a tu sitio y ver la orden actualizada.
