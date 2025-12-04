'use client';

import { useState } from 'react';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import DashboardMetrics from '@/components/DashboardMetrics';
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

            {/* Chat Window or Metrics */}
            <div className="flex-1 flex flex-col bg-slate-950">
                {selectedConversationId ? (
                    <ChatWindow conversationId={selectedConversationId} />
                ) : (
                    <DashboardMetrics />
                )}
            </div>
        </div>
    );
}
