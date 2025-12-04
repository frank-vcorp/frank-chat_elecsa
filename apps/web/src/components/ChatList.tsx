'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation } from '@/lib/types';
import { Search, User, Clock } from 'lucide-react';

interface ChatListProps {
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId?: string;
}

export default function ChatList({ onSelectConversation, selectedConversationId }: ChatListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'conversations'), orderBy('lastMessageAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Conversation[];
            setConversations(convs);
        });

        return () => unsubscribe();
    }, []);

    const filteredConversations = conversations.filter(c =>
        c.contactId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-full flex-col bg-slate-950 border-r border-slate-800 w-full font-sans">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar conversación..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-slate-200 placeholder-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
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
                            </div>
                        </div>

                        {conv.needsHuman && (
                            <div className="absolute right-2 top-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                            </div>
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
