'use client';

import { useState } from 'react';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import { MessageSquareText } from 'lucide-react';

export default function DashboardPage() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();

    return (
        <div className="flex h-full bg-white">
            {/* Chat List */}
            <div className="w-96 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MessageSquareText size={20} className="text-blue-600" />
                        Conversaciones
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ChatList
                        onSelectConversation={setSelectedConversationId}
                        selectedConversationId={selectedConversationId}
                    />
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
                {selectedConversationId ? (
                    <ChatWindow conversationId={selectedConversationId} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-blue-50">
                        <MessageSquareText size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Selecciona una conversación</p>
                        <p className="text-sm mt-1">Elige un chat de la lista para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
