// src/app/admin/agents/page.tsx
'use client';
import React, { useEffect, useState } from 'react';

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

    useEffect(() => {
        fetch('/api/agents')
            .then(res => res.json())
            .then(data => setAgents(data))
            .catch(err => console.error(err));
    }, []);

    const handleSelectAgent = (agent: Agent) => {
        setSelectedAgent(agent);
        setPrompt(agent.prompt || '');
        setTestResponse('');
    };

    const handleSavePrompt = async () => {
        if (!selectedAgent) return;
        try {
            await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedAgent.id, prompt }),
            });
            alert('Prompt saved!');
            // Update local state
            setAgents(agents.map(a => a.id === selectedAgent.id ? { ...a, prompt } : a));
        } catch (error) {
            console.error('Failed to save prompt', error);
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
        <div className="flex h-full gap-6">
            {/* Agent List */}
            <div className="w-1/3 bg-white rounded shadow p-4">
                <h2 className="text-xl font-bold mb-4">Agents</h2>
                <ul className="space-y-2">
                    {agents.map(agent => (
                        <li
                            key={agent.id}
                            onClick={() => handleSelectAgent(agent)}
                            className={`p-3 rounded cursor-pointer border ${selectedAgent?.id === agent.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-gray-200'}`}
                        >
                            <div className="font-semibold">{agent.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{agent.type} - {agent.role}</div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Edit & Test Panel */}
            <div className="flex-1 bg-white rounded shadow p-6">
                {selectedAgent ? (
                    <>
                        <h2 className="text-xl font-bold mb-4">Editing: {selectedAgent.name}</h2>

                        {selectedAgent.type === 'ai' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
                                <textarea
                                    className="w-full h-64 p-3 border rounded font-mono text-sm"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                                <button
                                    onClick={handleSavePrompt}
                                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Save Prompt
                                </button>
                            </div>
                        )}

                        {/* Test Area */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Test Agent</h3>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    className="flex-1 border rounded p-2"
                                    placeholder="Type a message..."
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                />
                                <button
                                    onClick={handleTestAgent}
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send'}
                                </button>
                            </div>

                            {testResponse && (
                                <div className="bg-gray-50 p-4 rounded border">
                                    <div className="text-xs text-gray-500 mb-1">Response:</div>
                                    <div className="whitespace-pre-wrap">{testResponse}</div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-gray-400 text-center mt-20">Select an agent to edit</div>
                )}
            </div>
        </div>
    );
}
