// src/app/admin/templates/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileText, Plus, Trash2, Check, Edit2 } from 'lucide-react';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Array<{ id: string; title: string; content: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const fetchTemplates = async () => {
        try {
            const q = query(collection(db, 'templates'), orderBy('title'));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setTemplates(data);
        } catch (e) {
            console.error('Error loading templates', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleCreate = async () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, 'templates'), {
                title: newTitle.trim(),
                content: newContent.trim(),
            });
            setTemplates(prev => [...prev, { id: docRef.id, title: newTitle.trim(), content: newContent.trim() }]);
            setNewTitle('');
            setNewContent('');
            setMessage('Plantilla creada');
        } catch (e) {
            console.error('Error creating template', e);
            setMessage('Error al crear plantilla');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta plantilla?')) return;
        try {
            await deleteDoc(doc(db, 'templates', id));
            setTemplates(prev => prev.filter(t => t.id !== id));
            setMessage('Plantilla eliminada');
        } catch (e) {
            console.error('Error deleting template', e);
            setMessage('Error al eliminar');
        } finally {
            setTimeout(() => setMessage(null), 3000);
        }
    };

    // --- Edit handling ---
    const startEdit = (template: { id: string; title: string; content: string }) => {
        setEditingId(template.id);
        setNewTitle(template.title);
        setNewContent(template.content);
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        if (!newTitle.trim() || !newContent.trim()) return;
        setSaving(true);
        try {
            await fetch(`/api/templates/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() }),
            });
            setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, title: newTitle.trim(), content: newContent.trim() } : t));
            setMessage('Plantilla actualizada');
            setEditingId(null);
            setNewTitle('');
            setNewContent('');
        } catch (e) {
            console.error('Error updating template', e);
            setMessage('Error al actualizar plantilla');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    // Adjust form button handler based on edit mode
    const formButtonHandler = editingId ? handleUpdate : handleCreate;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={24} /> Plantillas de Respuesta
                    </h1>
                </div>

                {message && (
                    <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
                        {message}
                    </div>
                )}

                {/* Crear nueva plantilla */}
                <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
                    <h2 className="text-lg font-medium mb-3 text-gray-800">Nueva Plantilla</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Título"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <textarea
                            placeholder="Contenido"
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2 h-32"
                        />
                    </div>
                    <button
                        onClick={formButtonHandler}
                        disabled={saving}
                        className="mt-4 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                        aria-label={editingId ? 'Actualizar plantilla' : 'Crear nueva plantilla'}
                    >
                        <Plus size={16} /> {editingId ? 'Actualizar' : 'Crear'}
                    </button>
                </div>

                {/* Lista de plantillas */}
                <div className="bg-white rounded-lg shadow border border-gray-200">
                    <h2 className="text-lg font-medium p-4 border-b border-gray-200 text-gray-800">Todas las Plantillas</h2>
                    {loading ? (
                        <p className="p-4 text-center text-gray-500">Cargando...</p>
                    ) : templates.length === 0 ? (
                        <p className="p-4 text-center text-gray-500">No hay plantillas.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {templates.map(t => (
                                <li key={t.id} className="p-4 flex justify-between items-start hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-semibold text-gray-900">{t.title}</p>
                                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{t.content}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => startEdit(t)}
                                            className="text-blue-500 hover:text-blue-700"
                                            title="Editar"
                                            aria-label={`Editar plantilla ${t.title}`}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Eliminar"
                                            aria-label={`Eliminar plantilla ${t.title}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
