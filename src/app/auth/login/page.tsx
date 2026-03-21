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
        <div className="bg-background-light min-h-screen flex items-center justify-center font-display">
            <div className="flex w-full min-h-screen overflow-hidden">
                {/* Left Panel: Brand & Visuals */}
                <div className="hidden lg:flex w-1/2 mesh-gradient relative flex-col justify-between p-16 text-white overflow-hidden">
                    {/* Abstract Mesh Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBZM6fDYL1ATA3lPS0em33XcnhYa04IVRQRBSRnQQMr70kriOSQi8dWY771VKe3S5O8CNjQ1ppl7KQbn5e7tc42zgaL4g7HlGsOrXvaeyNzoTa0yO8tI9qL0TjC3OlCiV37s9pBcz5wj7_r1X7Yrhz7Et6dPo5IekOaCCLv7fJxyqJF9PAVXsDJn248HudEj4j-Nzmb3C7rbpMKxmsDLpU6GzddyQOY_QdS5tN4fWpQJf2gdrNbBH9UHv54-xmU4fvJ_oep0H3eUxc')"}}></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20">
                                <svg className="size-8 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
                                </svg>
                            </div>
                            <span className="text-2xl font-black tracking-tighter">EXCELLENCE</span>
                        </div>
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h1 className="text-6xl font-black leading-tight tracking-tight">
                            Tu tienda <br/> premium online
                        </h1>
                        <p className="text-lg text-white/80 max-w-md font-medium">
                            Descubre la exclusividad en cada detalle. Accede a nuestra colección curada de productos de lujo.
                        </p>
                    </div>
                    <div className="relative z-10 flex gap-4 text-sm font-medium text-white/60">
                        <span>© 2024 Excellence Inc.</span>
                        <a className="hover:text-white" href="#">Privacidad</a>
                        <a className="hover:text-white" href="#">Términos</a>
                    </div>
                    {/* Glow Effect */}
                    <div className="absolute -bottom-20 -left-20 size-96 bg-primary/30 blur-[120px] rounded-full"></div>
                </div>

                {/* Right Panel: Login Form */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-8 md:p-20">
                    <div className="max-w-[440px] w-full space-y-8">
                        <div className="text-left space-y-2">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Bienvenido de nuevo</h2>
                            <p className="text-slate-500 font-medium">Ingresa tus credenciales para acceder a tu cuenta</p>
                        </div>
                        
                        <form className="space-y-5" onSubmit={handleLogin}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="email">Correo electrónico</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined">mail</span>
                                    </div>
                                    <input 
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 h-14 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400" 
                                        placeholder="nombre@ejemplo.com" 
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-bold text-slate-700" htmlFor="password">Contraseña</label>
                                    <Link className="text-sm font-semibold text-primary hover:underline" href="/auth/forgot-password">¿Olvidaste tu contraseña?</Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined">lock</span>
                                    </div>
                                    <input 
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-12 h-14 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400" 
                                        placeholder="••••••••" 
                                    />
                                    <button className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600:text-slate-200" type="button">
                                        <span className="material-symbols-outlined">visibility</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-1">
                                <input className="size-5 rounded border-slate-300 text-primary focus:ring-primary/30" id="remember" type="checkbox"/>
                                <label className="text-sm font-medium text-slate-600" htmlFor="remember">Recordarme</label>
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center h-14 bg-gradient-to-r from-primary to-[#4f06a8] hover:shadow-lg hover:shadow-primary/30 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                            </button>
                        </form>

                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium">O continuar con</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        {/* Social Login */}
                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full h-14 flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                            </svg>
                            <span className="text-slate-700 font-bold">Continuar con Google</span>
                        </button>



                        {/* Footer Link */}
                        <p className="text-center text-slate-600 font-medium">
                            ¿No tenés cuenta? <Link className="text-primary font-bold hover:underline" href="/auth/register">Registrate</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
