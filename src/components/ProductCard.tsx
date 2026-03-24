'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        price: number;
        description: string | null;
        image_url: string | null;
        gallery_images: string[] | null;
        stock: number;
        categories: { name: string }[] | null;
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Determinar imagen a mostrar (swap on hover)
    const mainImage = product.image_url;
    const hoverImage = product.gallery_images && product.gallery_images.length > 0
        ? product.gallery_images[0]
        : mainImage;

    return (
        <div 
            className="group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/product/${product.id}`} className="block">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-4 bg-slate-100">
                    {/* Badge Categoría */}
                    {product.categories?.[0]?.name && (
                        <span className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                            {product.categories[0].name}
                        </span>
                    )}

                    {/* Imágenes con efecto Premium */}
                    {mainImage ? (
                        <div className="w-full h-full relative">
                            <img
                                src={mainImage}
                                alt={product.name}
                                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${isHovered ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}
                            />
                            <img
                                src={hoverImage || mainImage}
                                alt={product.name}
                                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${isHovered ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <span className="material-symbols-outlined text-4xl">image</span>
                        </div>
                    )}

                    {/* Overlay Action */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 lg:p-6 z-10">
                        <button className="w-full bg-white text-black py-2.5 lg:py-3 rounded-full text-sm lg:text-base font-bold flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl">
                            <span className="material-symbols-outlined text-xl">visibility</span>
                            Ver Detalles
                        </button>
                    </div>

                    {/* Wishlist Button */}
                    <button className="absolute top-4 right-4 z-20 size-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-primary transition-colors">
                        <span className="material-symbols-outlined text-xl">favorite</span>
                    </button>
                </div>

                <div className="space-y-1">
                    <h3 className="font-bold text-sm lg:text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                    </h3>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                        <p className="text-primary font-black animate-in fade-in zoom-in text-base lg:text-xl">
                            ${product.price.toLocaleString('es-AR')}
                        </p>
                        {product.stock <= 0 ? (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full uppercase">Sin Stock</span>
                        ) : (
                            <p className="text-slate-500 text-xs font-medium">6 cuotas sin interés</p>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
