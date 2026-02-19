'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';

type Category = {
    id: string;
    name: string;
    created_at: string;
};

export default function AdminCategoriesPage() {
    const supabase = createSupabaseClient();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estado para crear categoría inline
    const [newCategoryName, setNewCategoryName] = useState('');
    const [creating, setCreating] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);

    // Estado para editar
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (!error) setCategories(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async () => {
        if (!newCategoryName.trim()) return;

        setCreating(true);
        const { error } = await supabase
            .from('categories')
            .insert({ name: newCategoryName.trim() });

        if (!error) {
            setNewCategoryName('');
            setShowCreateInput(false);
            fetchCategories();
        } else {
            alert('Error al crear la categoría');
        }
        setCreating(false);
    };

    const handleUpdate = async (id: string) => {
        if (!editingName.trim()) return;

        const { error } = await supabase
            .from('categories')
            .update({ name: editingName.trim() })
            .eq('id', id);

        if (!error) {
            setEditingId(null);
            setEditingName('');
            fetchCategories();
        } else {
            alert('Error al actualizar la categoría');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) return;

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchCategories();
        } else {
            alert('Error al eliminar. Puede que haya productos asociados.');
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {categories.length} categoría{categories.length !== 1 ? 's' : ''} en total
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateInput(true)}
                    className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva categoría
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-6">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar categorías..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>

            {/* Formulario inline para crear */}
            {showCreateInput && (
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Nombre de la categoría"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                            autoFocus
                        />
                        <button
                            onClick={handleCreate}
                            disabled={creating || !newCategoryName.trim()}
                            className="bg-black text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            {creating ? 'Creando...' : 'Crear'}
                        </button>
                        <button
                            onClick={() => {
                                setShowCreateInput(false);
                                setNewCategoryName('');
                            }}
                            className="text-gray-500 hover:text-gray-700 px-3 py-2.5 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de categorías */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                        <p className="mt-3 text-gray-500">Cargando categorías...</p>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <p className="mt-3 text-gray-500">
                            {searchTerm ? 'No se encontraron categorías' : 'No hay categorías aún'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setShowCreateInput(true)}
                                className="inline-block mt-4 text-black font-medium hover:underline"
                            >
                                Crear la primera categoría →
                            </button>
                        )}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {filteredCategories.map((category) => (
                            <li key={category.id} className="hover:bg-gray-50 transition-colors">
                                {editingId === category.id ? (
                                    // Modo edición
                                    <div className="flex items-center gap-3 px-6 py-4">
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate(category.id)}
                                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleUpdate(category.id)}
                                            className="text-sm font-medium text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                                        >
                                            Guardar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditingName('');
                                            }}
                                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    // Modo visualización
                                    <div className="flex items-center justify-between px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                <span className="text-lg font-semibold text-gray-600">
                                                    {category.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-medium text-gray-900">{category.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingId(category.id);
                                                    setEditingName(category.name);
                                                }}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id, category.name)}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
