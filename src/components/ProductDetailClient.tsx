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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">
            {/* Gallery Section */}
            <div className="space-y-6">
                <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden relative group shadow-sm ring-1 ring-black/5">
                    <img
                        src={allImages[currentImageIndex]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {allImages.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                            <button
                                onClick={() => setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                                className="pointer-events-auto bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 -translate-x-4 group-hover:translate-x-0"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-900" />
                            </button>
                            <button
                                onClick={() => setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                                className="pointer-events-auto bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 translate-x-4 group-hover:translate-x-0"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-900" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {allImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`
                                    relative flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300
                                    ${currentImageIndex === idx
                                        ? 'border-gray-900 ring-2 ring-gray-900/10 ring-offset-2'
                                        : 'border-transparent opacity-70 hover:opacity-100'
                                    }
                                `}
                            >
                                <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="flex flex-col pt-2 lg:pt-0">
                <div className="mb-8 border-b border-gray-100 pb-8">
                    {product.categories?.[0] && (
                        <span className="text-sm font-semibold text-blue-600 tracking-wider uppercase mb-3 block">
                            {product.categories[0].name}
                        </span>
                    )}
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        {product.name}
                    </h1>

                    <div className="flex items-center gap-6 mt-6">
                        <span className="text-3xl font-bold text-gray-900">
                            ${currentPrice.toLocaleString('es-AR')}
                        </span>
                        {isOutOfStock ? (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full uppercase tracking-wide">
                                Sin Stock
                            </span>
                        ) : (
                            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                <span className="text-sm font-medium">Stock disponible</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="prose prose-lg text-gray-600 mb-10 leading-relaxed">
                    <p>{product.description}</p>
                </div>

                {/* Controls Section using a lighter styling container */}
                <div className="bg-white rounded-2xl space-y-8">
                    {/* Variants Selector */}
                    {hasVariants && (
                        <div className="space-y-6">
                            {product.variants.map((variantOption: any, idx: number) => (
                                <div key={idx}>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                                        {variantOption.name}: <span className="text-gray-500 font-normal normal-case ml-2">{selectedAttributes[variantOption.name]}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {variantOption.values.map((val: string) => {
                                            const isSelected = selectedAttributes[variantOption.name] === val;
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={() => handleAttributeSelect(variantOption.name, val)}
                                                    className={`
                                                        min-w-[4rem] px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200
                                                        ${isSelected
                                                            ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 transform scale-105'
                                                            : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    {val}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stock & Quantity */}
                    {!isOutOfStock && (
                        <div className="pt-6 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row gap-6">
                                {/* Quantity Selector */}
                                <div className="w-full sm:w-auto">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                                    <div className="flex items-center border border-gray-300 rounded-full w-fit">
                                        <button
                                            onClick={decreaseQuantity}
                                            disabled={quantity <= 1}
                                            className="p-3 hover:bg-gray-100 rounded-l-full disabled:opacity-50 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-12 text-center font-medium tabular-nums">{quantity}</span>
                                        <button
                                            onClick={increaseQuantity}
                                            disabled={quantity >= currentStock}
                                            className="p-3 hover:bg-gray-100 rounded-r-full disabled:opacity-50 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Add to Cart Button */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-transparent mb-2 select-none">Action</label>
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock || (hasVariants && !selectedVariant) || isAdding}
                                        className={`
                                             w-full py-3.5 px-6 rounded-full font-bold text-base flex items-center justify-center gap-3 transition-all duration-300
                                             ${isOutOfStock || (hasVariants && !selectedVariant)
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                                            }
                                         `}
                                    >
                                        {isAdding ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <ShoppingBag className="w-5 h-5" />
                                                {hasVariants && !selectedVariant
                                                    ? 'Selecciona opciones'
                                                    : 'Agregar al Carrito'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {hasVariants && selectedVariant && (
                                <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    Stock disponible: <span className="font-medium text-gray-900">{selectedVariant.stock}</span> unidades
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
