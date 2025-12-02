'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SystemLog {
    id: string;
    type: string;
    from?: string;
    body?: string;
    error?: string;
    details?: string;
    timestamp?: any;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<SystemLog[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, 'system_logs'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SystemLog[];
            setLogs(newLogs);
        });

        return () => unsubscribe();
    }, []);

    const getIcon = (type: string) => {
        if (type.includes('error')) return <AlertCircle className="text-red-500" size={20} />;
        if (type.includes('success')) return <CheckCircle className="text-green-500" size={20} />;
        return <Activity className="text-blue-500" size={20} />;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '...';
        return timestamp.toDate().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <Activity className="text-gray-400" size={32} />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Logs del Sistema</h1>
                    <p className="text-sm text-gray-500">Rastreo de actividad del Webhook en tiempo real</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                            <tr>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Hora (CDMX)</th>
                                <th className="px-6 py-3">Origen (From)</th>
                                <th className="px-6 py-3">Detalle / Error</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        No hay registros recientes
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 flex items-center gap-2 font-medium text-gray-900">
                                            {getIcon(log.type)}
                                            <span className="capitalize">{log.type.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {formatDate(log.timestamp)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-blue-600">
                                            {log.from || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.error ? (
                                                <span className="text-red-600 font-medium">{log.error}</span>
                                            ) : (
                                                <span className="text-gray-600 truncate max-w-xs block">
                                                    {log.body || log.details || '-'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
