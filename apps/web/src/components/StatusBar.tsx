'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertCircle, MessageSquare, Bot, Users, Mail } from 'lucide-react';

/**
 * StatusBar - Barra de estado estilo VS Code con métricas en tiempo real
 * @description Muestra métricas compactas en el footer del dashboard
 * @author IMPL-20250128-01
 */
export default function StatusBar() {
    const [stats, setStats] = useState({
        total: 0,
        needsHuman: 0,
        assignedToAi: 0,
        assignedToHuman: 0,
        unreadTotal: 0
    });

    useEffect(() => {
        const q = query(collection(db, 'conversations'), where('status', '!=', 'closed'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(d => d.data());

            const newStats = docs.reduce<typeof stats>((acc, curr: any) => ({
                total: acc.total + 1,
                needsHuman: acc.needsHuman + (curr.needsHuman ? 1 : 0),
                assignedToAi: acc.assignedToAi + (curr.assignedTo === 'ai' ? 1 : 0),
                assignedToHuman: acc.assignedToHuman + (curr.assignedTo !== 'ai' ? 1 : 0),
                unreadTotal: acc.unreadTotal + (curr.unreadCount || 0)
            }), {
                total: 0,
                needsHuman: 0,
                assignedToAi: 0,
                assignedToHuman: 0,
                unreadTotal: 0
            });

            setStats(newStats);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="h-6 bg-blue-600 flex items-center justify-between px-3 text-white text-xs select-none">
            {/* Lado izquierdo */}
            <div className="flex items-center gap-4">
                {/* Prioridad - Necesitan humano */}
                {stats.needsHuman > 0 && (
                    <div className="flex items-center gap-1.5 bg-red-500 px-2 py-0.5 rounded animate-pulse">
                        <AlertCircle size={12} />
                        <span className="font-medium">{stats.needsHuman} urgente{stats.needsHuman > 1 ? 's' : ''}</span>
                    </div>
                )}
                
                {/* Total conversaciones */}
                <div className="flex items-center gap-1.5 hover:bg-blue-700 px-2 py-0.5 rounded cursor-default">
                    <MessageSquare size={12} />
                    <span>{stats.total} activas</span>
                </div>

                {/* Mensajes sin leer */}
                {stats.unreadTotal > 0 && (
                    <div className="flex items-center gap-1.5 hover:bg-blue-700 px-2 py-0.5 rounded cursor-default">
                        <Mail size={12} />
                        <span>{stats.unreadTotal} sin leer</span>
                    </div>
                )}
            </div>

            {/* Lado derecho */}
            <div className="flex items-center gap-4">
                {/* IA */}
                <div className="flex items-center gap-1.5 hover:bg-blue-700 px-2 py-0.5 rounded cursor-default">
                    <Bot size={12} />
                    <span>{stats.assignedToAi} IA</span>
                </div>

                {/* Humanos */}
                <div className="flex items-center gap-1.5 hover:bg-blue-700 px-2 py-0.5 rounded cursor-default">
                    <Users size={12} />
                    <span>{stats.assignedToHuman} humanos</span>
                </div>

                {/* Versión */}
                <div className="text-blue-200 border-l border-blue-500 pl-3 ml-2">
                    Frank Chat v2.0
                </div>
            </div>
        </div>
    );
}
