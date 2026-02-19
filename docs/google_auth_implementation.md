# Guía de Implementación de Login con Google (Supabase)

Esta guía detalla los pasos para habilitar el inicio de sesión con Google en tu aplicación Next.js utilizando Supabase.

## 1. Configuración en Google Cloud Console

Para obtener las credenciales necesarias, debes configurar un proyecto en Google Cloud.

1.  Ve a [Google Cloud Console](https://console.cloud.google.com/).
2.  Crea un nuevo proyecto o selecciona uno existente.
3.  **Pantalla de consentimiento de OAuth**:
    *   Navega a **APIs y servicios** > **Pantalla de consentimiento de OAuth**.
    *   Selecciona **Externo** (External) y haz clic en crear.
    *   Completa la información básica: Nombre de la aplicación, correo de soporte y correo de contacto del desarrollador.
    *   Guarda y continúa (puedes omitir los alcances/scopes por ahora).
4.  **Credenciales**:
    *   Ve a **Credenciales** en el menú lateral.
    *   Haz clic en **Crear credenciales** > **ID de cliente de OAuth**.
    *   Tipo de aplicación: **Aplicación web**.
    *   **Orígenes autorizados de JavaScript**:
        *   Agrega `http://localhost:3000` (para desarrollo).
        *   Agrega tu dominio de producción (ej. `https://tu-dominio.com`).
    *   **URI de redireccionamiento autorizados**:
        *   Necesitas la URL de callback de tu proyecto Supabase.
        *   Formato: `https://<ID-PROYECTO>.supabase.co/auth/v1/callback`
        *   Puedes encontrar esta URL en tu Dashboard de Supabase en **Authentication** > **Providers** > **Google** > **Callback URL**.
    *   Haz clic en **Crear**.
5.  **Copia las credenciales**:
    *   Copia el **ID de cliente** (Client ID).
    *   Copia el **Secreto de cliente** (Client Secret).

## 2. Configuración en Supabase

1.  Ve a tu proyecto en el [Dashboard de Supabase](https://supabase.com/dashboard).
2.  Navega a **Authentication** > **Providers**.
3.  Busca **Google** en la lista y ábrelo.
4.  Activa el interruptor **Enable Google**.
5.  Pega el **Client ID** y **Client Secret** que obtuviste de Google Cloud.
6.  Haz clic en **Save**.

## 3. Implementación en el Frontend

Cuando decidas implementar esto en el código, deberás modificar las páginas de Login y Register.

### A. Modificar `src/app/auth/login/page.tsx`

1.  **Agregar la función `handleGoogleLogin`** dentro del componente, antes del `return`:

```tsx
const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Redirige al callback y preserva la URL a la que el usuario intentaba ir
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
            },
        });
        if (error) throw error;
    } catch (err: any) {
        setError(err.message || 'Ocurrió un error con Google');
        setLoading(false);
    }
};
```

2.  **Agregar el botón en el JSX**. Insértalo justo después del botón de "Entrar" y antes del cierre del formulario, o donde prefieras:

```tsx
<div className="relative mt-6">
    <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
    </div>
    <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-gray-500">
            O continuar con
        </span>
    </div>
</div>

<div className="mt-6">
    <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
        <svg className="h-5 w-5 mr-2" aria-hidden="true" viewBox="0 0 24 24">
            <path
                d="M12.0003 20.45c4.65 0 8.55-3.15 9.9-7.5h-9.9v-4.8h17.1c.15.9.15 1.8.15 2.85 0 8.1-5.4 13.95-13.35 13.95-7.73 0-14.1-6.15-14.4-13.8 0-.15 0-.3 0-.45C1.8003 5.7 7.2003 1.2 13.0503 1.2c3.15 0 6 1.05 8.25 3l-3.3 3.3c-1.35-1.05-3-1.65-4.95-1.65-4.05 0-7.35 2.85-8.55 6.45-.15.45-.15.9-.15 1.35 0 .45.15.9.15 1.35 1.05 3.6 4.35 6.45 8.55 6.45z"
                fill="#4285F4"
            />
            <path
                d="M12.0003 20.45c-4.2 0-7.5-2.85-8.55-6.45-.15-.45-.15-.9-.15-1.35 0-.45.15-.9.15-1.35 1.05-3.6 4.35-6.45 8.55-6.45 1.95 0 3.6.6 4.95 1.65l3.3-3.3C18.9003 1.05 16.2003 0 13.0503 0 7.2003 0 1.9503 4.35 1.6503 10.2c0 .15 0 .3 0 .45 0 .15 0 .3 0 .45.3 7.65 6.6 13.8 14.4 13.8 7.95 0 11.25-5.85 11.25-13.8h-1V10.2h-13.65v4.35h9.45c-1.35 4.35-5.25 7.5-10.05 7.5z"
                fill="none"
            />
            <path
                d="M1.6503 10.65C1.6503 10.5 1.6503 10.35 1.6503 10.2c.3-5.85 5.55-10.2 11.4-10.2 3.15 0 5.85 1.05 7.95 2.55l-3.3 3.3c-1.2-1.2-2.85-1.65-4.65-1.65-4.05 0-7.35 2.85-8.55 6.45H1.6503z"
                fill="#EA4335"
            />
            <path
                d="M1.6503 10.65h2.85c1.2-3.6 4.5-6.45 8.55-6.45V1.2C7.2003 1.2 1.8003 5.7 1.6503 10.65z"
                fill="none"
            />
            <path
                d="M13.0503 20.45c4.8 0 8.7-3.15 10.05-7.5h-9.45v3H24c.15 7.95-3.15 13.8-11.25 13.8-1.5 0-3-.3-4.35-.9l2.7-2.7c.9.45 1.8.6 2.85.6z"
                fill="#34A853"
            />
            <path
                d="M4.5003 14.85h-2.85c.3 7.65 6.6 13.8 14.4 13.8 1.35 0 2.85-.3 4.35-.9L17.7003 24l-4.65.6c-4.65 0-8.55-3.15-9.9-7.5z"
                fill="none"
            />
            <path
                d="M13.0503 9.3v4.8H24c.15-.9.15-1.8.15-2.85 0-1.8-.45-3.15-1.2-4.2l-3.15 2.25H13.0503z"
                fill="#4A90E2"
            />
            <path
                d="M4.5003 14.85c-.15-.45-.15-.9-.15-1.35 0-.45.15-.9.15-1.35h-2.85c0 .15 0 .3 0 .45 0 .15 0 .3 0 .45.3 5.4 3.75 9.3 8.7 11.25l2.7-2.7c-4.2 0-7.5-2.85-8.55-6.45z"
                fill="#FBBC05"
            />
        </svg>
        Google
    </button>
</div>
```

### B. Modificar `src/app/auth/register/page.tsx`

Sigue los mismos pasos que en el Login.
1.  Agrega la función `handleGoogleLogin`.
2.  Agrega la sección visual (cambiaando el texto "O continuar con" por "O registrarse con").
