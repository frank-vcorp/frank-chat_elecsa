'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, Bot, AlertCircle, MessageSquare, Clock } from 'lucide-react';

export default function DashboardMetrics() {
    const [stats, setStats] = useState({
        total: 0,
        needsHuman: 0,
        assignedToAi: 0,
        assignedToHuman: 0,
        unreadTotal: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query all non-closed conversations for metrics
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
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex-1 flex items-center justify-center text-slate-500">Cargando métricas...</div>;
    }

    return (
        <div className="flex-1 p-8 bg-slate-950 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-2">Panel de Control</h1>
                <p className="text-slate-400 mb-8">Resumen de actividad en tiempo real</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Needs Human Attention - High Priority */}
                    <div className="bg-rose-950/30 border border-rose-900/50 p-5 rounded-2xl shadow-lg shadow-rose-900/10 backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                                <AlertCircle size={24} />
                            </div>
                            <span className="text-xs font-medium text-rose-300 bg-rose-500/10 px-2 py-1 rounded-full">Prioridad</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{stats.needsHuman}</div>
                        <div className="text-sm text-rose-200/70">Requieren atención humana</div>
                    </div>

                    {/* Active Chats */}
                    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <MessageSquare size={24} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
                        <div className="text-sm text-slate-400">Conversaciones activas</div>
                    </div>

                    {/* AI Agents */}
                    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                <Bot size={24} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{stats.assignedToAi}</div>
                        <div className="text-sm text-slate-400">Gestionadas por IA</div>
                    </div>

                    {/* Human Agents */}
                    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <Users size={24} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{stats.assignedToHuman}</div>
                        <div className="text-sm text-slate-400">Gestionadas por Humanos</div>
                    </div>
                </div>

                {/* Quick Actions or Recent Activity could go here */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-slate-400" />
                            Estado del Sistema
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <span className="text-slate-300 text-sm">Mensajes sin leer</span>
                                <span className="text-white font-bold">{stats.unreadTotal}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <span className="text-slate-300 text-sm">Tasa de ocupación IA</span>
                                <span className="text-white font-bold">
                                    {stats.total > 0 ? Math.round((stats.assignedToAi / stats.total) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                            <Bot size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Frank Chat v2.0</h3>
                        <p className="text-slate-400 text-sm max-w-xs">
                            Sistema operativo con normalidad. Los agentes de IA están monitoreando las conversaciones activas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
