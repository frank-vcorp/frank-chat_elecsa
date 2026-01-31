'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
    const audioContextRef = useRef<AudioContext | null>(null);

    // Sonido sutil de notificación usando Web Audio API
    const playNotificationSound = useCallback(() => {
        try {
            // Crear AudioContext si no existe
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            
            // Crear oscilador para un "ding" sutil
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // Frecuencias para un sonido agradable tipo "ding"
            oscillator.frequency.setValueAtTime(880, ctx.currentTime); // Nota A5
            oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // Nota E6
            
            oscillator.type = 'sine';
            
            // Volumen bajo y fade out
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.log('Audio no disponible:', e);
        }
    }, []);

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

            // Si aumentaron los que necesitan humano, alertar
            if (newStats.needsHuman > prevNeedsHumanRef.current && prevNeedsHumanRef.current >= 0) {
                playNotificationSound();
                setIsFlashing(true);
                // Flash más intenso por 3 segundos
                setTimeout(() => setIsFlashing(false), 3000);
            }
            
            prevNeedsHumanRef.current = newStats.needsHuman;
            setStats(newStats);
        });

        return () => unsubscribe();
    }, [playNotificationSound]);

    return (
        <div className={`h-7 flex items-center justify-between px-3 text-white text-xs select-none transition-colors duration-300 ${
            stats.needsHuman > 0 && isFlashing 
                ? 'bg-red-600 animate-pulse' 
                : stats.needsHuman > 0 
                    ? 'bg-orange-600' 
                    : 'bg-blue-600'
        }`}>
            {/* Lado izquierdo */}
            <div className="flex items-center gap-4">
                {/* Alerta - Necesitan humano */}
                {stats.needsHuman > 0 && (
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-medium ${
                        isFlashing 
                            ? 'bg-slate-900/95 text-red-600 animate-bounce' 
                            : 'bg-red-500/80 text-white'
                    }`}>
                        <Bell size={12} className={isFlashing ? 'animate-ping' : ''} />
                        <AlertCircle size={12} />
                        <span>¡{stats.needsHuman} necesita{stats.needsHuman > 1 ? 'n' : ''} atención!</span>
                    </div>
                )}
                
                {/* Total conversaciones */}
                <div className="flex items-center gap-1.5 hover:bg-slate-900/95/10 px-2 py-0.5 rounded cursor-default">
                    <MessageSquare size={12} />
                    <span>{stats.total} activas</span>
                </div>

                {/* Mensajes sin leer */}
                {stats.unreadTotal > 0 && (
                    <div className="flex items-center gap-1.5 hover:bg-slate-900/95/10 px-2 py-0.5 rounded cursor-default">
                        <Mail size={12} />
                        <span>{stats.unreadTotal} sin leer</span>
                    </div>
                )}
            </div>

            {/* Lado derecho */}
            <div className="flex items-center gap-4">
                {/* IA */}
                <div className="flex items-center gap-1.5 hover:bg-slate-900/95/10 px-2 py-0.5 rounded cursor-default">
                    <Bot size={12} />
                    <span>{stats.assignedToAi} IA</span>
                </div>

                {/* Humanos */}
                <div className="flex items-center gap-1.5 hover:bg-slate-900/95/10 px-2 py-0.5 rounded cursor-default">
                    <Users size={12} />
                    <span>{stats.assignedToHuman} humanos</span>
                </div>

                {/* Versión */}
                <div className="text-white/70 border-l border-white/30 pl-3 ml-2">
                    Frank Chat v2.0
                </div>
            </div>
        </div>
    );
}
