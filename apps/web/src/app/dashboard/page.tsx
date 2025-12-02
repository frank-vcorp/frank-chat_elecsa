'use client';

import { useState } from 'react';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';

export default function DashboardPage() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();

    return (
        <div className="flex h-full">
            <ChatList
                onSelectConversation={setSelectedConversationId}
                selectedConversationId={selectedConversationId}
            />
            <div className="flex-1 h-full">
                {selectedConversationId ? (
                    <ChatWindow conversationId={selectedConversationId} />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}
