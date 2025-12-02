'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation } from '@/lib/types';
import { User, MessageCircle } from 'lucide-react';

interface ChatListProps {
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId?: string;
}

/**
 * ChatList Component
 * 
 * Renders a sidebar with the list of active conversations.
 * Subscribes to the 'conversations' collection to show updates (e.g., unread counts, last message) in real-time.
 */
export default function ChatList({ onSelectConversation, selectedConversationId }: ChatListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);

    // Subscribe to all conversations, ordered by most recent activity
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

    return (
        <div className="flex h-full flex-col border-r bg-white w-80">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className={`cursor-pointer p-4 hover:bg-gray-50 border-b relative ${selectedConversationId === conv.id ? 'bg-blue-50' : ''
                            } ${conv.needsHuman ? 'border-l-4 border-l-red-500 bg-red-50' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{conv.contactId}</span>
                            {conv.unreadCount > 0 && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                    {conv.unreadCount}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                        {conv.needsHuman && (
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 animate-pulse" title="Needs Human Attention" />
                        )}
                    </div>
                ))}
                {conversations.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                        No conversations yet.
                    </div>
                )}
            </div>
        </div>
    );
}
