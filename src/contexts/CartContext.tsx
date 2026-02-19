'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CartItem = {
    id: string; // Product ID
    variantId?: string; // Variant ID (if applicable)
    name: string;
    price: number;
    quantity: number;
    image_url: string | null;
    stock: number;
    attributes?: { [key: string]: string }; // e.g. { Color: "Red", Size: "M" }
};

type CartContextType = {
    items: CartItem[];
    addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    removeFromCart: (id: string, variantId?: string) => void;
    updateQuantity: (id: string, quantity: number, variantId?: string) => void;
    clearCart: () => void;
    total: number;
    cartCount: number;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ecommerce_cart';

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
            try {
                setItems(JSON.parse(storedCart));
            } catch (error) {
                console.error('Error parsing cart from localStorage:', error);
            }
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, isMounted]);

    const addToCart = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
        setItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex(
                (item) => item.id === product.id && item.variantId === product.variantId
            );

            if (existingItemIndex > -1) {
                const newItems = [...prevItems];
                const existingItem = newItems[existingItemIndex];
                const newQuantity = existingItem.quantity + quantity;

                // Check stock limit (simple check)
                if (newQuantity > product.stock) {
                    // Could add toast here
                    console.warn('Not enough stock');
                    return prevItems;
                }

                newItems[existingItemIndex] = { ...existingItem, quantity: newQuantity };
                return newItems;
            } else {
                return [...prevItems, { ...product, quantity }];
            }
        });
        setIsOpen(true);
    };

    const removeFromCart = (id: string, variantId?: string) => {
        setItems((prevItems) => prevItems.filter((item) => !(item.id === id && item.variantId === variantId)));
    };

    const updateQuantity = (id: string, quantity: number, variantId?: string) => {
        if (quantity < 1) return;
        setItems((prevItems) =>
            prevItems.map((item) =>
                (item.id === id && item.variantId === variantId)
                    ? { ...item, quantity: Math.min(quantity, item.stock) }
                    : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                total,
                cartCount,
                isOpen,
                setIsOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
