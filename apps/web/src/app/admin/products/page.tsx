// src/app/admin/products/page.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, Download, FileText, X } from 'lucide-react';

interface Product {
    sku: string;
    supplier?: string;
    description: string;
    price: number;
    currency: string;
    status: 'active' | 'archived';
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [contextDocs, setContextDocs] = useState<any[]>([]);
    const [contextUploading, setContextUploading] = useState(false);
    const contextFileInputRef = useRef<HTMLInputElement>(null);
    const MAX_CONTEXT_DOC_SIZE_KB = 250;

    const totalContextBytes = contextDocs.reduce((sum, doc) => sum + (typeof doc.size === 'number' ? doc.size : 0), 0);
    const activeContextBytes = contextDocs
        .filter((doc) => doc.active)
        .reduce((sum, doc) => sum + (typeof doc.size === 'number' ? doc.size : 0), 0);
    const activeCount = contextDocs.filter((doc) => doc.active).length;

    const fetchProducts = async () => {
        setLoading(true);
        try {
                const res = await fetch('/api/products');
                if (!res.ok) {
                    throw new Error(`Failed to fetch products: ${res.status}`);
                }
                const data = await res.json();
                console.log('Products fetched', data);
                setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchContextDocs();
    }, []);

    const fetchContextDocs = async () => {
        try {
            const res = await fetch('/api/context-docs');
            if (!res.ok) throw new Error('Failed to fetch context docs');
            const data = await res.json();
            setContextDocs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch context docs', error);
        }
    };

    const detectDelimiter = (line: string) => {
        const candidates = [',', ';', '\t', '|'];
        let best = ',';
        let maxCount = 0;
        const sanitized = line.replace(/".*?"/g, (match) => match.replace(/,/g, '，').replace(/;/g, '；').replace(/\t/g, '␉').replace(/\|/g, '¦'));
        candidates.forEach((delimiter) => {
            const count = sanitized.split(delimiter).length - 1;
            if (count > maxCount) {
                maxCount = count;
                best = delimiter;
            }
        });
        return best;
    };

    const parseCsvLine = (line: string, delimiter: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());

