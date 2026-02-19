'use client';

import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import StoreHeader from '@/components/StoreHeader';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <StoreHeader />
                <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag className="w-10 h-10 text-gray-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Tu carrito está vacío</h1>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Parece que aún no has agregado productos. Explora nuestra colección y encuentra algo que te encante.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-black/10"
                    >
                        Volver a la tienda
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
                <div className="flex items-baseline justify-between mb-8 border-b border-gray-200 pb-4">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Tu Carrito</h1>
                    <span className="text-gray-500 font-medium">{items.length} productos</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
                    {/* Lista de items */}
                    <div className="lg:col-span-8 space-y-6">
                        {items.map((item) => (
                            <div
                                key={`${item.id}-${item.variantId || 'default'}`}
                                className="bg-white rounded-2xl p-4 sm:p-6 flex gap-4 sm:gap-6 shadow-sm border border-gray-100 transition-all hover:shadow-md"
                            >
                                {/* Imagen del Producto */}
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ShoppingBag className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Detalles del Producto */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>

                                            {/* Variantes */}
                                            {item.attributes && Object.keys(item.attributes).length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {Object.entries(item.attributes).map(([key, value]) => (
                                                        <span
                                                            key={key}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 uppercase tracking-wide"
                                                        >
                                                            <span className="opacity-60 mr-1">{key}:</span> {value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-2 text-sm font-medium text-gray-500">
                                                ${item.price.toLocaleString('es-AR')}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id, item.variantId)}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                                            title="Eliminar producto"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Controles de Cantidad y Subtotal */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-50">

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center border border-gray-200 rounded-full bg-white shadow-sm">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                                                    className="p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-l-full transition-colors disabled:opacity-30"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center font-semibold text-sm tabular-nums text-gray-900">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                                                    className="p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-r-full transition-colors disabled:opacity-30"
                                                    disabled={item.quantity >= item.stock}
                                                    title={item.quantity >= item.stock ? "Stock máximo alcanzado" : ""}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Aviso de Stock Excesivo */}
                                            {item.quantity >= item.stock && (
                                                <span className="text-xs text-orange-500 font-medium">Máx. disponible</span>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Subtotal</span>
                                            <p className="font-bold text-xl text-gray-900">
                                                ${(item.price * item.quantity).toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={clearCart}
                                className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Vaciar todo el carrito
                            </button>
                        </div>
                    </div>

                    {/* Resumen Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen del pedido</h2>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">${total.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Envío</span>
                                    <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full text-sm">Gratis</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-baseline">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                                        ${total.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>

                            <Link
                                href="/checkout"
                                className="block w-full bg-black text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all hover:-translate-y-1 shadow-xl shadow-black/10 flex items-center justify-center gap-2 group"
                            >
                                Proceder al Pago
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>

                            <div className="mt-6 text-center">
                                <Link
                                    href="/"
                                    className="text-gray-500 hover:text-black font-medium text-sm transition-colors border-b border-transparent hover:border-black pb-0.5"
                                >
                                    Seguir comprando
                                </Link>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-center gap-4 text-gray-400">
                                    {/* Iconos de tarjetas o seguridad simples */}
                                    <div className="w-8 h-5 bg-gray-100 rounded"></div>
                                    <div className="w-8 h-5 bg-gray-100 rounded"></div>
                                    <div className="w-8 h-5 bg-gray-100 rounded"></div>
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-2">Pagos 100% Seguros</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
