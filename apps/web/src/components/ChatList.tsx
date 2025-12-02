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
        <div className="flex h-full flex-col bg-white border-r border-gray-200 w-full">
            <div className="p-4 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar conversación..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className={`group cursor-pointer p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 relative ${selectedConversationId === conv.id ? 'bg-blue-50 hover:bg-blue-50' : ''
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${conv.needsHuman ? 'bg-red-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                }`}>
                                {conv.contactId.substring(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className={`text-sm font-semibold truncate ${selectedConversationId === conv.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {conv.contactId}
                                    </h3>
                                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                        {formatTime(conv.lastMessageAt)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'
                                        }`}>
                                        {conv.lastMessage || 'Nueva conversación'}
                                    </p>

                                    {conv.unreadCount > 0 && (
                                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[1.25rem] text-center">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {conv.needsHuman && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                        )}
                    </div>
                ))}

                {filteredConversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <User size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">No se encontraron conversaciones</p>
                    </div>
                )}
            </div>
        </div>
    );
}
