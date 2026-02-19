import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createSupabaseServer()
        console.log(`[Auth Callback] Intercambiando código por sesión... Código: ${code.substring(0, 5)}...`);

        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Consultar el perfil para decidir redirección
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            const role = profile?.role || 'customer';
            console.log(`[Auth Callback] Usuario logueado con rol: ${role}`);

            let finalRedirect = next;
            // SI el usuario es admin y 'next' era '/', forzar /admin
            if (role === 'admin' && (next === '/' || next === '/auth/login')) {
                finalRedirect = '/admin';
            }

            // Usando redirect() de next/navigation que maneja mejor el contexto de cookies en Server Actions/Route Handlers
            const { redirect } = await import('next/navigation');

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            let targetUrl = `${origin}${finalRedirect}`;
            if (!isLocalEnv && forwardedHost) {
                targetUrl = `https://${forwardedHost}${finalRedirect}`;
            }

            console.log(`[Auth Callback] Redirigiendo a: ${targetUrl}`);
            redirect(targetUrl);
        } else {
            console.error("[Auth Callback] Error al intercambiar código:", error);
            // Si falla, redirigimos al login con error
            const { redirect } = await import('next/navigation');
            redirect(`${origin}/auth/login?error=auth_code_error`)
        }
    } else {
        console.warn("[Auth Callback] No se recibió código en la URL");
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
