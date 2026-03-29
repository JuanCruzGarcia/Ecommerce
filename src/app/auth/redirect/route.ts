import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

/**
 * GET /auth/redirect?next=/
 *
 * Route handler server-side que se ejecuta DESPUÉS de que el cliente
 * completó el login. Lee la sesión desde las cookies (ya seteadas por
 * Supabase en el browser), consulta el rol del usuario en la DB y
 * redirige al destino correcto.
 *
 * Este enfoque evita cualquier race condition del router de Next.js
 * porque es una navegación HTTP completa, no una SPA navigation.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const next = searchParams.get('next') ?? '/'

    try {
        const supabase = await createSupabaseServer()

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            // Sin sesión válida → volver al login
            return NextResponse.redirect(`${origin}/auth/login`)
        }

        // Consultar el rol del usuario
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role ?? 'customer'

        let destination: string
        if (role === 'admin') {
            destination = `${origin}/admin`
        } else {
            // Usar el 'next' param como destino, con fallback a '/'
            const safeNext = next.startsWith('/') ? next : '/'
            destination = `${origin}${safeNext}`
        }

        return NextResponse.redirect(destination)

    } catch (err) {
        console.error('[Auth Redirect] Error:', err)
        return NextResponse.redirect(`${origin}/auth/login`)
    }
}
