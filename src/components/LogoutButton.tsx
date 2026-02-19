'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function LogoutButton() {
    const router = useRouter();
    const supabase = createSupabaseClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    return (
        <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
        >
            Cerrar sesión
        </button>
    );
}
