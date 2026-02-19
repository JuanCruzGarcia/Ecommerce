'use client';

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
    ArrowLeft,
    Save,
    Upload,
    X,
    Plus,
    Image as ImageIcon,
    Trash2,
    Loader2,
    AlertCircle,
    Package,
    Layers,
    Tags,
    DollarSign
} from 'lucide-react';

export default function NewProductPage() {
    const supabase = createSupabaseClient();
    const router = useRouter();

    // Estados del formulario
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState(''); // Stock Global (para productos simples)
    const [categories, setCategories] = useState<any[]>([]);
    const [categoryId, setCategoryId] = useState('');

    // Estados de imagen
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Estados Galería
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    // Estados Variantes
    interface VariantOption {
        name: string;
        values: string[];
    }

    interface VariantCombination {
        id: string; // Temporarily used for key
        attributes: { [key: string]: string };
        stock: number;
        price: number | null; // Optional override
    }

    const [variants, setVariants] = useState<VariantOption[]>([]);
    const [newVariantName, setNewVariantName] = useState('');
    const [newVariantValues, setNewVariantValues] = useState('');

    // Matriz de combinaciones generadas
    const [combinations, setCombinations] = useState<VariantCombination[]>([]);

    const [uploading, setUploading] = useState(false);

    // Refs
    const mainImageInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        supabase.from('categories').select('*').then(({ data }) => {
            if (data) setCategories(data);
        });
    }, []);

    // Regenerar combinaciones cada vez que cambian las variantes
    useEffect(() => {
        if (variants.length === 0) {
            setCombinations([]);
            return;
        }
        generateCombinations();
    }, [variants]);

    const generateCombinations = () => {
        // Función recursiva para producto cartesiano
        const cartesian = (args: string[][]): string[][] => {
            const r: string[][] = [];
            const max = args.length - 1;
            function helper(arr: string[], i: number) {
                for (let j = 0, l = args[i].length; j < l; j++) {
                    const a = arr.slice(0); // clone arr
                    a.push(args[i][j]);
                    if (i == max) r.push(a);
                    else helper(a, i + 1);
                }
            }
            helper([], 0);
            return r;
        };

        const valuesMatrix = variants.map(v => v.values);
        const combinationsStrings = cartesian(valuesMatrix);

        const newCombinations: VariantCombination[] = combinationsStrings.map((comboValues, idx) => {
            const attributes: { [key: string]: string } = {};
            variants.forEach((v, i) => {
                attributes[v.name] = comboValues[i];
            });

            // Intentar preservar stock/precio si ya existía esta combinacion (simple check)
            // Para una UX perfecta, deberíamos usar un ID determinístico basado en atributos
            return {
                id: `combo-${idx}`,
                attributes,
                stock: 0,
                price: null
            };
        });

        setCombinations(newCombinations);
    };

    const updateCombination = (index: number, field: 'stock' | 'price', value: string) => {
        const newCombos = [...combinations];
        const numValue = value === '' ? 0 : Number(value);

        if (field === 'price' && value === '') {
            newCombos[index].price = null;
        } else {
            // @ts-ignore
            newCombos[index][field] = numValue;
        }
        setCombinations(newCombos);
    };

    // ... lógica de imágenes existente ...
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setGalleryFiles(prev => [...prev, ...files]);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => setGalleryPreviews(prev => [...prev, reader.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };

    const removeGalleryImage = (index: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const addVariant = () => {
        if (!newVariantName.trim() || !newVariantValues.trim()) return;
        const values = newVariantValues.split(',').map(v => v.trim()).filter(v => v);
        if (values.length === 0) return;

        // Verificar si ya existe una variante con ese nombre
        if (variants.some(v => v.name.toLowerCase() === newVariantName.trim().toLowerCase())) {
            alert('Ya existe una variante con ese nombre');
            return;
        }

        setVariants(prev => [...prev, { name: newVariantName.trim(), values }]);
        setNewVariantName('');
        setNewVariantValues('');
    };

    const removeVariant = (index: number) => {
        setVariants(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { error } = await supabase.storage.from('products').upload(fileName, file);
        if (error) {
            console.error('Error uploading image:', error);
            return null;
        }
        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleCreate = async () => {
        // Validaciones: para stock global O combinaciones
        const totalStock = variants.length > 0
            ? combinations.reduce((acc, curr) => acc + curr.stock, 0)
            : Number(stock);

        if (!name || !price || !categoryId) {
            alert('Por favor, completa nombre, precio y categoría.');
            return;
        }

        setUploading(true);

        try {
            let imageUrl = null;
            const galleryUrls: string[] = [];

            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
                if (!imageUrl) throw new Error('Error al subir imagen principal');
            }

            for (const file of galleryFiles) {
                const url = await uploadImage(file);
                if (url) galleryUrls.push(url);
            }

            // 1. Crear Producto Padre
            const { data: productData, error: productError } = await supabase.from('products').insert({
                name,
                description: description || null,
                price: Number(price),
                stock: totalStock, // Suma total o stock simple
                category_id: categoryId,
                image_url: imageUrl,
                gallery_images: galleryUrls,
                variants: variants, // Guardamos la definición JSON para UI futura
                active: true,
            }).select().single();

            if (productError) throw productError;
            if (!productData) throw new Error('No se pudo crear el producto');

            // 2. Crear Variantes (si existen)
            if (variants.length > 0 && combinations.length > 0) {
                const variantsToInsert = combinations.map(combo => ({
                    product_id: productData.id,
                    attributes: combo.attributes,
                    stock: combo.stock,
                    price: combo.price ? combo.price : null, // null usará precio base
                    active: true
                }));

                const { error: variantsError } = await supabase
                    .from('product_variants')
                    .insert(variantsToInsert);

                if (variantsError) {
                    // Opcional: rollback (borrar producto) si fallan variantes
                    console.error('Error insertando variantes:', variantsError);
                    alert('Producto creado, pero hubo error al guardar stock de variantes.');
                }
            }

            router.push('/admin/products');
        } catch (err: any) {
            console.error('Error:', err);
            alert('Error al crear el producto: ' + (err.message || 'Error desconocido'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between mb-8 shadow-sm backdrop-blur-md bg-white/90">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Nuevo Producto</h1>
                        <p className="text-sm text-gray-500">Gestión de inventario y variantes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={uploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                    >
                        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar Producto</>}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Columna Izquierda (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Tarjeta: Información General */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            Información General
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Sneakers Urbanos XYZ"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    placeholder="Detalla las características principales del producto..."
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none min-h-[120px] placeholder:text-gray-400"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta: Variantes y Stock */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-gray-400" />
                                Variantes y Stock
                            </h2>
                        </div>

                        <div className="bg-blue-50/50 text-blue-800 text-sm p-4 rounded-lg mb-6 flex gap-3 border border-blue-100">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-600" />
                            <p>
                                Define opciones (Color, Talle) para gestionar stock diferenciado.
                                Si agregas variantes, el stock general se calculará automáticamente sumando las combinaciones.
                            </p>
                        </div>

                        {/* Input Variantes */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                                <div className="sm:col-span-4">
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block tracking-wide">Opción</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Color"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all"
                                        value={newVariantName}
                                        onChange={(e) => setNewVariantName(e.target.value)}
                                    />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block tracking-wide">Valores (sep. por coma)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Rojo, Azul, Negro"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all"
                                        value={newVariantValues}
                                        onChange={(e) => setNewVariantValues(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addVariant()}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <button
                                        onClick={addVariant}
                                        className="w-full py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" /> Agregar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista Variantes Definidas */}
                        {variants.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6 p-1">
                                {variants.map((v, idx) => (
                                    <div key={idx} className="inline-flex items-center bg-white border border-gray-200 pl-3 pr-2 py-1.5 rounded-full shadow-sm text-sm group hover:border-gray-300 transition-colors">
                                        <span className="font-semibold text-gray-900 mr-2">{v.name}:</span>
                                        <span className="text-gray-600 mr-2">{v.values.join(', ')}</span>
                                        <button
                                            onClick={() => removeVariant(idx)}
                                            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TABLA DE STOCK (Matriz) */}
                        {combinations.length > 0 ? (
                            <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200">
                                        <tr>
                                            <th className="px-5 py-3.5 w-1/2">Combinación</th>
                                            <th className="px-4 py-3.5 w-1/4">Stock</th>
                                            <th className="px-4 py-3.5 w-1/4">Precio (Opcional)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {combinations.map((combo, idx) => (
                                            <tr key={combo.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-5 py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(combo.attributes).map(([key, val]) => (
                                                            <span key={key} className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                                                                <span className="text-gray-400 mr-1.5 font-normal">{key}:</span>
                                                                {val}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 focus:border-black focus:ring-1 focus:ring-black outline-none text-sm text-center transition-all group-hover:bg-white"
                                                        value={combo.stock}
                                                        onChange={(e) => updateCombination(idx, 'stock', e.target.value)}
                                                        min="0"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1.5 text-gray-400 text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-1.5 focus:border-black focus:ring-1 focus:ring-black outline-none text-sm text-right transition-all group-hover:bg-white placeholder:text-gray-300"
                                                            placeholder={price ? `${price}` : 'Base'}
                                                            value={combo.price ?? ''}
                                                            onChange={(e) => updateCombination(idx, 'price', e.target.value)}
                                                            min="0"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                                    <Layers className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">No has definido variantes</p>
                                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                                    Agrega opciones arriba para generar la tabla de stock por combinaciones.
                                    Si no, se usará el stock simple.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Tarjeta: Galería de Imágenes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                                Galería de Imágenes
                            </h2>
                            <button onClick={() => galleryInputRef.current?.click()} className="text-sm text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors">
                                + Agregar fotos
                            </button>
                        </div>
                        <input ref={galleryInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryChange} />

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {galleryPreviews.map((src, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-all">
                                    <img src={src} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => removeGalleryImage(idx)}
                                            className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors transform scale-90 group-hover:scale-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => galleryInputRef.current?.click()}
                                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-gray-900 transition-all cursor-pointer group"
                            >
                                <Upload className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium text-center px-2">Subir fotos</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha (1/3) */}
                <div className="space-y-6">

                    {/* Tarjeta: Detalles Base */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Tags className="w-4 h-4 text-gray-400" />
                            Detalles
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white transition-all cursor-pointer hover:border-gray-300"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">
                                        <DollarSign className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Solo mostrar Stock General si NO hay combinaciones */}
                            {combinations.length === 0 && (
                                <div className="pt-2 border-t border-gray-100 mt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock General *</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Tarjeta: Imagen Principal - Dentro de la columna sticky */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Portada</h2>

                            <div
                                className={`aspect-square rounded-xl overflow-hidden border-2 ${imagePreview ? 'border-transparent shadow-md' : 'border-dashed border-gray-300'} bg-gray-50 relative group cursor-pointer hover:border-black transition-all`}
                                onClick={() => mainImageInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-medium bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1">
                                                <Upload className="w-3 h-3" /> Cambiar
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-gray-600 transition-colors">
                                        <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-medium">Subir imagen</p>
                                        <p className="text-xs text-gray-400 mt-1">Recomendado: 1000x1000px</p>
                                    </div>
                                )}
                                <input
                                    ref={mainImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
