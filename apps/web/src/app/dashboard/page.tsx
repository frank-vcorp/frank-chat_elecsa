"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import StatusBar from "@/components/StatusBar";
import { MessageSquareText, X, ArrowLeft } from "lucide-react";

/**
 * Dashboard Principal responsive (mobile-first)
 * @description Single-panel en móvil; split view con resize en desktop.
 * @author IMPL-20260409-02 — SPEC-ARCH-20260409-02
 */
export default function DashboardPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >();
  const [listWidth, setListWidth] = useState(384); // w-96 = 384px
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ancho mínimo y máximo de la lista
  const MIN_LIST_WIDTH = 280;
  const MAX_LIST_WIDTH = 600;

  // Detección de viewport para activar modo móvil (< 768px = md breakpoint)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Manejar resize con mouse (solo desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      if (newWidth >= MIN_LIST_WIDTH && newWidth <= MAX_LIST_WIDTH) {
        setListWidth(newWidth);
      }
    },
    [isResizing],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleCloseConversation = useCallback(() => {
    setSelectedConversationId(undefined);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">

      {/* ── MÓVIL: panel único ─────────────────────────────── */}
      {isMobile ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedConversationId ? (
            <>
              {/* Barra de regreso — CA-5 */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 border-b border-slate-700 flex-shrink-0">
                <button
                  onClick={handleCloseConversation}
                  className="p-2 -ml-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  aria-label="Volver a lista de conversaciones"
                >
                  <ArrowLeft size={20} />
                </button>
                <span className="text-sm font-medium text-slate-200">
                  Conversaciones
                </span>
              </div>
              {/* ChatWindow ocupa todo el ancho — solo un mount activo */}
              <div className="flex-1 overflow-hidden">
                <ChatWindow conversationId={selectedConversationId} />
              </div>
            </>
          ) : (
            /* Lista de conversaciones full-width */
            <div className="flex-1 overflow-hidden">
              <ChatList
                onSelectConversation={setSelectedConversationId}
                selectedConversationId={selectedConversationId}
              />
            </div>
          )}
        </div>
      ) : (
        /* ── DESKTOP: split view con resize ────────────────── */
        <div ref={containerRef} className="flex flex-1 overflow-hidden">
          {/* Chat List */}
          <div
            className="flex flex-col bg-gray-50 border-r border-gray-700 transition-all duration-200 flex-shrink-0"
            style={{
              width: selectedConversationId ? listWidth : "100%",
              minWidth: selectedConversationId ? MIN_LIST_WIDTH : "100%",
            }}
          >
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
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

          {/* Resize Handle */}
          {selectedConversationId && (
            <div
              className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
              onMouseDown={handleMouseDown}
              title="Arrastra para redimensionar"
            />
          )}

          {/* Chat Window */}
          {selectedConversationId && (
            <div className="flex-1 flex flex-col bg-slate-950 min-w-0 relative">
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
      )}

      {/* Status Bar — CA-10 */}
      <StatusBar />
    </div>
  );
}
