'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import StatusBar from '@/components/StatusBar';
import { MessageSquareText, X } from 'lucide-react';

/**
 * Dashboard Principal con panel redimensionable
 * @description Lista de conversaciones expandible + chat con resize
 * @author IMPL-20250128-01
 */
export default function DashboardPage() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
    const [listWidth, setListWidth] = useState(384); // w-96 = 384px
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Ancho mínimo y máximo de la lista
    const MIN_LIST_WIDTH = 280;
    const MAX_LIST_WIDTH = 600;

    // Manejar resize con mouse
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        
        if (newWidth >= MIN_LIST_WIDTH && newWidth <= MAX_LIST_WIDTH) {
            setListWidth(newWidth);
        }
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    // Event listeners para resize
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Cerrar conversación
    const handleCloseConversation = useCallback(() => {
        setSelectedConversationId(undefined);
    }, []);

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Main Content */}
            <div ref={containerRef} className="flex flex-1 overflow-hidden">
                {/* Chat List - Se expande cuando no hay conversación seleccionada */}
                <div 
                    className="flex flex-col bg-slate-950 border-r border-gray-700 transition-all duration-200"
                    style={{ 
                        width: selectedConversationId ? listWidth : '100%',
                        minWidth: selectedConversationId ? MIN_LIST_WIDTH : '100%'
                    }}
                >
                    <div className="p-4 border-b border-slate-800/50 bg-slate-900/95 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
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

                {/* Resize Handle - Solo visible cuando hay conversación */}
                {selectedConversationId && (
                    <div
                        className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
                        onMouseDown={handleMouseDown}
                        title="Arrastra para redimensionar"
                    />
                )}

                {/* Chat Window - Solo visible cuando hay conversación seleccionada */}
                {selectedConversationId && (
                    <div className="flex-1 flex flex-col bg-slate-950 min-w-0">
                        {/* Botón cerrar conversación */}
                        <div className="absolute top-2 right-2 z-10">
                            <button
                                onClick={handleCloseConversation}
                                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                title="Cerrar conversación"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <ChatWindow conversationId={selectedConversationId} />
                    </div>
                )}
            </div>

            {/* Status Bar - Footer estilo VS Code */}
            <StatusBar />
        </div>
    );
}
