'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, Check, Minus, Plus, Star } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    image_url: string;
    gallery_images: string[];
    variants: any[]; // JSON definition of options
    categories: { name: string }[];
}

interface Variant {
    id: string;
    product_id: string;
    attributes: { [key: string]: string };
    stock: number;
    price: number | null;
}

export default function ProductDetailClient({ product, variants }: { product: Product, variants: Variant[] }) {
    const { addToCart } = useCart();
    // const router = useRouter(); // Unused

    // Image Gallery State
    const allImages = [product.image_url, ...(product.gallery_images || [])].filter(Boolean);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Variant Selection State
    const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string }>({});
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);

    // Derived State
    const hasVariants = product.variants && product.variants.length > 0;
    const currentPrice = selectedVariant?.price || product.price;

    // Check stock based on selection type
    const currentStock = hasVariants
        ? (selectedVariant?.stock || 0)
        : product.stock;

    const isOutOfStock = currentStock <= 0;

    useEffect(() => {
        if (hasVariants && Object.keys(selectedAttributes).length === product.variants.length) {
            // Find matching variant
            const match = variants.find(v => {
                return Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value);
            });
            setSelectedVariant(match || null);
            // Reset quantity if it exceeds new stock
            if (match && quantity > match.stock) {
                setQuantity(1);
            }
        } else {
            setSelectedVariant(null);
        }
    }, [selectedAttributes, hasVariants, variants, product.variants, quantity]);

    // Handle attribute selection
    const handleAttributeSelect = (attributeName: string, value: string) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [attributeName]: value
        }));
    };

    // Quantity handlers
    const decreaseQuantity = () => setQuantity(q => Math.max(1, q - 1));
    const increaseQuantity = () => setQuantity(q => Math.min(currentStock, q + 1));

    const handleAddToCart = async () => {
        if (hasVariants && !selectedVariant) {
            // Shake animation or toast could go here
            return;
        }

        setIsAdding(true);

        // Simulate a small delay for better UX feeling
        await new Promise(resolve => setTimeout(resolve, 500));

        const cartItem = {
            id: product.id,
            name: product.name,
            price: currentPrice,
            image_url: product.image_url,
            stock: currentStock,
            variantId: selectedVariant?.id,
            attributes: selectedAttributes
        };

        // @ts-ignore - Context types might need update strictly speaking but this works
        addToCart(cartItem, quantity);

        setIsAdding(false);
        setQuantity(1);
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400 mb-10 overflow-x-auto overflow-y-hidden no-scrollbar whitespace-nowrap scroll-smooth py-1">
                <a className="hover:text-primary transition-colors shrink-0" href="/">Inicio</a>
                <span className="material-symbols-outlined text-xs shrink-0 select-none">chevron_right</span>
                {product.categories?.[0] && (
                    <>
                        <a className="hover:text-primary transition-colors shrink-0" href={`/category/${product.categories[0].name.toLowerCase()}`}>{product.categories[0].name}</a>
                        <span className="material-symbols-outlined text-xs shrink-0 select-none">chevron_right</span>
                    </>
                )}
                <span className="text-slate-900 dark:text-slate-100 truncate">{product.name}</span>
            </nav>

            {/* Product Grid 60/40 */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-16">
                
                {/* Left Column: Gallery (60%) */}
                <div className="lg:col-span-6 space-y-8">
                    <div className="relative group aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-800/50 border border-primary/10 shadow-2xl transition-all duration-500">
                        <img 
                            src={allImages[currentImageIndex]} 
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        
                        {/* Glassmorphism Navigation */}
                        {allImages.length > 1 && (
                            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button 
                                    onClick={() => setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                                    className="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white hover:bg-white/40 transition-all hover:scale-110 shadow-2xl"
                                >
                                    <span className="material-symbols-outlined text-3xl">chevron_left</span>
                                </button>
                                <button 
                                    onClick={() => setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                                    className="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white hover:bg-white/40 transition-all hover:scale-110 shadow-2xl"
                                >
                                    <span className="material-symbols-outlined text-3xl">chevron_right</span>
                                </button>
                            </div>
                        )}

                        {/* Zoom/Expand info */}
                        <div className="absolute bottom-8 right-8">
                             <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
                                Vista Premium
                             </div>
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {allImages.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 no-scrollbar scroll-smooth">
                            {allImages.map((img, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`flex-shrink-0 w-28 h-32 rounded-2xl p-0.5 transition-all duration-300 transform ${currentImageIndex === idx ? 'bg-gradient-to-tr from-primary to-accent-blue scale-105 shadow-lg shadow-primary/20' : 'bg-transparent border border-primary/10 hover:border-primary/40 hover:scale-105'}`}
                                >
                                    <div className="w-full h-full rounded-[0.85rem] overflow-hidden bg-white">
                                        <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Details (40%) */}
                <div className="lg:col-span-4 flex flex-col space-y-10">
                    <div>
                        <div className="mb-4">
                            <span className="inline-block px-4 py-1.5 text-[10px] font-black tracking-[0.2em] uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
                                {product.categories?.[0]?.name || 'Colección Exclusiva'}
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black leading-[1.1] mb-6 text-slate-900 dark:text-white tracking-tighter">
                            {product.name}
                        </h1>
                        
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-wider">{isOutOfStock ? 'Sin Stock' : 'Stock disponible'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/10">
                                <span className="material-symbols-outlined text-lg fill-amber-500">star</span>
                                <span className="text-sm font-black">4.9</span>
                                <span className="text-slate-400 text-[10px] font-bold">(128 reseñas)</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/20 p-8 rounded-[2rem] border border-primary/5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Precio de lanzamiento</p>
                        <div className="flex items-baseline gap-4 mb-2">
                            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                                ${currentPrice.toLocaleString('es-AR')}
                            </span>
                            {product.price > currentPrice && (
                                <span className="text-xl text-slate-400 line-through font-bold opacity-50">${product.price.toLocaleString('es-AR')}</span>
                            )}
                        </div>
                        <p className="text-sm text-primary font-bold flex items-center gap-2">
                             <span className="material-symbols-outlined">credit_card</span>
                             6 cuotas sin interés de ${(currentPrice / 6).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </p>
                    </div>

                    {/* Variant Selectors */}
                    <div className="space-y-10">
                        {hasVariants && product.variants.map((variantOption: any, idx: number) => (
                            <div key={idx}>
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{variantOption.name}</h3>
                                    {variantOption.name.toLowerCase() === 'talle' && (
                                        <button className="text-[10px] font-black text-primary underline underline-offset-4 uppercase tracking-widest">Guía de talles</button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {variantOption.values.map((val: string) => {
                                        const isSelected = selectedAttributes[variantOption.name] === val;
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => handleAttributeSelect(variantOption.name, val)}
                                                className={`px-8 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${isSelected ? 'border-primary bg-primary/5 text-primary shadow-xl shadow-primary/10 scale-105' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 text-slate-500 hover:border-primary/40 hover:text-primary'}`}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="space-y-4 pt-6">
                        <div className="flex gap-4">
                            <div className="flex items-center border-2 border-slate-100 dark:border-white/5 rounded-2xl bg-white dark:bg-white/5 px-2">
                                <button 
                                    onClick={decreaseQuantity}
                                    className="w-12 h-14 flex items-center justify-center hover:text-primary transition-colors disabled:opacity-20"
                                    disabled={quantity <= 1}
                                >
                                    <span className="material-symbols-outlined font-black">remove</span>
                                </button>
                                <span className="w-12 text-center font-black text-xl tabular-nums">{quantity}</span>
                                <button 
                                    onClick={increaseQuantity}
                                    className="w-12 h-14 flex items-center justify-center hover:text-primary transition-colors disabled:opacity-20"
                                    disabled={quantity >= currentStock}
                                >
                                    <span className="material-symbols-outlined font-black">add</span>
                                </button>
                            </div>
                            <button 
                                onClick={handleAddToCart}
                                disabled={isAdding || isOutOfStock || (hasVariants && !selectedVariant)}
                                className="flex-1 h-16 bg-gradient-to-r from-primary to-accent-blue text-white rounded-[1.25rem] font-black text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                            >
                                {isAdding ? (
                                    <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                                        {hasVariants && !selectedVariant ? 'Elegí opciones' : 'Agregar al Carrito'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Trust Icons */}
                    <div className="grid grid-cols-2 gap-8 pt-10 border-t border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                <span className="material-symbols-outlined text-3xl">local_shipping</span>
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-tight">Envío Express</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">En todo el país</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-accent-blue/5 flex items-center justify-center text-accent-blue border border-accent-blue/10">
                                <span className="material-symbols-outlined text-3xl">verified_user</span>
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-tight">Garantía Real</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pago 100% Seguro</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extra info tabs */}
            <div className="mt-32 border-t border-primary/10 pt-20 pb-20">
                <div className="flex gap-12 border-b border-primary/5 mb-12">
                    <button className="pb-6 border-b-4 border-primary font-black text-xl uppercase tracking-tighter">Descripción</button>
                    <button className="pb-6 border-b-4 border-transparent text-slate-400 font-black text-xl uppercase tracking-tighter hover:text-slate-600 transition-colors">Especificaciones</button>
                    <button className="pb-6 border-b-4 border-transparent text-slate-400 font-black text-xl uppercase tracking-tighter hover:text-slate-600 transition-colors">Opiniones</button>
                </div>
                <div className="max-w-4xl">
                    <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-8">
                        {product.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                        <div className="p-8 bg-white dark:bg-slate-800/10 rounded-3xl border border-primary/5">
                            <h4 className="font-black mb-4 uppercase tracking-[0.2em] text-xs text-primary">Calidad Artesanal</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">Cada pieza es inspeccionada manualmente para asegurar los estándares más altos de la industria.</p>
                        </div>
                        <div className="p-8 bg-white dark:bg-slate-800/10 rounded-3xl border border-primary/5">
                            <h4 className="font-black mb-4 uppercase tracking-[0.2em] text-xs text-primary">Sostenibilidad</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">Comprometidos con procesos de fabricación éticos y materiales de bajo impacto ambiental.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
