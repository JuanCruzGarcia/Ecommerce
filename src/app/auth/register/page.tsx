'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const supabase = createSupabaseClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            // Redirigir al login o dashboard con mensaje de éxito (pendiente confirmar si requiere validación de email)
            // Por defecto Supabase requiere validación de email, asumiremos que va al login
            router.push('/auth/login?registered=true');

        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al registrarse');
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
                    // En registro también redirigimos al callback
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error con Google');
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light font-display antialiased">
            <div className="flex h-screen w-full overflow-hidden">
                {/* Left Panel: Gradient & Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 mesh-gradient">
                    {/* Abstract Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDi8mnJSVjtrE4i-hGQykmRhDVYlciJuZQ8EmO0GqDSMiS841MhUqfVfH6e79q_7QzwV-gHt8jtY_0WBn8kipCWEgcsTEcwjQO68krPJGk2Is96PFMT_73dmJZ2yh8ivt6HWghpHgbtuq-av_4uCPI3nAflTkYgW6NwXUYB40DpMx65whub0C1UXkIBlsmIcww8cd87Mx75VaW5QYN7oKVk7r4vOBxPco4HJNIdQVxWQzzZF3ShEabFUiz2v4MwX0RD-RuMxZrjrVU')", backgroundBlendMode: 'overlay', backgroundSize: 'cover'}}></div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Glowing Logo */}
                        <div className="mb-6 flex items-center justify-center size-20 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                            <span className="material-symbols-outlined text-white text-5xl">location_on</span>
                        </div>
                        <h2 className="text-white text-3xl font-bold mb-3">Bienvenido a DISTRIPHONE</h2>
                        <p className="text-white/80 text-lg max-w-md">
                            Descubre una experiencia de compra exclusiva con los mejores productos seleccionados para ti.
                        </p>
                    </div>
                    {/* Bottom Accent */}
                    <div className="absolute bottom-12 left-12 right-12 z-10 flex justify-between items-center text-white/60 text-sm">
                        <span>© 2026 DISTRIPHONE.</span>
                        <div className="flex gap-4">
                            <a className="hover:text-white transition-colors" href="#">Privacidad</a>
                            <a className="hover:text-white transition-colors" href="#">Términos</a>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Registration Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center overflow-y-auto p-6 sm:p-8 lg:p-12 bg-white">
                    <div className="w-full max-w-[440px] flex flex-col gap-5 my-auto">
                        {/* Heading */}
                        <div className="flex flex-col gap-1">
                            <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight">
                                Crear Cuenta
                            </h1>
                            <p className="text-slate-500 text-sm">
                                Únete a nuestra comunidad exclusiva y empieza a comprar.
                            </p>
                        </div>
                        
                        {/* Registration Form */}
                        <form className="flex flex-col gap-5" onSubmit={handleRegister}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {/* Email */}
                            <div className="flex flex-col gap-2">
                                <label className="text-slate-700 text-sm font-semibold px-1">Email</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-slate-400">mail</span>
                                    <input 
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900" 
                                        placeholder="ejemplo@correo.com" 
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-2">
                                <label className="text-slate-700 text-sm font-semibold px-1">Contraseña</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-slate-400">lock</span>
                                    <input 
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900" 
                                        placeholder="••••••••" 
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-2">
                                <label className="text-slate-700 text-sm font-semibold px-1">Confirmar Contraseña</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-slate-400">lock_reset</span>
                                    <input 
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900" 
                                        placeholder="••••••••" 
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full h-12 rounded-xl gradient-bg hover:opacity-90 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px grow bg-slate-200"></div>
                            <span className="text-slate-400 text-sm font-medium">O regístrate con</span>
                            <div className="h-px grow bg-slate-200"></div>
                        </div>

                        {/* Google Sign In */}
                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50:bg-slate-700 transition-colors text-slate-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                            </svg>
                            Google
                        </button>

                        {/* Footer Link */}
                        <p className="text-center text-slate-600 text-sm">
                            ¿Ya tenés cuenta?{' '}
                            <Link className="text-primary font-bold hover:underline decoration-2 underline-offset-4" href="/auth/login">Iniciar Sesión</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
