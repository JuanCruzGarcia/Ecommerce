'use client';

import { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const supabase = createSupabaseClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Si el email está registrado, recibirás un enlace para restablecer tu contraseña.');
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4">Recuperar contraseña</h1>
            <p className="mb-4 text-gray-600">Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.</p>

            <form onSubmit={handleReset}>
                <input
                    type="email"
                    className="border p-2 w-full mb-4"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 w-full disabled:bg-gray-400"
                    disabled={loading}
                >
                    {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
            </form>

            {message && <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">{message}</div>}
            {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

            <div className="mt-4 text-center">
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                    Volver al inicio de sesión
                </Link>
            </div>
        </div>
    );
}
