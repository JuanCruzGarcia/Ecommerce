'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

type UserProfile = {
    id: string;
    role: 'admin' | 'customer';
};

type AuthContextType = {
    user: UserProfile | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

// Singleton: evita múltiples instancias que generan eventos duplicados
const supabase = createSupabaseClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Carga el perfil y actualiza el estado. NO hace redirecciones.
        const loadUserProfile = async (userId: string) => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role')
                .eq('id', userId)
                .single();

            if (profile) {
                setUser(profile);
            } else {
                console.warn('AuthContext: Usuario sin perfil, usando fallback.');
                setUser({ id: userId, role: 'customer' });
            }
        };

        const loadUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const authUser = session?.user;

            if (authUser) {
                console.log('AuthContext: Sesión activa detectada:', authUser.email);
                await loadUserProfile(authUser.id);
            } else {
                console.log('AuthContext: No hay sesión activa.');
                setUser(null);
            }
            setLoading(false);
        };

        loadUser();

        // Escuchar cambios de estado (login, logout, refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('AuthContext: Cambio de estado auth:', event);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // Solo actualizar estado, NO redirigir.
                // La página de login ya maneja el redirect post-login.
                const authUser = session?.user;
                if (authUser) {
                    await loadUserProfile(authUser.id);
                    setLoading(false);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
                router.refresh();
            } else if (event === 'PASSWORD_RECOVERY') {
                router.push('/auth/reset-password');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
