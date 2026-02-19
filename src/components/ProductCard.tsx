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
            className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] bg-gray-100 overflow-hidden">
                {/* Badge Categoría */}
                {product.categories?.[0]?.name && (
                    <span className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {product.categories[0].name}
                    </span>
                )}

                {/* Imágenes */}
                {mainImage ? (
                    <>
                        <img
                            src={mainImage}
                            alt={product.name}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                        />
                        <img
                            src={hoverImage || mainImage}
                            alt={product.name}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                        />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        No Image
                    </div>
                )}

                {/* Botón rápido (opcional, o solo dejar que click lleve al detalle) */}
                <div className={`absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300`}>
                    <button className="w-full bg-white text-black font-semibold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors">
                        <ShoppingBag className="w-4 h-4" />
                        Ver Producto
                    </button>
                </div>
            </Link>

            <div className="p-4">
                <Link href={`/product/${product.id}`}>
                    <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-gray-900">
                        ${product.price.toLocaleString('es-AR')}
                    </span>
                    {product.stock <= 0 && (
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
                            Agotado
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
