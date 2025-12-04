// src/app/admin/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation } from '@/lib/types';
import { Download, FileText, Calendar } from 'lucide-react';

export default function ReportsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                // Fetch last 50 closed conversations
                const q = query(
                    collection(db, 'conversations'),
                    where('status', '==', 'closed'),
                    orderBy('lastMessageAt', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
                setConversations(data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const exportToCSV = () => {
        const headers = ['ID', 'Cliente', 'Fecha', 'Etiquetas', 'Resumen IA'];
        const rows = conversations.map(c => [
            c.id,
            c.contactId,
            c.lastMessageAt?.toDate().toLocaleString() || '',
            (c.tags || []).join(', '),
            `"${(c.summary || '').replace(/"/g, '""')}"` // Escape quotes
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_conversaciones_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reportes de Conversaciones</h1>
                        <p className="text-gray-500 mt-1">Historial de chats cerrados y resúmenes de IA</p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        Exportar CSV
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Cargando reportes...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No hay conversaciones cerradas aún.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Cliente</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Fecha Cierre</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Etiquetas</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700 w-1/2">Resumen IA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {conversations.map((conv) => (
                                        <tr key={conv.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {conv.contactId}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {conv.lastMessageAt?.toDate().toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(conv.tags || []).map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {(!conv.tags || conv.tags.length === 0) && <span className="text-gray-400 italic">Sin etiquetas</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {conv.summary ? (
                                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                                                        {conv.summary}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic flex items-center gap-1">
                                                        <FileText size={14} /> Pendiente de resumen...
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
