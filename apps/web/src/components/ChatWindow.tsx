'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot, where, doc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { Message, Conversation } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { Send, Bot, User, Paperclip, Tag, Check, StickyNote, FileText, Trash2, Smile, Zap, MessageSquare, X, Image, File, Loader2 } from 'lucide-react';

interface ChatWindowProps {
    conversationId: string;
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
    const { isAdmin } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [sending, setSending] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Respuestas rápidas predefinidas
    const quickReplies = [
        { emoji: '👋', text: 'Hola, gracias por contactarnos. ¿En qué puedo ayudarte?' },
        { emoji: '⏰', text: 'Dame un momento para verificar esa información.' },
        { emoji: '✅', text: '¡Perfecto! Ya quedó registrado.' },
        { emoji: '📦', text: 'Te confirmo que tu pedido está en camino.' },
        { emoji: '💰', text: 'El precio incluye IVA. ¿Te genero la cotización formal?' },
        { emoji: '📞', text: 'Para mayor información, puedes llamarnos al número de la sucursal.' },
        { emoji: '🙏', text: '¡Gracias por tu preferencia! ¿Hay algo más en lo que pueda ayudarte?' },
        { emoji: '📧', text: 'Te envío la cotización a tu correo. ¿Me confirmas el email?' },
    ];

    // Notes State
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    // Templates State
    const [templates, setTemplates] = useState<any[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);

