'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function StoreHeader() {
    const { cartCount } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createSupabaseClient();


    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-header border-b border-primary/10 transition-all">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                        <div className="size-10 gradient-bg rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                            <span className="text-2xl font-black">E</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight hidden md:block dark:text-white">E-Shop</h1>
                    </Link>
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link className="text-sm font-medium hover:text-primary transition-colors dark:text-slate-300" href="/collections">Colecciones</Link>
                        <Link className="text-sm font-medium hover:text-primary transition-colors dark:text-slate-300" href="/offers">Ofertas</Link>
                        {user?.role === 'admin' && (
                            <Link className="text-sm font-bold text-primary hover:opacity-80 transition-opacity" href="/admin">Panel Admin</Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    {/* Search (visual for now) */}
                    <div className="hidden md:flex items-center bg-primary/10 rounded-full px-4 py-2 border border-primary/20 w-64 group focus-within:w-80 transition-all duration-300">
                        <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                        <input 
                            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-500 dark:text-white" 
                            placeholder="Buscar productos..." 
                            type="text"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Cart */}
                        <Link href="/cart" className="p-2 hover:bg-primary/10 rounded-full transition-colors relative group">
                            <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 group-hover:text-primary">shopping_bag</span>
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 size-4 bg-primary text-[10px] flex items-center justify-center rounded-full text-white font-bold animate-in zoom-in">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Auth */}
                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/orders"
                                    className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
                                >
                                    Mis Pedidos
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 hover:bg-red-500/10 rounded-full transition-colors group"
                                    title="Cerrar Sesión"
                                >
                                    <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 group-hover:text-red-500">logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/auth/login"
                                    className="hidden sm:block text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="gradient-bg text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
                                >
                                    Registro
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
