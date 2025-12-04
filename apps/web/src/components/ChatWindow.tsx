'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot, where, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Message, Conversation } from '@/lib/types';
import { Send, Bot, User, Paperclip, Tag, Check, StickyNote } from 'lucide-react';

interface ChatWindowProps {
    conversationId: string;
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Notes State
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    // Fetch Notes
    useEffect(() => {
        if (!conversationId || !showNotes) return;

        const q = query(
            collection(db, 'conversations', conversationId, 'notes'),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedNotes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotes(fetchedNotes);
        });

        return () => unsub();
    }, [conversationId, showNotes]);

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
            // 1. Close conversation
            await fetch('/api/conversation/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId }),
            });

            // 2. Trigger AI Summary (fire and forget)
            fetch('/api/conversation/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId }),
            }).catch(err => console.error('Summary generation failed', err));

        } catch (e) {
            console.error('Close conversation error', e);
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

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;
        try {
            await fetch('/api/conversation/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content: newNote,
                    authorId: 'agent' // TODO: Get real agent ID
                }),
            });
            setNewNote('');
        } catch (e) {
            console.error('Error saving note', e);
        }
    };

    if (!conversation) return <div className="flex-1 flex items-center justify-center text-gray-400">Cargando...</div>;

    return (
        <div className="flex flex-col h-full bg-gray-900 relative">
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

                {/* Header Actions */}
                <button
                    onClick={() => setShowNotes(!showNotes)}
                    className={`p-2 rounded-lg transition-colors ${showNotes ? 'bg-yellow-900/50 text-yellow-400' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                    title="Notas Internas"
                >
                    <StickyNote size={20} />
                </button>
            </div>

            {/* Notes Panel */}
            {showNotes && (
                <div className="absolute right-0 top-[65px] bottom-0 w-80 bg-gray-800 border-l border-gray-700 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right">
                    <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <StickyNote size={16} className="text-yellow-500" />
                            Notas Internas
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Solo visibles para el equipo</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {notes.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm py-8">
                                No hay notas aún.
                            </div>
                        ) : (
                            notes.map(note => (
                                <div key={note.id} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.content}</p>
                                    <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
                                        <span>{note.authorId}</span>
                                        <span>{note.createdAt?.toDate().toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-700 bg-gray-800">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Escribe una nota..."
                            className="w-full bg-gray-700 text-white rounded-lg p-3 text-sm border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24 mb-2"
                        />
                        <button
                            onClick={handleSaveNote}
                            disabled={!newNote.trim()}
                            className="w-full bg-yellow-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Guardar Nota
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar (solo agentes humanos) */}
            {(() => {
                // Debug log removed for cleaner code, logic confirmed working
                return conversation.assignedTo !== 'ai';
            })() && (
                    <div className="bg-gray-800 px-4 py-2 flex items-center gap-4 border-b border-gray-700 flex-wrap">
                        {/* Attachments */}
                        <label className="cursor-pointer text-gray-400 hover:text-gray-200 flex items-center gap-2" title="Adjuntar archivo">
                            <Paperclip size={18} />
                            <input type="file" className="hidden" multiple onChange={handleFileAttach} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                        </label>

                        <div className="h-4 w-px bg-gray-700 mx-2"></div>

                        {/* Tags Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded hover:bg-gray-600 transition-colors">
                                <Tag size={14} />
                                {conversation.tags && conversation.tags.length > 0 ? `${conversation.tags.length} Etiquetas` : 'Etiquetar'}
                            </button>
                            <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 hidden group-hover:block p-1">
                                {[
                                    { label: 'Nuevo', color: 'bg-blue-500', id: 'new' },
                                    { label: 'Interesado', color: 'bg-orange-500', id: 'interested' },
                                    { label: 'Cotización', color: 'bg-purple-500', id: 'quoted' },
                                    { label: 'Seguimiento', color: 'bg-yellow-500', id: 'followup' },
                                    { label: 'Ganado', color: 'bg-green-500', id: 'won' },
                                    { label: 'Perdido', color: 'bg-red-500', id: 'lost' },
                                    { label: 'Recurrente', color: 'bg-cyan-500', id: 'returning' },
                                ].map((tag) => (
                                    <button
                                        key={tag.id}
                                        onClick={async () => {
                                            const currentTags = conversation.tags || [];
                                            const newTags = currentTags.includes(tag.label)
                                                ? currentTags.filter(t => t !== tag.label)
                                                : [...currentTags, tag.label];

                                            // Optimistic update
                                            setConversation(prev => prev ? ({ ...prev, tags: newTags }) : null);

                                            await fetch('/api/conversation/tags', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ conversationId, tags: newTags }),
                                            });
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs rounded flex items-center justify-between hover:bg-gray-700 ${(conversation.tags || []).includes(tag.label) ? 'text-white font-medium' : 'text-gray-400'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${tag.color}`}></div>
                                            {tag.label}
                                        </div>
                                        {(conversation.tags || []).includes(tag.label) && <Check size={12} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Display Active Tags */}
                        <div className="flex gap-1 overflow-x-auto max-w-[200px] no-scrollbar">
                            {(conversation.tags || []).map(tag => {
                                const colors: Record<string, string> = {
                                    'Nuevo': 'bg-blue-900/50 text-blue-300 border-blue-800',
                                    'Interesado': 'bg-orange-900/50 text-orange-300 border-orange-800',
                                    'Cotización': 'bg-purple-900/50 text-purple-300 border-purple-800',
                                    'Seguimiento': 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
                                    'Ganado': 'bg-green-900/50 text-green-300 border-green-800',
                                    'Perdido': 'bg-red-900/50 text-red-300 border-red-800',
                                    'Recurrente': 'bg-cyan-900/50 text-cyan-300 border-cyan-800',
                                };
                                return (
                                    <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[tag] || 'bg-gray-700 text-gray-300'}`}>
                                        {tag}
                                    </span>
                                );
                            })}
                        </div>

                        <div className="flex-1"></div>

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
