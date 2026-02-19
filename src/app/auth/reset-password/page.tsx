'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
    const supabase = createSupabaseClient();

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        // Esto es CRÍTICO: establece la sesión usando el token del link
        supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setMessage('Podés definir una nueva contraseña');
            }
        });
    }, [supabase]);

    const handleReset = async () => {
        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password,
        });

        setLoading(false);

        if (error) {
            setMessage(error.message);
        } else {
            setMessage('Contraseña actualizada correctamente');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '50px auto' }}>
            <h1>Restablecer contraseña</h1>

            <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: 8, marginTop: 10 }}
            />

            <button
                onClick={handleReset}
                disabled={loading || password.length < 6}
                style={{ marginTop: 12 }}
            >
                Guardar nueva contraseña
            </button>

            {message && <p style={{ marginTop: 10 }}>{message}</p>}
        </div>
    );
}
