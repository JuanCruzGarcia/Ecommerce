'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/';

    const supabase = createSupabaseClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message === 'Invalid login credentials') {
                    throw new Error('Credenciales incorrectas. Por favor verifica tu email y contraseña.');
                }
                throw authError;
            }

            const userId = data.user.id;

            // Buscar el rol en profiles
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                // Si falla al obtener perfil, permitimos entrar igual (probablemente sea customer)
                // O podríamos bloquearlo si el rol es crítico. Asumimos customer.
            }

            if (profile?.role === 'admin') {
                router.push('/admin');
            } else {
                router.push(redirectUrl);
            }

            router.refresh();

        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error con Google');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">E</span>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Iniciar sesión
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    ¿No tienes una cuenta?{' '}
                    <Link href="/auth/register" className="font-medium text-black hover:underline">
                        Regístrate gratis
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contraseña
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Recordarme
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link
                                    href="/auth/forgot-password"
                                    className="font-medium text-black hover:text-gray-500"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {loading ? 'Iniciando sesión...' : 'Entrar'}
                            </button>
                        </div>
                    </form>

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
                </div>
            </div>
        </div>
    );
}
