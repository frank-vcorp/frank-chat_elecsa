// src/app/admin/products/page.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, Download } from 'lucide-react';

interface Product {
    sku: string;
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
    const [formData, setFormData] = useState<Partial<Product>>({
        sku: '',
        description: '',
        price: 0,
        currency: 'USD',
        status: 'active',
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sku) return;

        try {
            await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            setFormData({ sku: '', description: '', price: 0, currency: 'USD', status: 'active' });
            fetchProducts();
        } catch (error) {
            console.error('Failed to save product', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const parsedProducts = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const product: any = {};
                headers.forEach((header, index) => {
                    product[header] = values[index];
                });
                return {
                    sku: product.sku?.toUpperCase() || '',
                    description: product.description || product.desc || '',
                    price: Number(product.price) || 0,
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
        const csv = 'sku,description,price,currency,status\nSOLAR-PANEL-X1,Panel Solar 450W,150,USD,active\nINVERSOR-5KW,Inversor 5kW,800,USD,active';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products_template.csv';
        a.click();
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

            {/* Create Form */}
            <div className="bg-white p-6 rounded shadow mb-8">
                <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">SKU</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        >
                            <option value="USD">USD</option>
                            <option value="MXN">MXN</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Save Product
                        </button>
                    </div>
                </form>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-500">No hay productos. Carga un archivo CSV o añade productos manualmente.</td></tr>
                        ) : products.map((product) => (
                            <tr key={product.sku}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{product.sku}</td>
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
