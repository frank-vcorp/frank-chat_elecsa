// src/app/admin/agents/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Bot, RefreshCw, Send } from 'lucide-react';

interface Agent {
    id: string;
    name: string;
    role: string;
    type: 'human' | 'ai';
    prompt?: string;
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [prompt, setPrompt] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);

    const fetchAgents = () => {
        fetch('/api/agents')
            .then(res => res.json())
            .then(data => setAgents(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchAgents();
    }, []);

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

    const handleSavePrompt = async () => {
        if (!selectedAgent) return;
        try {
            await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedAgent.id, prompt }),
            });
            alert('✅ Prompt guardado correctamente');
            // Update local state
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
            setTestResponse(data.response || 'No response');
        } catch (error) {
            console.error('Failed to test agent', error);
            setTestResponse('Error testing agent');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">AI Agents</h2>
                <button
                    onClick={handleInitializeSofia}
                    disabled={initializing}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                    <Bot size={16} />
                    {initializing ? 'Inicializando...' : 'Inicializar Sofía'}
                </button>
            </div>

            <div className="flex h-[calc(100vh-200px)] gap-6">
                {/* Agent List */}
                <div className="w-1/3 bg-white rounded shadow p-4 overflow-auto">
                    <h3 className="text-lg font-semibold mb-4">Agentes Disponibles</h3>
                    {agents.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <Bot size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No hay agentes configurados</p>
                            <p className="text-sm mt-2">Haz clic en "Inicializar Sofía" para comenzar</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {agents.map(agent => (
                                <li
                                    key={agent.id}
                                    onClick={() => handleSelectAgent(agent)}
                                    className={`p-3 rounded cursor-pointer border transition-all ${selectedAgent?.id === agent.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'hover:bg-gray-50 border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Bot size={16} className={agent.type === 'ai' ? 'text-purple-600' : 'text-gray-400'} />
                                        <div className="font-semibold">{agent.name}</div>
                                    </div>
                                    <div className="text-sm text-gray-500 capitalize ml-6">{agent.type} - {agent.role}</div>
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
                                <Bot size={24} className="text-purple-600" />
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
                        </>
                    ) : (
                        <div className="text-gray-400 text-center mt-20">
                            <Bot size={64} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg">Selecciona un agente para editar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
