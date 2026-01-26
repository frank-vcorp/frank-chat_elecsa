'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation, BranchId } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { Search, User, Clock, Filter, X, MapPin, Bell, BellOff, Volume2, VolumeX, Trash2 } from 'lucide-react';

// Nombres legibles de sucursales
const BRANCH_NAMES: Record<BranchId, string> = {
    guadalajara: 'Guadalajara',
    coahuila: 'Coahuila',
    leon: 'León',
    queretaro: 'Querétaro',
    toluca: 'Toluca',
    monterrey: 'Monterrey',
    centro: 'CDMX Centro',
    armas: 'CDMX Armas',
    veracruz: 'Veracruz',
    slp: 'San Luis Potosí',
    puebla: 'Puebla',
    general: 'General',
};

interface ChatListProps {
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId?: string;
}

export default function ChatList({ onSelectConversation, selectedConversationId }: ChatListProps) {
    const { branch, isSupervisor, isAdmin } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'human' | 'ai'>('all');
    const [filterBranch, setFilterBranch] = useState<BranchId | 'all'>('all');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const prevNeedsHumanCountRef = useRef<number | null>(null); // null = primera carga
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Inicializar audio y solicitar permisos de notificación automáticamente
    useEffect(() => {
        // Crear elemento de audio para el sonido de notificación
        audioRef.current = new Audio('/sounds/notification.mp3');
        audioRef.current.volume = 0.5;

        // Solicitar permiso de notificaciones automáticamente
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                setNotificationsEnabled(true);
            } else if (Notification.permission !== 'denied') {
                // Solicitar permiso automáticamente
                Notification.requestPermission().then(permission => {
                    setNotificationsEnabled(permission === 'granted');
                });
            }
        }
    }, []);

    // Solicitar permiso de notificaciones
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationsEnabled(permission === 'granted');
            if (permission === 'granted') {
                new Notification('🔔 Notificaciones activadas', {
                    body: 'Recibirás alertas cuando lleguen conversaciones que necesiten tu atención.',
                    icon: '/elecsa-icon.png'
                });
            }
        }
    };

    // Función para enviar notificación
    const sendNotification = (title: string, body: string) => {
        if (notificationsEnabled && document.hidden) {
            new Notification(title, {
                body,
                icon: '/elecsa-icon.png',
                tag: 'elecsa-chat', // Evita notificaciones duplicadas
            });
        }
    };

    // Función para reproducir sonido
    const playNotificationSound = () => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    useEffect(() => {
        const q = query(collection(db, 'conversations'), orderBy('lastMessageAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Conversation[];
            
            // Contar conversaciones que necesitan humano (filtradas por sucursal del agente)
            const needsHumanConvs = convs.filter(c => {
                if (!c.needsHuman) return false;
                // Aplicar filtro de sucursal
                if (isSupervisor || isAdmin) return true;
                if (branch) return c.branch === branch || c.branch === 'general' || !c.branch;
                return true;
            });
            
            const currentCount = needsHumanConvs.length;
            
            // Si hay más conversaciones que antes, notificar
            // null = primera carga, no notificar (evita spam al abrir dashboard)
            if (prevNeedsHumanCountRef.current !== null && currentCount > prevNeedsHumanCountRef.current) {
                const newConv = needsHumanConvs[0]; // La más reciente
                playNotificationSound();
                sendNotification(
                    '🔴 Nueva conversación requiere atención',
                    `${newConv.contactId} necesita ayuda${newConv.branch ? ` (${BRANCH_NAMES[newConv.branch]})` : ''}`
                );
            }
            
            prevNeedsHumanCountRef.current = currentCount;
            setConversations(convs);
        });

        return () => unsubscribe();
    }, [branch, isSupervisor, isAdmin, notificationsEnabled, soundEnabled]);

    const filteredConversations = conversations.filter(c => {
        const matchesSearch = c.contactId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTags = filterTags.length === 0 || (c.tags && filterTags.every(t => c.tags?.includes(t)));
        const matchesStatus = filterStatus === 'all'
            ? true
            : filterStatus === 'human'
                ? c.assignedTo !== 'ai'
                : c.assignedTo === 'ai';
        
        // Filtro por sucursal:
        // - Admin/Supervisor: ve todas o puede filtrar por sucursal
        // - Agente normal: solo ve conversaciones de su sucursal + las genéricas
        let matchesBranch = true;
        if (isSupervisor || isAdmin) {
            // Supervisores pueden filtrar manualmente
            matchesBranch = filterBranch === 'all' || c.branch === filterBranch || !c.branch;
        } else if (branch) {
            // Agentes normales solo ven su sucursal + general (sin sucursal asignada)
            matchesBranch = c.branch === branch || c.branch === 'general' || !c.branch;
        }

        return matchesSearch && matchesTags && matchesStatus && matchesBranch;
    });

    const toggleTagFilter = (tag: string) => {
        setFilterTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const availableTags = [
        'Nuevo', 'Interesado', 'Cotización', 'Seguimiento', 'Ganado', 'Perdido', 'Recurrente'
    ];

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Solo admin puede eliminar conversaciones
    const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta conversación? Se borrarán todos los mensajes, notas y alertas asociadas. Esta acción no se puede deshacer.')) {
            return;
        }
        try {
            const res = await fetch(`/api/conversation/${conversationId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            // La lista se actualizará automáticamente por el listener de Firestore
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('Error al eliminar la conversación');
        }
    };

    return (
        <div className="flex h-full flex-col bg-slate-950 border-r border-slate-800 w-full font-sans">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 space-y-3">
                {/* Controles de notificaciones */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Alertas:</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => notificationsEnabled ? setNotificationsEnabled(false) : requestNotificationPermission()}
                            className={`p-1.5 rounded-lg transition-colors ${notificationsEnabled 
                                ? 'bg-indigo-500/20 text-indigo-400' 
                                : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                            title={notificationsEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
                        >
                            {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                        </button>
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-1.5 rounded-lg transition-colors ${soundEnabled 
                                ? 'bg-indigo-500/20 text-indigo-400' 
                                : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                            title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
                        >
                            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative group flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar conversación..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-slate-200 placeholder-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl border transition-all ${showFilters || filterTags.length > 0 || filterStatus !== 'all'
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                        title="Filtros avanzados"
                    >
                        <Filter size={18} />
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-400">Filtrar por Estado</span>
                            {(filterTags.length > 0 || filterStatus !== 'all' || filterBranch !== 'all') && (
                                <button
                                    onClick={() => { setFilterTags([]); setFilterStatus('all'); setFilterBranch('all'); }}
                                    className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                                >
                                    <X size={10} /> Limpiar
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 mb-4">
                            {[
                                { id: 'all', label: 'Todos' },
                                { id: 'human', label: 'Humanos' },
                                { id: 'ai', label: 'IA' }
                            ].map(status => (
                                <button
                                    key={status.id}
                                    onClick={() => setFilterStatus(status.id as any)}
                                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${filterStatus === status.id
                                        ? 'bg-indigo-600 text-white border-indigo-500'
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                        }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>

                        {/* Filtro por Sucursal (solo para supervisores/admins) */}
                        {(isSupervisor || isAdmin) && (
                            <div className="mb-4">
                                <span className="text-xs font-semibold text-slate-400 block mb-2 flex items-center gap-1">
                                    <MapPin size={12} /> Filtrar por Sucursal
                                </span>
                                <select
                                    value={filterBranch}
                                    onChange={(e) => setFilterBranch(e.target.value as BranchId | 'all')}
                                    className="w-full py-1.5 px-2 text-xs rounded-lg border bg-slate-800 text-slate-300 border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="all">Todas las sucursales</option>
                                    {Object.entries(BRANCH_NAMES).map(([id, name]) => (
                                        id !== 'general' && <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mb-1">
                            <span className="text-xs font-semibold text-slate-400 block mb-2">Filtrar por Etiquetas</span>
                            <div className="flex flex-wrap gap-1.5">
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTagFilter(tag)}
                                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${filterTags.includes(tag)
                                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredConversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className={`group cursor-pointer p-4 hover:bg-slate-900/80 transition-all border-b border-slate-800/50 relative ${selectedConversationId === conv.id ? 'bg-slate-900 border-l-4 border-l-indigo-500' : 'bg-transparent border-l-4 border-l-transparent'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${conv.needsHuman
                                ? 'bg-rose-500 shadow-rose-900/20'
                                : 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-900/20'
                                }`}>
                                {conv.contactId.substring(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className={`text-sm font-semibold truncate ${selectedConversationId === conv.id ? 'text-indigo-200' : 'text-slate-200'}`}>
                                        {conv.contactId}
                                    </h3>
                                    <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2 font-medium">
                                        {formatTime(conv.lastMessageAt)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-medium text-slate-300' : 'text-slate-500'
                                        }`}>
                                        {/* We can show the last message preview here if available in the future, for now showing date */}
                                        {conv.lastMessageAt?.toDate().toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'short',
                                            timeZone: 'America/Mexico_City'
                                        })}
                                    </p>

                                    {conv.unreadCount > 0 && (
                                        <span className="ml-2 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[1.25rem] text-center">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>

                                {/* Tags Display */}
                                {conv.tags && conv.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2.5">
                                        {conv.tags.map(tag => {
                                            const colors: Record<string, string> = {
                                                'Nuevo': 'bg-blue-500/10 text-blue-300 border-blue-500/20',
                                                'Interesado': 'bg-orange-500/10 text-orange-300 border-orange-500/20',
                                                'Cotización': 'bg-purple-500/10 text-purple-300 border-purple-500/20',
                                                'Seguimiento': 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
                                                'Ganado': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                                                'Perdido': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
                                                'Recurrente': 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
                                            };
                                            return (
                                                <span key={tag} className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${colors[tag] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                    {tag}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Branch Badge */}
                                {conv.branch && conv.branch !== 'general' && (
                                    <div className="mt-2">
                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1 w-fit">
                                            <MapPin size={10} />
                                            {BRANCH_NAMES[conv.branch] || conv.branch}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Indicador de necesita humano */}
                        {conv.needsHuman && (
                            <div className="absolute right-2 top-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                            </div>
                        )}

                        {/* Botón eliminar - solo admin - siempre visible */}
                        {isAdmin && (
                            <button
                                onClick={(e) => handleDeleteConversation(conv.id, e)}
                                className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/30 hover:text-rose-300 transition-all border border-slate-700"
                                title="Eliminar conversación"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}

                {filteredConversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">No se encontraron conversaciones</p>
                    </div>
                )}
            </div>
        </div>
    );
}
