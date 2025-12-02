'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Message, Conversation } from '@/lib/types';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, Bot, User } from 'lucide-react';

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
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Message[];
            setMessages(msgs);
            setTimeout(scrollToBottom, 100);
        });

        return () => unsubscribe();
    }, [conversationId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    if (!conversation) return <div className="flex-1 flex items-center justify-center">Cargando...</div>;

    return (
        <div className="flex flex-col h-full bg-[#efeae2]">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                        {conversation.contactId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800">{conversation.contactId}</h2>
                        <div className="flex items-center gap-1 text-xs">
                            {conversation.assignedTo === 'ai' ? (
                                <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                    <Bot size={12} /> IA Activa
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    <User size={12} /> Agente Humano
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                    <button className="hover:bg-gray-100 p-2 rounded-full transition-colors"><Phone size={20} /></button>
                    <button className="hover:bg-gray-100 p-2 rounded-full transition-colors"><Video size={20} /></button>
                    <button className="hover:bg-gray-100 p-2 rounded-full transition-colors"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Alert Bar */}
            {conversation.needsHuman && (
                <div className="bg-red-50 px-4 py-2 flex justify-between items-center border-b border-red-100 animate-in slide-in-from-top">
                    <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        El usuario solicita atención humana
                    </div>
                    <button
                        onClick={handleTakeConversation}
                        className="text-xs bg-red-600 text-white px-4 py-1.5 rounded-full hover:bg-red-700 shadow-sm transition-all font-medium"
                    >
                        Tomar Conversación
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                {messages.map((msg) => {
                    const isMe = msg.senderType === 'agent' || msg.senderType === 'system';
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm relative ${isMe ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'
                                }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <div className="flex justify-end items-center gap-1 mt-1">
                                    <span className="text-[10px] text-gray-500">
                                        {msg.createdAt?.seconds
                                            ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-4">
                <div className="flex gap-2 text-gray-500">
                    <button className="hover:text-gray-700 transition-colors"><Smile size={24} /></button>
                    <button className="hover:text-gray-700 transition-colors"><Paperclip size={24} /></button>
                </div>
                <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 rounded-lg border-none py-2.5 px-4 focus:ring-0 focus:outline-none shadow-sm"
                    />
                    {newMessage.trim() ? (
                        <button
                            type="submit"
                            className="bg-[#00a884] text-white p-2.5 rounded-full hover:bg-[#008f6f] transition-colors shadow-sm"
                        >
                            <Send size={20} />
                        </button>
                    ) : (
                        <button type="button" className="text-gray-500 p-2.5">
                            <div className="w-5 h-5" /> {/* Spacer/Mic placeholder */}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
