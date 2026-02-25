'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { AlertCircle, MessageSquare, Bot, Users, Mail, Bell } from 'lucide-react';

/**
 * StatusBar - Barra de estado estilo VS Code con métricas en tiempo real
 * @description Muestra métricas compactas en el footer del dashboard con alertas sonoras
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
    const [isFlashing, setIsFlashing] = useState(false);
    const prevNeedsHumanRef = useRef(0);
    const prevTotalRef = useRef(0);

    // Sonido de notificación usando archivo MP3
    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Error al reproducir sonido:', e));
        } catch (e) {
            console.log('Audio no disponible:', e);
        }
    }, []);

    const { agent, branch, isAdmin, isSupervisor } = useAuth();

    // ... (rest of the component)

    useEffect(() => {
        const q = query(collection(db, 'conversations'), where('status', '!=', 'closed'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allDocs = snapshot.docs.map(d => d.data());

            // Filtrar conversaciones relevantes para el usuario actual
            // FIX: Evitar que agentes de una sucursal escuchen alarmas de otras
            // Filtrar conversaciones relevantes para el usuario actual
            // FIX: Evitar que agentes de una sucursal escuchen alarmas de otras
            const relevantDocs = allDocs.filter(doc => {
                // 1. Si soy Admin o Supervisor, veo todo
                if (isAdmin || isSupervisor) return true;

                // 2. Si está asignado específicamente a mí
                if (agent?.id && doc.assignedTo === agent.id) return true;

                // 3. Si coincide con mi sucursal
                if (branch && doc.branch === branch) return true;

                return false;
            });

            const newStats = relevantDocs.reduce<typeof stats>((acc, curr: any) => ({
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

            // LOGIC: Trigger sound on ANY increase in relevant chats (Total or NeedsHuman)
            const hasNewUrgency = newStats.needsHuman > prevNeedsHumanRef.current;
            const hasNewChat = newStats.total > prevTotalRef.current;

            // Debug Logs
            console.log('[StatusBar] Update:', {
                newTotal: newStats.total,
                prevTotal: prevTotalRef.current,
                hasNewChat,
                hasNewUrgency,
                prevTotalRefValue: prevTotalRef.current
            });

            // Solo sonar si NO es la carga inicial (evita ruido al refrescar)
            // Asumimos que la carga inicial tiene prevTotal = 0.
            if ((hasNewUrgency || hasNewChat) && prevTotalRef.current > 0) {
                console.log('🔔 DING! Sound Triggered');
                playNotificationSound();
                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 3000);
            }

            // Update refs AFTER check
            prevNeedsHumanRef.current = newStats.needsHuman;
            // Solo actualizamos prevTotal si es diferente, aunque en cada render se recalcula
            prevTotalRef.current = newStats.total;
            setStats(newStats);
        });

        return () => unsubscribe();
    }, [agent, branch, isAdmin, isSupervisor, playNotificationSound]);

    // Efecto para repetir la alerta cada 30 segundos si hay chats pendientes (Persistencia)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (stats.needsHuman > 0) {
            interval = setInterval(() => {
                playNotificationSound();
                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 3000);
            }, 30000); // Cada 30 segundos
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [stats.needsHuman, playNotificationSound]);

    return (
        <div className={`h-7 flex items-center justify-between px-3 text-white text-xs select-none transition-colors duration-300 ${stats.needsHuman > 0 && isFlashing
            ? 'bg-red-600 animate-pulse'
            : stats.needsHuman > 0
                ? 'bg-orange-600'
                : 'bg-blue-600'
            }`}>
            {/* Lado izquierdo */}
            <div className="flex items-center gap-4">
                {/* Alerta - Necesitan humano */}
                {stats.needsHuman > 0 && (
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-medium ${isFlashing
                        ? 'bg-white text-red-600 animate-bounce'
                        : 'bg-red-500/80 text-white'
                        }`}>
                        <Bell size={12} className={isFlashing ? 'animate-ping' : ''} />
                        <AlertCircle size={12} />
                        <span>¡{stats.needsHuman} necesita{stats.needsHuman > 1 ? 'n' : ''} atención!</span>
                    </div>
                )}

                {/* Total conversaciones */}
                <div className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded cursor-default">
                    <MessageSquare size={12} />
                    <span>{stats.total} activas</span>
                </div>

                {/* Mensajes sin leer */}
                {stats.unreadTotal > 0 && (
                    <div className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded cursor-default">
                        <Mail size={12} />
                        <span>{stats.unreadTotal} sin leer</span>
                    </div>
                )}
            </div>

            {/* Lado derecho */}
            <div className="flex items-center gap-4">
                {/* IA */}
                <div className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded cursor-default">
                    <Bot size={12} />
                    <span>{stats.assignedToAi} IA</span>
                </div>

                {/* Humanos */}
                <div className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded cursor-default">
                    <Users size={12} />
                    <span>{stats.assignedToHuman} humanos</span>
                </div>

                {/* Versión */}
                <div className="text-white/70 border-l border-white/30 pl-3 ml-2">
                    Hecho con ❤️ por vCorp
                </div>
            </div>
        </div>
    );
}
