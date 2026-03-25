'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Plus, Minus, Trash2, X, Package, AlertCircle, Check } from 'lucide-react';

// --- Types ---

type ProductVariant = {
    id: string;
    product_id: string;
    attributes: { [key: string]: string };
    price: number | null;
    stock: number;
    active: boolean;
};

type Product = {
    id: string;
    name: string;
    price: number;
    stock: number;
    image_url: string | null;
    variants: any[]; // JSON definition of options (e.g. [{name: 'Size', values: ['S','M']}])
    product_variants: ProductVariant[]; // Joined table data
};

type CartItem = {
    uniqueId: string; // productId + variantId to handle keys
    product: Product;
    quantity: number;
    variantId?: string;
    attributes?: { [key: string]: string };
    price: number; // Final price (base or variant override)
    maxStock: number; // Stock limit for this specific item
};

export default function POSPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createSupabaseClient();

    // --- State ---
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Modal State for Variant Selection
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string }>({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Effects ---

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/');
                return;
            }
            fetchProducts();
        }
    }, [user, authLoading, router]);

    // Filtrar productos
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProducts(products);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(lowerTerm)
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    // --- Logic ---

    const fetchProducts = async () => {
        setLoading(true);
        // Fetch products AND their variants
        const { data, error } = await supabase
            .from('products')
            .select('*, product_variants(*)')
            .eq('active', true)
            .order('name');

        if (data) {
            setProducts(data);
            setFilteredProducts(data);
        }
        setLoading(false);
    };

    // --- Cart Actions ---

    // 1. Initial Click on Product Grid
    const handleProductClick = (product: Product) => {
        const hasVariants = product.variants && product.variants.length > 0;

        if (hasVariants) {
            // Open Modal
            setSelectedProduct(product);
            setSelectedAttributes({});
            setIsModalOpen(true);
        } else {
            // Add directly (Simple Product)
            addToCart(product, 1);
        }
    };

    // 2. Add to Cart Logic (Unified)
    const addToCart = (product: Product, qty: number, variantId?: string, attributes?: { [key: string]: string }, variantPrice?: number | null, variantStock?: number) => {
        const price = variantPrice ?? product.price;
        const maxStock = variantStock ?? product.stock;

        if (maxStock <= 0) return; // Should likely show error

        const uniqueId = variantId ? `${product.id}-${variantId}` : product.id;

        setCart(prev => {
            const existing = prev.find(item => item.uniqueId === uniqueId);
            if (existing) {
                if (existing.quantity >= maxStock) return prev; // Limit reached
                return prev.map(item =>
                    item.uniqueId === uniqueId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                uniqueId,
                product,
                quantity: qty,
                variantId,
                attributes,
                price,
                maxStock
            }];
        });
    };

    // 3. Confirm Variant Selection from Modal
    const confirmVariantSelection = () => {
        if (!selectedProduct) return;

        // Find matching variant SKU
        const match = selectedProduct.product_variants.find(v => {
            return Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value);
        });

        if (match) {
            addToCart(
                selectedProduct,
                1,
                match.id,
                selectedAttributes,
                match.price, // Can be null, addToCart handles it
                match.stock
            );
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        setSelectedAttributes({});
    };

    const removeFromCart = (uniqueId: string) => {
        setCart(prev => prev.filter(item => item.uniqueId !== uniqueId));
    };

    const updateQuantity = (uniqueId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.uniqueId === uniqueId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return item;
                    if (newQty > item.maxStock) return item;
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    // --- Helpers ---

    const getMatchingVariant = () => {
        if (!selectedProduct) return null;
        if (Object.keys(selectedAttributes).length !== selectedProduct.variants?.length) return null;

        return selectedProduct.product_variants.find(v =>
            Object.entries(selectedAttributes).every(([key, val]) => v.attributes[key] === val)
        );
    };

    const currentMatch = getMatchingVariant();
    const canAddVariant = !!currentMatch && currentMatch.stock > 0;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // --- Checkout ---

    const handleCheckout = async () => {
        if (!user || cart.length === 0) return;
        setProcessing(true);

        try {
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    total_amount: total,
                    status: 'completed', // POS orders are instant
                    shipping_name: 'Venta en Local',
                    shipping_address: 'Mostrador',
                    notes: `POS - Atendido por ${(user as any).email}`,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Insert Items (Include Variant ID)
            const orderItems = cart.map(item => {
                // Prepare item structure
                // Note: Ensure your 'order_items' table has 'variant_id' column if using variants
                const payload: any = {
                    order_id: order.id,
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.price
                };

                if (item.variantId) {
                    payload.variant_id = item.variantId;
                }

                return payload;
            });

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Stock Decrement (Important: Handle Variant Stock)
            // Use RPC for atomic operations if available, or manual update
            // Since we might not have a perfect RPC for variants yet, we iterate

            // OPTION A: If you have a robust 'confirm_order' RPC that handles variants:
            // await supabase.rpc('confirm_order', { p_order_id: order.id });

            // OPTION B: Manual Admin Update (Fast for POS)
            for (const item of cart) {
                if (item.variantId) {
                    await supabase.rpc('decrement_variant_stock', {
                        p_variant_id: item.variantId,
                        p_quantity: item.quantity
                    });
                } else {
                    await supabase.rpc('decrement_stock', {
                        product_id: item.product.id,
                        quantity: item.quantity
                    });
                }
            }

            // Fallback RPC usage if specific decrementers don't exist:
            const { error: rpcError } = await supabase.rpc('confirm_order', { p_order_id: order.id });
            // Ignore error if it's "function not found" but warn
            if (rpcError && !rpcError.message.includes('not found')) {
                console.warn('RPC confirm_order warning:', rpcError);
            }

            setSuccessMessage(`Venta registrada #${order.id.slice(0, 8)}`);
            setCart([]);
            fetchProducts();
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (error: any) {
            console.error('Error POS:', error);
            alert('Error al procesar: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (authLoading || (loading && products.length === 0)) {
        return <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500 font-medium">Cargando sistema POS...</div>;
    }

    return (
        <div className="flex relative h-[calc(100vh-64px)] bg-gray-50 overflow-hidden font-sans">
            {/* --- LEFT PANEL: PRODUCTS --- */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 min-w-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 flex-shrink-0 gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Punto de Venta</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Selecciona productos para agregar a la orden</p>
                    </div>
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all shadow-sm text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-gray-200">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {filteredProducts.map(product => {
                            const hasVariants = product.variants && product.variants.length > 0;
                            // Calculate total stock for display
                            const displayStock = hasVariants
                                ? product.product_variants.reduce((acc, v) => acc + (v.stock || 0), 0)
                                : product.stock;

                            return (
                                <button
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    disabled={displayStock <= 0}
                                    className={`group flex flex-col bg-white rounded-xl border transition-all duration-200 overflow-hidden text-left relative ${displayStock <= 0
                                        ? 'opacity-60 grayscale cursor-not-allowed border-gray-200'
                                        : 'border-gray-200 hover:border-black hover:shadow-lg hover:-translate-y-1'
                                        }`}
                                >
                                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                <Package className="w-10 h-10 opacity-50" />
                                            </div>
                                        )}
                                        {hasVariants && (
                                            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                OPCIONES
                                            </div>
                                        )}
                                        {displayStock <= 5 && displayStock > 0 && (
                                            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                                POCO STOCK
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="font-bold text-gray-900 line-clamp-2 text-sm leading-snug mb-2">{product.name}</h3>
                                        <div className="mt-auto flex items-end justify-between">
                                            <span className="font-extrabold text-lg">${product.price}</span>
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${displayStock > 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-500'}`}>
                                                {displayStock > 0 ? `${displayStock} un.` : 'Agotado'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Floating Cart Button for Mobile */}
            <button
                onClick={() => setIsCartOpen(true)}
                className="lg:hidden absolute bottom-6 right-6 z-20 bg-black text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105"
            >
                <div className="relative">
                    <ShoppingCart className="w-6 h-6" />
                    {cart.reduce((Acc, item) => Acc + item.quantity, 0) > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">
                            {cart.reduce((Acc, item) => Acc + item.quantity, 0)}
                        </span>
                    )}
                </div>
            </button>

            {/* Overlay background on mobile */}
            {isCartOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsCartOpen(false)}
                />
            )}

            {/* --- RIGHT PANEL: CART --- */}
            <div className={`absolute lg:static top-0 right-0 w-[85%] max-w-sm lg:w-96 bg-white lg:border-l lg:border-gray-200 flex flex-col h-full shadow-2xl z-40 transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                <div className="p-5 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" /> Orden Actual
                        </h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold bg-black text-white px-2 py-1 rounded-full text-xs">
                                {cart.reduce((Acc, item) => Acc + item.quantity, 0)} items
                            </span>
                            <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-1.5 bg-gray-100 rounded-full text-gray-500 hover:text-black">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <Package className="w-16 h-16 mb-4 stroke-1" />
                            <p className="text-sm font-medium">El carrito está vacío</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.uniqueId} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-gray-300 group">
                                <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-100">
                                    {item.product.image_url ? (
                                        <img src={item.product.image_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-6 h-6" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm truncate">{item.product.name}</h4>
                                        {item.attributes && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {Object.entries(item.attributes).map(([k, v]) => (
                                                    <span key={k} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                                                        {v}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                                            <button onClick={() => updateQuantity(item.uniqueId, -1)} className="p-1 hover:bg-white rounded-md text-gray-600 transition-colors"><Minus className="w-3 h-3" /></button>
                                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.uniqueId, 1)} disabled={item.quantity >= item.maxStock} className="p-1 hover:bg-white rounded-md text-gray-600 transition-colors disabled:opacity-30"><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">${item.price * item.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.uniqueId)} className="self-start text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-end mb-6">
                        <span className="text-gray-500 text-sm font-medium">Total a Pagar</span>
                        <span className="text-3xl font-black text-gray-900 tracking-tight">${total.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className={`w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all transform active:scale-[0.98] ${successMessage
                            ? 'bg-green-600 text-white shadow-green-200'
                            : processing || cart.length === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-black text-white hover:bg-gray-900 shadow-xl shadow-gray-200'
                            }`}
                    >
                        {processing ? 'Procesando...' : successMessage ? successMessage : 'Cobrar Orden'}
                    </button>
                    {cart.length > 0 && !processing && !successMessage && (
                        <button onClick={() => setCart([])} className="w-full text-center text-xs text-red-500 mt-3 hover:underline">Cancelar y limpiar</button>
                    )}
                </div>
            </div>

            {/* --- VARIANT SELECTION MODAL --- */}
            {isModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900">Seleccionar Opciones</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                    {selectedProduct.image_url && <img src={selectedProduct.image_url} className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 leading-tight">{selectedProduct.name}</h4>
                                    <p className="text-sm text-gray-500 mt-1">Precio Base: ${selectedProduct.price}</p>
                                </div>
                            </div>

                            {/* Selectors */}
                            {selectedProduct.variants?.map((attr: any, idx) => (
                                <div key={idx}>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{attr.name}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {attr.values.map((val: string) => {
                                            const isSelected = selectedAttributes[attr.name] === val;
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: val }))}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${isSelected
                                                        ? 'bg-black text-white border-black shadow-md'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {val}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Status */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                <div>
                                    <span className="text-xs text-gray-500 font-medium block">Precio Final</span>
                                    <span className="text-xl font-bold text-gray-900">
                                        ${currentMatch && currentMatch.price !== null ? currentMatch.price : selectedProduct.price}
                                    </span>
                                </div>
                                <div className="text-right">
                                    {currentMatch ? (
                                        currentMatch.stock > 0 ? (
                                            <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded-full">
                                                <Check className="w-3 h-3" /> {currentMatch.stock} en stock
                                            </span>
                                        ) : (
                                            <span className="text-red-500 font-bold text-sm bg-red-50 px-2 py-1 rounded-full">Agotado</span>
                                        )
                                    ) : (
                                        <span className="text-gray-400 text-sm italic">Selecciona opciones</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button onClick={closeModal} className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmVariantSelection}
                                disabled={!canAddVariant}
                                className="flex-[2] py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Agregar a la Orden
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
