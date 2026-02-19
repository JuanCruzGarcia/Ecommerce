'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Upload, Image as ImageIcon, CheckCircle, XCircle, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
}

interface ProductVariant {
    id?: string;
    product_id?: string;
    attributes: { [key: string]: string };
    price: number | null;
    stock: number;
    active: boolean;
}

interface Attribute {
    name: string;
    values: string[];
}

export default function EditProductPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const router = useRouter();
    const supabase = createSupabaseClient();

    // Estados del formulario
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<number | ''>(''); // Base price
    const [stock, setStock] = useState<number | ''>(''); // Global stock (if no variants)
    const [categoryId, setCategoryId] = useState('');
    const [active, setActive] = useState(true);

    // Estados de variantes
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [skuVariants, setSkuVariants] = useState<ProductVariant[]>([]);
    const [hasVariants, setHasVariants] = useState(false);

    // Estados de imagen
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Estados de carga
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Cargar categorías
    useEffect(() => {
        async function loadCategories() {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .order('name');

            if (data) setCategories(data);
        }
        loadCategories();
    }, [supabase]);

    // Cargar datos del producto y sus variantes
    useEffect(() => {
        if (!id) return;

        async function loadProduct() {
            setFetching(true);

            // 1. Cargar Producto
            const { data: product, error } = await supabase
                .from('products')
                .select('name, description, price, stock, category_id, active, image_url, variants')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error cargando producto:', error);
                alert('No se pudo encontrar el producto.');
                setFetching(false);
                return;
            }

            if (product) {
                setName(product.name);
                setDescription(product.description || '');
                setPrice(product.price);
                setStock(product.stock);
                setCategoryId(product.category_id);
                setActive(product.active ?? true);
                setCurrentImageUrl(product.image_url);

                // Cargar atributos (JSON)
                if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
                    setAttributes(product.variants);
                    setHasVariants(true);
                }
            }

            // 2. Cargar Variantes (SKUs)
            const { data: variantsData, error: variantsError } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', id);

            if (!variantsError && variantsData) {
                setSkuVariants(variantsData);
            }

            setFetching(false);
        }
        loadProduct();
    }, [id, supabase]);

    // Manejadores de Imagen
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { error } = await supabase.storage.from('products').upload(fileName, file);
        if (error) return null;
        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        return data.publicUrl;
    };

    // Manejadores de Variantes
    const addAttribute = () => {
        setAttributes([...attributes, { name: '', values: [] }]);
    };

    const updateAttributeName = (index: number, name: string) => {
        const newAttrs = [...attributes];
        newAttrs[index].name = name;
        setAttributes(newAttrs);
    };

    const addAttributeValue = (index: number, value: string) => {
        if (!value.trim()) return;
        const newAttrs = [...attributes];
        if (!newAttrs[index].values.includes(value)) {
            newAttrs[index].values.push(value);
            setAttributes(newAttrs);
        }
    };

    const removeAttributeValue = (attrIndex: number, valIndex: number) => {
        const newAttrs = [...attributes];
        newAttrs[attrIndex].values.splice(valIndex, 1);
        setAttributes(newAttrs);
    };

    const removeAttribute = (index: number) => {
        const newAttrs = [...attributes];
        newAttrs.splice(index, 1);
        setAttributes(newAttrs);
    };

    const generateCombinations = () => {
        if (attributes.length === 0) return;

        // Validar que todos los atributos tengan nombre y valores
        if (attributes.some(a => !a.name || a.values.length === 0)) {
            alert('Asegúrate de que todas las opciones tengan nombre y al menos un valor.');
            return;
        }

        // Generar producto cartesiano
        const combinations = attributes.reduce<any[]>((acc, attr) => {
            if (acc.length === 0) {
                return attr.values.map(val => ({ [attr.name]: val }));
            }
            return acc.flatMap(prev => attr.values.map(val => ({ ...prev, [attr.name]: val })));
        }, []);

        // Crear nuevas variantes preservando datos de las existentes si coinciden
        const newSkus = combinations.map(combo => {
            // Buscar si ya existe una variante con estos atributos
            const existing = skuVariants.find(v =>
                Object.keys(combo).length === Object.keys(v.attributes).length &&
                Object.keys(combo).every(k => v.attributes[k] === combo[k])
            );

            if (existing) return existing;

            return {
                attributes: combo,
                price: null, // null significa usar precio base
                stock: 0,
                active: true,
                product_id: id as string
            };
        });

        setSkuVariants(newSkus);
    };

    const handleSave = async () => {
        if (!name || (!hasVariants && (price === '' || stock === '')) || !categoryId) {
            alert('Por favor, completa nombre, precio, stock y categoría.');
            return;
        }

        setLoading(true);

        try {
            let imageUrl = currentImageUrl;

            if (imageFile) {
                const newImageUrl = await uploadImage(imageFile);
                if (!newImageUrl) throw new Error('Error subiendo imagen');
                imageUrl = newImageUrl;
            }

            // 1. Actualizar Producto BASE con JSON de atributos
            const { error: prodError } = await supabase
                .from('products')
                .update({
                    name: name.trim(),
                    description: description || null,
                    price: Number(price || 0),
                    stock: hasVariants ? skuVariants.reduce((acc, v) => acc + (v.stock || 0), 0) : Number(stock), // Suma de stock si hay variantes
                    category_id: categoryId,
                    image_url: imageUrl,
                    active,
                    variants: hasVariants ? attributes : [] // Guardar definición JSON
                })
                .eq('id', id);

            if (prodError) throw prodError;

            // 2. Actualizar Tabla de Variantes (SKUs)
            if (hasVariants) {
                // Primero upsert las variantes actuales
                const variantsToUpsert = skuVariants.map(v => ({
                    ...v,
                    product_id: id,
                    price: v.price === 0 || v.price === null ? null : v.price // Ensure null if empty/0
                }));

                const { error: variantError } = await supabase
                    .from('product_variants')
                    .upsert(variantsToUpsert, { onConflict: 'id' }); // Necesita que 'id' sea PK

                if (variantError) throw variantError;

                // Delete variants not in current skuVariants list if they have IDs
                const currentIds = skuVariants.map(v => v.id).filter(Boolean);
                if (currentIds.length > 0) {
                    // FIX: Using explicit filter string format for PostgreSQL `in` operator
                    const { error: deleteError } = await supabase
                        .from('product_variants')
                        .delete()
                        .eq('product_id', id)
                        .not('id', 'in', `(${currentIds.join(',')})`);

                    if (deleteError) throw deleteError;
                }
            } else {
                // Si se desactivaron variantes, borrar todo de product_variants
                await supabase.from('product_variants').delete().eq('product_id', id);
            }

            alert('¡Producto actualizado con éxito!');
            router.push('/admin/products');
            router.refresh();

        } catch (err: any) {
            console.error('Error saving:', err);
            alert(`Error al guardar: ${err.message || JSON.stringify(err)}`);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center">Cargando...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/products" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-xl font-bold text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] sm:max-w-md">
                                Editar {name}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSave} disabled={loading} className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md">
                                {loading ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Options */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6 space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Información Básica</h2>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                                    <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="Nombre del producto" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="Descripción..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none bg-white">
                                        <option value="">Seleccionar...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Variants & Stock Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h2 className="text-lg font-bold text-gray-900">Inventario y Variantes</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-600">¿Tiene variantes?</span>
                                    <button
                                        onClick={() => setHasVariants(!hasVariants)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${hasVariants ? 'bg-black' : 'bg-gray-200'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${hasVariants ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Base Attributes (Common) */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Base ($)</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                {!hasVariants && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Total</label>
                                        <input
                                            type="number"
                                            value={stock}
                                            onChange={e => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Variants Manager */}
                            {hasVariants && (
                                <div className="space-y-8 pt-4">
                                    {/* 1. Define Options */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">1. Definir Opciones</h3>
                                        <div className="space-y-3">
                                            {attributes.map((attr, idx) => (
                                                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                                                        <div className="sm:col-span-1">
                                                            <input
                                                                value={attr.name}
                                                                onChange={e => updateAttributeName(idx, e.target.value)}
                                                                placeholder="Ej. Talle"
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-3">
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {attr.values.map((val, vIdx) => (
                                                                    <span key={vIdx} className="inline-flex items-center gap-1 bg-white border border-gray-300 px-2 py-1 rounded text-sm text-gray-700">
                                                                        {val}
                                                                        <button onClick={() => removeAttributeValue(idx, vIdx)} className="hover:text-red-500"><XCircle className="w-3 h-3" /></button>
                                                                    </span>
                                                                ))}
                                                                <input
                                                                    placeholder="+ Valor (Enter)"
                                                                    className="bg-transparent text-sm min-w-[80px] outline-none placeholder-gray-400"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            addAttributeValue(idx, e.currentTarget.value);
                                                                            e.currentTarget.value = '';
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeAttribute(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={addAttribute} className="text-sm font-medium text-black hover:underline flex items-center gap-1">
                                                <Plus className="w-4 h-4" /> Agregar Opción
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Generate SKUs */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">2. Variantes de Stock</h3>
                                                {attributes.length > 0 && skuVariants.length === 0 && (
                                                    <span className="text-xs text-orange-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Genera las combinaciones</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={generateCombinations}
                                                className="text-sm flex items-center gap-2 bg-gray-100 text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors font-medium border border-gray-200"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                Actualizar Combinaciones
                                            </button>
                                        </div>

                                        {skuVariants.length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm">
                                                Configura las opciones arriba y haz clic en "Actualizar Combinaciones"
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                                        <tr>
                                                            <th className="px-4 py-3">Combinación</th>
                                                            <th className="px-4 py-3 w-32">Precio Override</th>
                                                            <th className="px-4 py-3 w-28">Stock</th>
                                                            <th className="px-4 py-3 w-20 text-center">Activo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {skuVariants.map((variant, idx) => (
                                                            <tr key={idx} className="bg-white hover:bg-gray-50">
                                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                                    {Object.entries(variant.attributes).map(([k, v]) => (
                                                                        <span key={k} className="inline-block bg-gray-100 border border-gray-200 rounded px-2 py-0.5 mr-2 text-xs">
                                                                            <span className="text-gray-500 mr-1">{k}:</span>{v}
                                                                        </span>
                                                                    ))}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="relative">
                                                                        <span className="absolute left-2 top-1.5 text-gray-400">$</span>
                                                                        <input
                                                                            type="number"
                                                                            value={variant.price === null ? '' : variant.price}
                                                                            onChange={(e) => {
                                                                                const newSkus = [...skuVariants];
                                                                                newSkus[idx].price = e.target.value === '' ? null : Number(e.target.value);
                                                                                setSkuVariants(newSkus);
                                                                            }}
                                                                            placeholder={price?.toString() || 'Base'}
                                                                            className="w-full pl-5 py-1 border rounded text-sm outline-none focus:border-black"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="number"
                                                                        value={variant.stock}
                                                                        onChange={(e) => {
                                                                            const newSkus = [...skuVariants];
                                                                            newSkus[idx].stock = Number(e.target.value);
                                                                            setSkuVariants(newSkus);
                                                                        }}
                                                                        className="w-full px-2 py-1 border rounded text-sm outline-none focus:border-black"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={variant.active}
                                                                        onChange={(e) => {
                                                                            const newSkus = [...skuVariants];
                                                                            newSkus[idx].active = e.target.checked;
                                                                            setSkuVariants(newSkus);
                                                                        }}
                                                                        className="w-4 h-4 text-black focus:ring-black rounded"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Estado */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-5">
                            <div
                                className={`flex items-center justify-between p-4 rounded-lg border ${active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} transition-all cursor-pointer`}
                                onClick={() => setActive(!active)}
                            >
                                <div className="flex items-center gap-3">
                                    {active ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-gray-500" />}
                                    <span className={`font-semibold ${active ? 'text-green-900' : 'text-gray-900'}`}>{active ? 'Activo' : 'Inactivo'}</span>
                                </div>
                                <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-5 space-y-4">
                            <h3 className="font-bold text-gray-900 text-sm">Imagen Principal</h3>
                            <div className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden relative group hover:border-black transition-colors">
                                {(imagePreview || currentImageUrl) ? (
                                    <>
                                        <img src={imagePreview || currentImageUrl || ''} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">Cambiar</div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <ImageIcon className="w-8 h-8 mb-2" />
                                        <span className="text-xs">Subir foto</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}