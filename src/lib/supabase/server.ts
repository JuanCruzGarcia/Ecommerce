import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServer() {
    const cookieStore = await cookies(); // ✅ OBLIGATORIO en Next 16

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },

                // 🚫 NO se pueden mutar cookies en Server Components
                set(name: string, value: string, options: any) {
                    try {
                        // console.log(`[Supabase Server] Setting cookie: ${name}`);
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // En Server Components (paginas) esto falla y es normal.
                        // En Route Handlers (como callback) NO debería fallar.
                        console.error(`[Supabase Server] Error setting cookie ${name}:`, error);
                    }
                },

                remove(name: string, options: any) {
                    try {
                        // console.log(`[Supabase Server] Removing cookie: ${name}`);
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        console.error(`[Supabase Server] Error removing cookie ${name}:`, error);
                    }
                },
            },
        }
    );
}
