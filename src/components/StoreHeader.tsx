'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

function MobileMenu({ user, handleLogout }: { user: { role?: string } | null; handleLogout: () => void }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="sm:hidden relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                aria-label="Menú"
            >
                <span className="material-symbols-outlined text-slate-700">
                    {open ? 'close' : 'menu'}
                </span>
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    {/* Dropdown panel */}
                    <div className="absolute right-0 top-12 z-50 w-56 bg-white rounded-2xl shadow-2xl border border-primary/10 p-4 flex flex-col gap-2">
                        <Link
                            href="/collections"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">grid_view</span>
                            Productos
                        </Link>

                        {user?.role === 'admin' && (
                            <Link
                                href="/admin"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                Panel Admin
                            </Link>
                        )}

                        <div className="border-t border-primary/10 my-1" />

                        {user ? (
                            <>
                                <Link
                                    href="/orders"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                                    Mis Pedidos
                                </Link>
                                <button
                                    onClick={() => { setOpen(false); handleLogout(); }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">login</span>
                                    Login
                                </Link>
                                <Link
                                    href="/auth/register"
                                    onClick={() => setOpen(false)}
                                    className="gradient-bg text-white px-4 py-3 rounded-xl text-sm font-bold text-center shadow-md hover:opacity-90 transition-opacity"
                                >
                                    Registro
                                </Link>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

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
                        <h1 className="text-xl font-bold tracking-tight hidden md:block">E-Shop</h1>
                    </Link>
                    {/* Nav - Desktop (lg+) only */}
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link className="text-sm font-medium hover:text-primary transition-colors" href="/collections">Productos</Link>
                        {user?.role === 'admin' && (
                            <Link className="text-sm font-bold text-primary hover:opacity-80 transition-opacity" href="/admin">Panel Admin</Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {/* Cart */}
                    <Link href="/cart" className="p-2 hover:bg-primary/10 rounded-full transition-colors relative group">
                        <span className="material-symbols-outlined text-slate-700 group-hover:text-primary">shopping_bag</span>
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 size-4 bg-primary text-[10px] flex items-center justify-center rounded-full text-white font-bold animate-in zoom-in">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Auth - sm+ */}
                    {user ? (
                        <div className="hidden sm:flex items-center gap-4">
                            <Link
                                href="/orders"
                                className="text-sm font-semibold text-slate-700 hover:text-primary transition-colors"
                            >
                                Mis Pedidos
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-red-500/10 rounded-full transition-colors group"
                                title="Cerrar Sesión"
                            >
                                <span className="material-symbols-outlined text-slate-700 group-hover:text-red-500">logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-3">
                            <Link
                                href="/auth/login"
                                className="text-sm font-bold text-slate-700 hover:text-primary transition-colors"
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

                    {/* Hamburger - Mobile only */}
                    <MobileMenu user={user} handleLogout={handleLogout} />
                </div>
            </div>
        </header>
    );
}
