'use client';

import { useCart, CartItem } from '@/contexts/CartContext';
import { useState } from 'react';

export default function AddToCartButton({ product }: { product: any }) {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            stock: product.stock,
        });

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (product.stock <= 0) {
        return (
            <button
                disabled
                className="mt-3 w-full bg-gray-200 text-gray-500 py-2 rounded-md font-medium cursor-not-allowed"
            >
                Sin stock
            </button>
        );
    }

    return (
        <button
            onClick={handleAdd}
            className={`mt-3 w-full py-2 rounded-md transition-all font-medium ${added
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
        >
            {added ? '¡Agregado!' : 'Agregar al carrito'}
        </button>
    );
}