        return result.map((value) => value.replace(/^"|"$/g, ''));
    };

    const normalizeNumber = (value: string | number | undefined) => {
        if (value === undefined || value === null) return 0;
        if (typeof value === 'number') return value;

        const cleaned = value
            .replace(/[^0-9,.-]/g, '')
            .trim();

        if (!cleaned) return 0;

        if (cleaned.includes(',') && !cleaned.includes('.')) {
            return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
        }

        if ((cleaned.match(/,/g) || []).length > 1) {
            return Number(cleaned.replace(/,/g, '')) || 0;
        }

        return Number(cleaned.replace(/,/g, '')) || 0;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const rawText = await file.text();
            const normalizedText = rawText
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .trim();

            const lines = normalizedText.split('\n').map((line) => line.trim()).filter(Boolean);
            if (lines.length === 0) {
                alert('❌ El archivo está vacío');
                return;
            }

            const headerLine = lines[0].replace(/^\uFEFF/, '');
            const delimiter = detectDelimiter(headerLine);
            const headers = parseCsvLine(headerLine, delimiter).map((h) => h.trim().toLowerCase());

            const parsedProducts = lines.slice(1).map((line) => {
                const values = parseCsvLine(line, delimiter);
                const product: any = {};
                headers.forEach((header, index) => {
                    product[header] = values[index];
                });
                return {
                    sku: product.sku?.toUpperCase() || '',
                    supplier: product.proveedor || product.supplier || '',
                    description: product.description || product.desc || '',
                    price: normalizeNumber(product.price ?? product.precio),
                    currency: product.currency || 'USD',
                    status: (product.status || 'active') as 'active' | 'archived',
                };
            }).filter(p => p.sku);

            const clearExisting = confirm(
                `Se encontraron ${parsedProducts.length} productos.\n\n¿Deseas ELIMINAR todos los productos existentes y reemplazarlos con estos nuevos?\n\nPresiona OK para reemplazar, o Cancelar para agregar sin eliminar.`
            );

            const res = await fetch('/api/products/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: parsedProducts, clearExisting }),
            });

            if (res.ok) {
                alert(`✅ ${parsedProducts.length} productos cargados exitosamente`);
                fetchProducts();
            } else {
                alert('❌ Error al cargar productos');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('❌ Error al procesar el archivo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleClearAll = async () => {
        if (!confirm('⚠️ ¿Estás seguro de que deseas ELIMINAR TODOS los productos? Esta acción no se puede deshacer.')) return;

        try {
            const res = await fetch('/api/products/bulk', { method: 'DELETE' });
            if (res.ok) {
                alert('✅ Todos los productos han sido eliminados');
                fetchProducts();
            }
        } catch (error) {
            console.error('Delete all error:', error);
            alert('❌ Error al eliminar productos');
        }
    };

    const downloadTemplate = () => {
        const csv = 'sku,proveedor,description,price,currency,status\nSOLAR-PANEL-X1,SolarTech,Panel Solar 450W,150,USD,active\nINVERSOR-5KW,PowerSystems,Inversor 5kW,800,USD,active';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products_template.csv';
        a.click();
    };

    const handleContextFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
            alert('Solo se permiten archivos .md o .txt');
            return;
        }

        setContextUploading(true);
        try {
            const content = await file.text();
            const sizeKb = Math.round((new Blob([content]).size / 1024) * 10) / 10;
            if (sizeKb > MAX_CONTEXT_DOC_SIZE_KB) {
                alert(`El documento es demasiado grande (${sizeKb} KB). Máximo permitido: ${MAX_CONTEXT_DOC_SIZE_KB} KB.`);
                return;
            }
            const res = await fetch('/api/context-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: file.name, content, source: 'products-page' }),
            });
            if (!res.ok) {
                throw new Error('Failed to upload context doc');
            }
            await fetchContextDocs();
        } catch (error) {
            console.error('Context upload error', error);
            alert('Error al subir el documento de contexto');
        } finally {
            setContextUploading(false);
            if (contextFileInputRef.current) contextFileInputRef.current.value = '';
        }
    };

    const handleDeleteContextDoc = async (id: string) => {
        if (!confirm('¿Eliminar este documento de contexto?')) return;
        try {
            const res = await fetch(`/api/context-docs?id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete context doc');
            await fetchContextDocs();
        } catch (error) {
            console.error('Context delete error', error);
            alert('Error al eliminar el documento de contexto');
        }
    };

    const handleToggleActiveContextDoc = async (docId: string, currentActive: boolean) => {
        try {
            const res = await fetch('/api/context-docs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: docId, active: !currentActive }),
            });
            if (!res.ok) throw new Error('Failed to update context doc');
            await fetchContextDocs();
        } catch (error) {
            console.error('Context toggle error', error);
            alert('Error al actualizar el estado del documento');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Product Catalog</h2>
                <div className="flex gap-2">
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        <Download size={16} />
                        Descargar Plantilla
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        <Upload size={16} />
                        {uploading ? 'Cargando...' : 'Cargar CSV/Excel'}
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        <Trash2 size={16} />
                        Eliminar Todos
                    </button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
            />

            <input
                ref={contextFileInputRef}
                type="file"
                accept=".md,.txt"
                onChange={handleContextFileUpload}
                className="hidden"
            />

            {/* Context documents */}
            <div className="bg-white rounded shadow mb-8 p-6">
                <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileText size={18} /> Documentos de contexto para la IA
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Activos: {activeCount} / {contextDocs.length}{' '}
                            · Tamaño activo aprox: {(activeContextBytes / 1024).toFixed(1)} KB
                            {totalContextBytes > 0 && activeContextBytes !== totalContextBytes && (
                                <>
                                    {' '}· Total cargado: {(totalContextBytes / 1024).toFixed(1)} KB
                                </>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={() => contextFileInputRef.current?.click()}
                        disabled={contextUploading}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
                    >
                        <Upload size={16} />
                        {contextUploading ? 'Subiendo...' : 'Subir .md / .txt'}
                    </button>
                </div>
                {contextDocs.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No hay documentos de contexto cargados. Puedes subir archivos .md o .txt
                        con información de referencia (por ejemplo, textos de la página de Elecsa)
                        que Sofía usará como conocimiento base.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {contextDocs.map((doc) => (
                            <li
                                key={doc.id}
                                className="flex items-center justify-between border rounded px-3 py-2 text-sm"
                            >
                                <span className="flex items-center gap-2">
                                    <FileText size={16} className="text-gray-500" />
                                    <span className="font-medium">{doc.title}</span>
                                    <span className="text-xs text-gray-400">
                                        {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : ''}
                                        {typeof doc.size === 'number' && (
                                            <>
                                                {' '}· {(doc.size / 1024).toFixed(1)} KB
                                            </>
                                        )}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${doc.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        {doc.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleActiveContextDoc(doc.id, !!doc.active)}
                                        className="text-xs px-2 py-1 rounded border text-gray-700 hover:bg-gray-50"
                                    >
                                        {doc.active ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteContextDoc(doc.id)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Eliminar documento"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* List */}
            <div className="bg-white rounded shadow overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b">
                    <p className="text-sm text-gray-600">Total: {products.length} productos</p>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-500">No hay productos. Carga un archivo CSV para comenzar.</td></tr>
                        ) : products.map((product) => (
                            <tr key={product.sku}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{product.sku}</td>
                                <td className="px-6 py-4 text-gray-500">{product.supplier}</td>
                                <td className="px-6 py-4 text-gray-500">{product.description}</td>
                                <td className="px-6 py-4 text-gray-500">${product.price} {product.currency}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {product.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