    // Fetch Templates
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch('/api/templates');
                if (res.ok) {
                    const data = await res.json();
                    const items = Array.isArray(data) ? data : Array.isArray(data?.templates) ? data.templates : [];
                    setTemplates(items);
                }
            } catch (e) {
                console.error('Error fetching templates', e);
            }
        };
        fetchTemplates();
    }, []);

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
            const file = files[0];
            
            // Validar tipo de archivo
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4'];
            if (!allowedTypes.includes(file.type)) {
                alert('Tipo de archivo no soportado. Solo se permiten imágenes (JPG, PNG, GIF, WebP), PDF y videos MP4.');
                e.target.value = '';
                return;
            }
            
            // Validar tamaño (máximo 16MB para WhatsApp)
            if (file.size > 16 * 1024 * 1024) {
                alert('El archivo es demasiado grande. Máximo 16MB.');
                e.target.value = '';
                return;
            }
            
            setAttachedFile(file);
            
            // Crear preview para imágenes
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setAttachedFilePreview(event.target?.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setAttachedFilePreview(null);
            }
            
            e.target.value = '';
        }
    };

    const removeAttachedFile = () => {
        setAttachedFile(null);
        setAttachedFilePreview(null);
    };

    const uploadFileToStorage = async (file: File): Promise<string> => {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `chat-attachments/${conversationId}/${timestamp}_${safeName}`;
        const storageRef = ref(storage, filePath);
        
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        return downloadUrl;
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

    const handleDeleteConversation = async () => {
        if (!conversationId || !isAdmin) return;
        if (!confirm('¿Estás seguro de eliminar esta conversación? Esta acción no se puede deshacer.')) return;
        
        try {
            // Eliminar mensajes de la conversación
            const res = await fetch(`/api/conversation/${conversationId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                window.location.reload(); // Recargar para limpiar el estado
            } else {
                alert('Error al eliminar la conversación');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('Error al eliminar la conversación');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Permitir envío si hay mensaje O archivo adjunto
        if ((!newMessage.trim() && !attachedFile) || sending) return;

        setSending(true);
        setUploading(!!attachedFile);
        
        try {
            let mediaUrl: string | undefined;
            let mediaType: string | undefined;
            
            // Si hay archivo adjunto, primero subirlo
            if (attachedFile) {
                try {
                    mediaUrl = await uploadFileToStorage(attachedFile);
                    mediaType = attachedFile.type;
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    alert('Error al subir el archivo. Intenta de nuevo.');
                    setSending(false);
                    setUploading(false);
                    return;
                }
            }
            
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content: newMessage.trim() || (attachedFile ? `📎 ${attachedFile.name}` : ''),
                    mediaUrl,
                    mediaType,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to send message');
            }
            
            setNewMessage('');
            setAttachedFile(null);
            setAttachedFilePreview(null);
            setShowQuickReplies(false);
            inputRef.current?.focus();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error al enviar mensaje');
        } finally {
            setSending(false);
            setUploading(false);
        }
    };

    const insertQuickReply = (text: string) => {
        setNewMessage(text);
        setShowQuickReplies(false);
        inputRef.current?.focus();
    };
    const handleSaveNote = async () => {
        if (!newNote.trim() || !conversationId) return;

        try {
            await fetch('/api/conversation/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content: newNote,
                    authorId: auth.currentUser?.uid || 'unknown',
                }),
            });
            setNewNote('');
            if (typeof window !== 'undefined') {
                import('react-hot-toast').then(({ toast }) => {
                    toast.success('Nota guardada');
                });
            }
        } catch (error) {
            console.error('Error saving note:', error);
            if (typeof window !== 'undefined') {
                import('react-hot-toast').then(({ toast }) => {
                    toast.error('Error al guardar nota');
                });
            }
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await fetch(`/api/conversation/notes/${noteId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId }),
            });
            // Optimistically remove from UI
            setNotes(prev => prev.filter(n => n.id !== noteId));
            if (typeof window !== 'undefined') {
                import('react-hot-toast').then(({ toast }) => {
                    toast.success('Nota eliminada');
                });
            }
        } catch (e) {
            console.error('Error deleting note', e);
            if (typeof window !== 'undefined') {
                import('react-hot-toast').then(({ toast }) => {
                    toast.error('Error al eliminar nota');
                });
            }
        }
    };

    // Inside notes map (replace existing note JSX)
    // We'll modify the note rendering block later.


    if (!conversation) return <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-950">Cargando...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-950 relative font-sans">
            {/* Header with Glassmorphism */}
            <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {conversation.contactId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-100 tracking-tight">{conversation.contactId}</h2>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                            {conversation.assignedTo === 'ai' ? (
                                <span className="flex items-center gap-1 text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                    <Bot size={12} /> IA Activa
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <User size={12} /> Agente Humano
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className={`p-2.5 rounded-xl transition-all duration-200 ${showNotes
                            ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                        title="Notas Internas"
                        aria-label="Alternar panel de notas internas"
                    >
                        <StickyNote size={20} />
                    </button>
                    
                    {/* Botón eliminar - Solo Admin */}
                    {isAdmin && (
                        <button
                            onClick={handleDeleteConversation}
                            className="p-2.5 rounded-xl text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all duration-200"
                            title="Eliminar conversación"
                            aria-label="Eliminar conversación"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Notes Panel (Glassy & Animated) */}
            {showNotes && (
                <div className="absolute right-4 top-[80px] bottom-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-10 fade-in duration-300 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
                        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                            <StickyNote size={16} className="text-amber-500" />
                            Notas Internas
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Espacio privado del equipo</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {notes.length === 0 ? (
                            <div className="text-center text-slate-500 text-sm py-10 flex flex-col items-center gap-2">
                                <StickyNote size={24} className="opacity-20" />
                                No hay notas aún.
                            </div>
                        ) : (
                            notes.map(note => (
                                <div key={note.id} className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50 group hover:border-slate-600 transition-colors">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                            <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-medium">
                                                <span className="bg-slate-900/50 px-1.5 py-0.5 rounded text-slate-400">{note.authorId}</span>
                                                <span>{note.createdAt?.toDate().toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteNote(note.id)}
                                            className="text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                            title="Eliminar nota"
                                            aria-label="Eliminar nota"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Escribe una nota..."
                            className="w-full bg-slate-950/50 text-slate-200 rounded-xl p-3 text-sm border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-24 mb-3 placeholder-slate-600 transition-all"
                            aria-label="Contenido de la nueva nota"
                        />
                        <button
                            onClick={handleSaveNote}
                            disabled={!newNote.trim()}
                            className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            aria-label="Guardar nota"
                        >
                            Guardar Nota
                        </button>
                    </div>
                </div >
            )}

            {/* Toolbar (Human Agents Only) */}
            {(() => conversation.assignedTo !== 'ai')() && (
                <div className="bg-slate-900/50 backdrop-blur-sm px-6 py-3 flex items-center gap-3 border-b border-slate-800 flex-wrap">
                    {/* Attachments */}
                    <label className="cursor-pointer text-slate-400 hover:text-indigo-400 transition-colors p-2 hover:bg-slate-800 rounded-lg" title="Adjuntar archivo" aria-label="Adjuntar archivo">
                        <Paperclip size={18} />
                        <input type="file" className="hidden" multiple onChange={handleFileAttach} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                    </label>

                    <div className="h-5 w-px bg-slate-800 mx-1"></div>

                    {/* Tags Dropdown */}
                    <div className="relative group">
                        <button
                            className="flex items-center gap-2 text-xs font-medium bg-slate-800 text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition-all border border-transparent hover:border-slate-600"
                            aria-label="Menú de etiquetas"
                        >
                            <Tag size={14} />
                            {conversation.tags && conversation.tags.length > 0 ? `${conversation.tags.length} Etiquetas` : 'Etiquetar'}
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 hidden group-hover:block p-1.5 animate-in fade-in zoom-in-95 duration-200">
                            {[
                                { label: 'Nuevo', color: 'bg-blue-500', id: 'new' },
                                { label: 'Interesado', color: 'bg-orange-500', id: 'interested' },
                                { label: 'Cotización', color: 'bg-purple-500', id: 'quoted' },
                                { label: 'Seguimiento', color: 'bg-yellow-500', id: 'followup' },
                                { label: 'Ganado', color: 'bg-emerald-500', id: 'won' },
                                { label: 'Perdido', color: 'bg-rose-500', id: 'lost' },
                                { label: 'Recurrente', color: 'bg-cyan-500', id: 'returning' },
                            ].map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={async () => {
                                        const currentTags = conversation.tags || [];
                                        const newTags = currentTags.includes(tag.label)
                                            ? currentTags.filter(t => t !== tag.label)
                                            : [...currentTags, tag.label];

                                        setConversation(prev => prev ? ({ ...prev, tags: newTags }) : null);

                                        await fetch('/api/conversation/tags', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ conversationId, tags: newTags }),
                                        });
                                    }}
                                    className={`w-full text-left px-3 py-2.5 text-xs rounded-lg flex items-center justify-between mb-0.5 transition-colors ${(conversation.tags || []).includes(tag.label)
                                            ? 'bg-slate-800 text-white font-medium'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }`}
                                    aria-label={`Etiqueta ${tag.label}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-2 h-2 rounded-full shadow-sm ${tag.color}`}></div>
                                        {tag.label}
                                    </div>
                                    {(conversation.tags || []).includes(tag.label) && <Check size={14} className="text-indigo-400" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Templates Dropdown */}
                    <div className="relative group">
                        <button
                            className="flex items-center gap-2 text-xs font-medium bg-slate-800 text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition-all border border-transparent hover:border-slate-600"
                            aria-label="Plantillas de respuesta"
                        >
                            <FileText size={14} />
                            Plantillas
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 hidden group-hover:block p-1.5 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {templates.length === 0 ? (
                                <div className="p-4 text-xs text-slate-500 text-center">No hay plantillas disponibles</div>
                            ) : (
                                templates.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setNewMessage(t.content)}
                                        className="w-full text-left px-3 py-2.5 text-xs rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white mb-0.5 group transition-colors"
                                        title={t.content}
                                    >
                                        <div className="font-medium text-indigo-300 group-hover:text-indigo-200 mb-0.5">{t.title}</div>
                                        <div className="text-[10px] text-slate-500 group-hover:text-slate-400 truncate">{t.content}</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Active Tags Display */}
                    <div className="flex gap-1.5 overflow-x-auto max-w-[250px] no-scrollbar items-center px-2">
                        {(conversation.tags || []).map(tag => {
                            const colors: Record<string, string> = {
                                'Nuevo': 'bg-blue-500/10 text-blue-300 border-blue-500/20',
                                'Interesado': 'bg-orange-500/10 text-orange-300 border-orange-500/20',
                                'Cotización': 'bg-purple-500/10 text-purple-300 border-purple-500/20',
                                'Seguimiento': 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
                                'Ganado': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                                'Perdido': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
                                'Recurrente': 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
                            };
                            return (
                                <span key={tag} className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${colors[tag] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                    {tag}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex-1"></div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResumeAI}
                            className="text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20"
                            aria-label="Retomar control por IA"
                        >
                            Retomar IA
                        </button>

                        {conversation.status !== 'closed' ? (
                            <button
                                onClick={handleCloseConversation}
                                className="text-xs font-medium bg-rose-600/90 text-white px-3 py-1.5 rounded-lg hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20"
                                aria-label="Cerrar conversación"
                            >
                                Cerrar
                            </button>
                        ) : (
                            <button
                                onClick={handleReopenConversation}
                                className="text-xs font-medium bg-emerald-600/90 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                                aria-label="Reabrir conversación"
                            >
                                Reabrir
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Alert Bar */}
            {(conversation.needsHuman || conversation.assignedTo === 'ai') && (
                <div className={`px-6 py-2.5 flex justify-between items-center border-b backdrop-blur-sm animate-in slide-in-from-top duration-300 ${conversation.needsHuman
                    ? 'bg-rose-950/30 border-rose-900/30'
                    : 'bg-indigo-950/30 border-indigo-900/30'
                    }`}>
                    <div className={`flex items-center gap-3 text-sm font-medium ${conversation.needsHuman ? 'text-rose-300' : 'text-indigo-300'}`}>
                        {conversation.needsHuman ? (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                </span>
                                Solicitud de atención humana
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
                        className={`text-xs px-4 py-1.5 rounded-lg shadow-md transition-all font-medium ${conversation.needsHuman
                            ? 'bg-rose-600 text-white hover:bg-rose-500'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500'
                            }`}
                        aria-label="Tomar control de la conversación"
                    >
                        Tomar Conversación
                    </button>
                </div>
            )}

            {/* Messages Area (Modern Bubbles) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950 custom-scrollbar">
                {messages.map((msg) => {
                    const isMe = msg.senderType === 'agent' || msg.senderType === 'system';
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm relative text-sm leading-relaxed ${isMe
                                    ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-tr-sm shadow-indigo-900/20'
                                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
                                }`}>
                                {/* Renderizar media si existe */}
                                {msg.mediaUrl && (
                                    <div className="mb-2">
                                        {msg.contentType === 'image' ? (
                                            <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                                                <img 
                                                    src={msg.mediaUrl} 
                                                    alt="Imagen adjunta" 
                                                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    style={{ maxHeight: '300px' }}
                                                />
                                            </a>
                                        ) : msg.contentType === 'video' ? (
                                            <video 
                                                src={msg.mediaUrl} 
                                                controls 
                                                className="max-w-full rounded-lg"
                                                style={{ maxHeight: '300px' }}
                                            />
                                        ) : msg.contentType === 'document' ? (
                                            <a 
                                                href={msg.mediaUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2 p-3 rounded-lg ${isMe ? 'bg-indigo-700/50 hover:bg-indigo-700/70' : 'bg-slate-700/50 hover:bg-slate-700/70'} transition-colors`}
                                            >
                                                <FileText size={24} className={isMe ? 'text-indigo-200' : 'text-red-400'} />
                                                <span className="text-sm underline">Ver documento PDF</span>
                                            </a>
                                        ) : (
                                            <a 
                                                href={msg.mediaUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2 p-3 rounded-lg ${isMe ? 'bg-indigo-700/50 hover:bg-indigo-700/70' : 'bg-slate-700/50 hover:bg-slate-700/70'} transition-colors`}
                                            >
                                                <File size={24} />
                                                <span className="text-sm underline">Ver archivo</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'justify-end text-indigo-200/70' : 'justify-start text-slate-500'}`}>
                                    <span className="text-[10px] font-medium">
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

            {/* Input Area (Mejorado) */}
            <div className="p-4 bg-slate-950 border-t border-slate-800/50">
                {/* Quick Replies Panel */}
                {showQuickReplies && (
                    <div className="mb-3 bg-slate-900 rounded-xl border border-slate-700 p-3 animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Zap size={12} className="text-amber-400" />
                                Respuestas Rápidas
                            </span>
                            <button 
                                onClick={() => setShowQuickReplies(false)}
                                className="text-slate-500 hover:text-slate-300 p-1"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {quickReplies.map((reply, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => insertQuickReply(reply.text)}
                                    className="text-left text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2.5 rounded-lg transition-all border border-slate-700 hover:border-slate-600"
                                >
                                    <span className="mr-2">{reply.emoji}</span>
                                    <span className="line-clamp-1">{reply.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Preview del mensaje (si hay texto) */}
                {/* Vista previa de archivo adjunto */}
                {attachedFile && (
                    <div className="mb-2 px-3 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            {attachedFilePreview ? (
                                <img 
                                    src={attachedFilePreview} 
                                    alt="Preview" 
                                    className="w-12 h-12 object-cover rounded-lg border border-emerald-500/30"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                                    {attachedFile.type === 'application/pdf' ? (
                                        <FileText size={24} className="text-red-400" />
                                    ) : attachedFile.type.startsWith('video/') ? (
                                        <File size={24} className="text-purple-400" />
                                    ) : (
                                        <File size={24} className="text-slate-400" />
                                    )}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-emerald-300 font-medium truncate">{attachedFile.name}</p>
                                <p className="text-xs text-slate-500">{(attachedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button
                                type="button"
                                onClick={removeAttachedFile}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Quitar archivo"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        {uploading && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                                <Loader2 size={12} className="animate-spin" />
                                Subiendo archivo...
                            </div>
                        )}
                    </div>
                )}

                {/* Vista previa del mensaje */}
                {newMessage.trim() && (
                    <div className="mb-2 px-3 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300">
                        <span className="text-indigo-400 font-medium">Vista previa: </span>
                        <span className="text-slate-300">{newMessage.length > 100 ? newMessage.substring(0, 100) + '...' : newMessage}</span>
                    </div>
                )}

                <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                    {/* Toolbar del input */}
                    <div className="flex items-center gap-1 px-3 pt-2 border-b border-slate-800/50">
                        <button
                            type="button"
                            onClick={() => setShowQuickReplies(!showQuickReplies)}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${showQuickReplies 
                                ? 'bg-amber-500/20 text-amber-400' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                            title="Respuestas rápidas"
                        >
                            <Zap size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                            title="Plantillas"
                        >
                            <FileText size={16} />
                        </button>
                        <label className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            attachedFile 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`} title="Adjuntar archivo (imagen, PDF, video)">
                            <Paperclip size={16} />
                            <input 
                                type="file" 
                                className="hidden" 
                                onChange={handleFileAttach}
                                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,video/mp4"
                            />
                        </label>
                        
                        <div className="flex-1" />
                        
                        <span className={`text-[10px] px-2 py-0.5 rounded ${newMessage.length > 500 ? 'text-amber-400' : 'text-slate-600'}`}>
                            {newMessage.length}/1000
                        </span>
                    </div>

                    {/* Input principal */}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value.slice(0, 1000))}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 bg-transparent border-none py-2.5 px-3 focus:ring-0 focus:outline-none text-slate-200 placeholder-slate-500"
                            aria-label="Escribir mensaje"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && !attachedFile) || sending}
                            className={`p-2.5 rounded-xl transition-all shadow-md ${
                                (newMessage.trim() || attachedFile) && !sending
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                            aria-label="Enviar mensaje"
                        >
                            {sending ? (
                                <div className="w-[18px] h-[18px] border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </form>
                </div>

                {/* Indicador de estado */}
                <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-slate-600">
                    <MessageSquare size={10} />
                    {conversation?.assignedTo === 'ai' 
                        ? 'Sofía está atendiendo esta conversación'
                        : 'Conversación asignada a agente humano'
                    }
                </div>
            </div>
        </div >
    );
}
