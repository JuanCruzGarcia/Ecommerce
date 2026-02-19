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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">E</span>
                        </div>
                        <span className="font-bold text-xl text-gray-900 hidden sm:block">Ecommerce</span>
                    </Link>

                    {/* Right side actions */}
                    <div className="flex items-center gap-6">
                        {/* Admin Link (only if admin) */}
                        {user?.role === 'admin' && (
                            <Link
                                href="/admin"
                                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                            >
                                Panel Admin
                            </Link>
                        )}

                        {/* Cart */}
                        <Link href="/cart" className="relative group">
                            <div className="p-2 text-gray-600 group-hover:text-black transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-black rounded-full min-w-[1.25rem]">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                        </Link>

                        {/* Auth */}
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 hidden sm:block">
                                    {user.role === 'admin' ? 'Admin' : 'Hola'}
                                </span>
                                <Link
                                    href="/orders"
                                    className="text-sm font-medium text-gray-900 hover:text-gray-600"
                                >
                                    Mis Pedidos
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-gray-900 hover:text-gray-600"
                                >
                                    Salir
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/auth/login"
                                    className="text-sm font-medium text-gray-900 hover:text-gray-600"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="text-sm font-medium bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
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
