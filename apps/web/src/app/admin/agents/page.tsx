// src/app/admin/agents/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Bot, RefreshCw, Send, UserPlus, Edit, Trash2, X } from 'lucide-react';

interface Agent {
    id: string;
    name: string;
    email?: string;
    role: string;
    type: 'human' | 'ai';
    prompt?: string;
    active?: boolean;
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [prompt, setPrompt] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'agent',
        type: 'human' as 'human' | 'ai',
    });

    const fetchAgents = () => {
        fetch('/api/agents')
            .then(res => res.json())
            .then(data => setAgents(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    // Auto-select Sofia or first AI agent on load
    useEffect(() => {
        if (agents.length > 0 && !selectedAgent) {
            const sofia = agents.find(a => a.type === 'ai' && a.name.toLowerCase().includes('sofia')) || agents.find(a => a.type === 'ai');
            if (sofia) {
                handleSelectAgent(sofia);
            }
        }
    }, [agents]);

    const handleSelectAgent = (agent: Agent) => {
        setSelectedAgent(agent);
        setPrompt(agent.prompt || '');
        setTestResponse('');
    };

    const handleInitializeSofia = async () => {
        if (!confirm('¿Deseas inicializar el agente Sofía con el prompt predeterminado?')) return;

        setInitializing(true);
        try {
            const res = await fetch('/api/agents/init', { method: 'POST' });
            if (res.ok) {
                alert('✅ Sofía inicializada correctamente');
                fetchAgents();
            } else {
                alert('❌ Error al inicializar Sofía');
            }
        } catch (error) {
            console.error('Init error:', error);
            alert('❌ Error al inicializar Sofía');
        } finally {
            setInitializing(false);
        }
    };

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                alert('✅ Agente creado correctamente');
                setShowCreateModal(false);
                setFormData({ name: '', email: '', password: '', role: 'agent', type: 'human' });
                fetchAgents();
            } else {
                alert(`❌ ${data.error || 'Error al crear agente'}`);
            }
        } catch (error) {
            console.error('Create error:', error);
            alert('❌ Error al crear agente');
        }
    };

    const handleDeleteAgent = async (agentId: string) => {
        if (!confirm('¿Estás seguro de eliminar este agente? Esta acción no se puede deshacer.')) return;

        try {
            const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
            if (res.ok) {
                alert('✅ Agente eliminado');
                if (selectedAgent?.id === agentId) setSelectedAgent(null);
                fetchAgents();
            } else {
                alert('❌ Error al eliminar agente');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('❌ Error al eliminar agente');
        }
    };

    const handleSavePrompt = async () => {
        if (!selectedAgent) return;
        try {
            await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedAgent.id, prompt }),
            });
            alert('✅ Prompt guardado correctamente');
            setAgents(agents.map(a => a.id === selectedAgent.id ? { ...a, prompt } : a));
        } catch (error) {
            console.error('Failed to save prompt', error);
            alert('❌ Error al guardar el prompt');
        }
    };

    const handleTestAgent = async () => {
        if (!selectedAgent || !testMessage) return;
        setLoading(true);
        try {
            const res = await fetch('/api/agent/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: selectedAgent.id, message: testMessage }),
            });
            const data = await res.json();

            if (!res.ok) {
                setTestResponse(`Error: ${data.error}`);
            } else {
                setTestResponse(data.response || 'No response');
            }
        } catch (error) {
            console.error('Failed to test agent', error);
            setTestResponse('Error de conexión al probar el agente');
        } finally {
            setLoading(false);
        }
    };

    const sofiaExists = agents.some(a => a.type === 'ai' && a.name.toLowerCase().includes('sofia'));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestión de Agentes</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        <UserPlus size={16} />
                        Crear Agente
                    </button>
                    {!sofiaExists && (
                        <button
                            onClick={handleInitializeSofia}
                            disabled={initializing}
                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            <Bot size={16} />
                            {initializing ? 'Inicializando...' : 'Inicializar Sofía'}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex h-[calc(100vh-200px)] gap-6">
                {/* Agent List */}
                <div className="w-1/3 bg-white rounded shadow p-4 overflow-auto">
                    <h3 className="text-lg font-semibold mb-4">Agentes ({agents.length})</h3>
                    {agents.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <Bot size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No hay agentes configurados</p>
                            <p className="text-sm mt-2">Crea un agente o inicializa Sofía</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {agents.map(agent => (
                                <li
                                    key={agent.id}
                                    className={`p-3 rounded border transition-all ${selectedAgent?.id === agent.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'hover:bg-gray-50 border-gray-200'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => handleSelectAgent(agent)}>
                                            <Bot size={16} className={agent.type === 'ai' ? 'text-purple-600' : 'text-blue-600'} />
                                            <div>
                                                <div className="font-semibold">{agent.name}</div>
                                                <div className="text-xs text-gray-500 capitalize">{agent.type} - {agent.role}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAgent(agent.id); }}
                                            className="text-red-600 hover:text-red-800 p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Edit & Test Panel */}
                <div className="flex-1 bg-white rounded shadow p-6 overflow-auto">
                    {selectedAgent ? (
                        <>
                            <div className="flex items-center gap-2 mb-6">
                                <Bot size={24} className={selectedAgent.type === 'ai' ? 'text-purple-600' : 'text-blue-600'} />
                                <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                                <span className="text-sm text-gray-500 ml-auto capitalize">({selectedAgent.type})</span>
                            </div>

                            {selectedAgent.type === 'ai' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
                                    <textarea
                                        className="w-full h-64 p-3 border rounded font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Escribe el prompt del sistema aquí..."
                                    />
                                    <button
                                        onClick={handleSavePrompt}
                                        className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <RefreshCw size={16} />
                                        Guardar Prompt
                                    </button>
                                </div>
                            )}

                            {/* Test Area */}
                            {selectedAgent.type === 'ai' && (
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Probar Agente</h3>
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            className="flex-1 border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Escribe un mensaje de prueba..."
                                            value={testMessage}
                                            onChange={(e) => setTestMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleTestAgent()}
                                        />
                                        <button
                                            onClick={handleTestAgent}
                                            disabled={loading || !testMessage}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Send size={16} />
                                            {loading ? 'Enviando...' : 'Enviar'}
                                        </button>
                                    </div>

                                    {testResponse && (
                                        <div className="bg-gray-50 p-4 rounded border">
                                            <div className="text-xs text-gray-500 mb-2 font-semibold">Respuesta:</div>
                                            <div className="whitespace-pre-wrap text-sm">{testResponse}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-gray-400 text-center mt-20">
                            <Bot size={64} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg">Selecciona un agente para ver detalles</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Agent Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Crear Nuevo Agente</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAgent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'human' | 'ai' })}
                                >
                                    <option value="human">Humano</option>
                                    <option value="ai">IA</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            {formData.type === 'human' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            className="w-full border rounded p-2"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                        <input
                                            type="password"
                                            className="w-full border rounded p-2"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                        <select
                                            className="w-full border rounded p-2"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="agent">Agente</option>
                                            <option value="administrator">Administrador</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Crear Agente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
