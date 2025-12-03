'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Message, Conversation } from '@/lib/types';
import { Send, Bot, User, Paperclip } from 'lucide-react';

interface ChatWindowProps {
    conversationId: string;
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!conversationId) return;
        const unsub = onSnapshot(doc(db, 'conversations', conversationId), (doc) => {
            if (doc.exists()) {
                setConversation({ id: doc.id, ...doc.data() } as Conversation);
            }
        });
        return () => unsub();
    }, [conversationId]);

    useEffect(() => {
        if (!conversationId) return;

        const q = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversationId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Message[];

            msgs.sort((a, b) => {
                const tA = a.createdAt?.seconds ?? 0;
                const tB = b.createdAt?.seconds ?? 0;
                return tA - tB;
            });

            setMessages(msgs);
            setTimeout(scrollToBottom, 100);
        });

        return () => unsubscribe();
    }, [conversationId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            console.log('Archivos adjuntos:', Array.from(files).map((f) => f.name));
            e.target.value = '';
        }
    };

    const handleCloseConversation = async () => {
        try {
            await fetch('/api/conversation/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId }),
            });
        } catch (e) {
            console.error('Error al cerrar', e);
        }
    };

    const handleReopenConversation = async () => {
        try {
            await fetch('/api/conversation/reopen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId }),
            });
        } catch (e) {
            console.error('Error al reabrir', e);
        }
    };

    const handleResumeAI = async () => {
        try {
            await fetch('/api/conversation/assign/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId }),
            });
        } catch (e) {
            console.error('Error al retomar IA', e);
        }
    };

    const handleTakeConversation = async () => {
        if (!conversationId) return;
        try {
            await fetch('/api/conversation/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, agentId: 'human' }),
            });
        } catch (error) {
            console.error('Failed to take conversation', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content: newMessage,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    if (!conversation) return <div className="flex-1 flex items-center justify-center text-gray-400">Cargando...</div>;

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold">
                        {conversation.contactId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-white">{conversation.contactId}</h2>
                        <div className="flex items-center gap-1 text-xs">
                            {conversation.assignedTo === 'ai' ? (
                                <span className="flex items-center gap-1 text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-800">
                                    <Bot size={12} /> IA Activa
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full border border-green-800">
                                    <User size={12} /> Agente Humano
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar (solo agentes humanos) */}
            {conversation.assignedTo === 'human' && (
                <div className="bg-gray-800 px-4 py-2 flex items-center gap-4 border-b border-gray-700">
                    <label className="cursor-pointer text-gray-400 hover:text-gray-200 flex items-center gap-2">
                        <Paperclip size={20} />
                        <span className="text-xs">Adjuntar</span>
                        <input type="file" className="hidden" multiple onChange={handleFileAttach} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                    </label>

                    <button
                        onClick={handleResumeAI}
                        className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition-colors"
                    >
                        Retomar IA
                    </button>

                    {conversation.status !== 'closed' ? (
                        <button
                            onClick={handleCloseConversation}
                            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
                        >
                            Cerrar
                        </button>
                    ) : (
                        <button
                            onClick={handleReopenConversation}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                        >
                            Reabrir
                        </button>
                    )}
                </div>
            )}

            {/* Alert Bar */}
            {(conversation.needsHuman || conversation.assignedTo === 'ai') && (
                <div className={`px-4 py-3 flex justify-between items-center border-b animate-in slide-in-from-top ${conversation.needsHuman
                        ? 'bg-red-900/20 border-red-900/50'
                        : 'bg-blue-900/20 border-blue-900/50'
                    }`}>
                    <div className={`flex items-center gap-2 text-sm font-medium ${conversation.needsHuman ? 'text-red-400' : 'text-blue-400'
                        }`}>
                        {conversation.needsHuman ? (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                </span>
                                El usuario solicita atención humana
                            </>
                        ) : (
                            <>
                                <Bot size={16} />
                                Conversación gestionada por IA
                            </>
                        )}
                    </div>
                    <button
                        onClick={handleTakeConversation}
                        className={`text-xs px-4 py-1.5 rounded-full shadow-sm transition-all font-medium ${conversation.needsHuman
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        Tomar Conversación
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
                {messages.map((msg) => {
                    const isMe = msg.senderType === 'agent' || msg.senderType === 'system';
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm relative ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-700 text-white rounded-tl-none'
                                }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <div className="flex justify-end items-center gap-1 mt-1">
                                    <span className="text-[10px] opacity-70 mt-1 block text-right">
                                        {msg.createdAt?.toDate().toLocaleTimeString('es-MX', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            timeZone: 'America/Mexico_City'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-gray-800 px-4 py-3 flex items-center gap-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 rounded-lg border-none py-2.5 px-4 focus:ring-0 focus:outline-none shadow-sm bg-gray-700 text-white placeholder-gray-400"
                    />
                    {newMessage.trim() ? (
                        <button
                            type="submit"
                            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Send size={20} />
                        </button>
                    ) : (
                        <button type="button" className="text-gray-500 p-2.5">
                            <div className="w-5 h-5" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
