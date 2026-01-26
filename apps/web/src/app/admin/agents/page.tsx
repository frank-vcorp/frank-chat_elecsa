// src/app/admin/agents/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Bot, RefreshCw, Send, UserPlus, Edit, Trash2, X, MapPin, Power, PowerOff, Lock, Eye, EyeOff, Key } from 'lucide-react';
import { BranchId } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

// Nombres legibles de las sucursales
const BRANCH_NAMES: Record<BranchId, string> = {
    guadalajara: 'Guadalajara',
    coahuila: 'Coahuila',
    leon: 'León',
    queretaro: 'Querétaro',
    toluca: 'Toluca',
    monterrey: 'Monterrey',
    centro: 'CDMX Centro',
    armas: 'CDMX Armas',
    veracruz: 'Veracruz',
    slp: 'San Luis Potosí',
    puebla: 'Puebla',
    general: 'General (Todas)',
};

interface Agent {
    id: string;
    name: string;
    email?: string;
    password?: string;
    role: string;
    type: 'human' | 'ai';
    prompt?: string;
    active?: boolean;
    branch?: BranchId;
    whatsapp?: string;
}

export default function AgentsPage() {
    const { isAdmin } = useAuth();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [prompt, setPrompt] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'agent',
        type: 'human' as 'human' | 'ai',
        branch: 'general' as BranchId,
        whatsapp: '',
    });
    const [editFormData, setEditFormData] = useState({
        name: '',
        role: 'agent',
        branch: 'general' as BranchId,
        whatsapp: '',
    });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordAgent, setPasswordAgent] = useState<Agent | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

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
                setFormData({ name: '', email: '', password: '', role: 'agent', type: 'human', branch: 'general', whatsapp: '' });
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

    const handleToggleActive = async (agent: Agent) => {
        const newStatus = agent.active === false ? true : false;
        const action = newStatus ? 'activar' : 'desactivar';
        
        if (!confirm(`¿Estás seguro de ${action} a ${agent.name}?`)) return;

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: agent.id, active: newStatus }),
            });

            if (res.ok) {
                alert(`✅ Agente ${newStatus ? 'activado' : 'desactivado'}`);
                fetchAgents();
                if (selectedAgent?.id === agent.id) {
                    setSelectedAgent({ ...selectedAgent, active: newStatus });
                }
            } else {
                alert('❌ Error al cambiar estado');
            }
        } catch (error) {
            console.error('Toggle error:', error);
            alert('❌ Error al cambiar estado');
        }
    };

    const openEditModal = (agent: Agent) => {
        setEditingAgent(agent);
        setEditFormData({
            name: agent.name,
            role: agent.role || 'agent',
            branch: agent.branch || 'general',
            whatsapp: agent.whatsapp || '',
        });
        setShowEditModal(true);
    };

    const openPasswordModal = (agent: Agent) => {
        setPasswordAgent(agent);
        setShowPassword(false);
        setNewPassword('');
        setShowPasswordModal(true);
    };

    const handleChangePassword = async () => {
        if (!passwordAgent || !newPassword) return;
        if (newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        setChangingPassword(true);
        try {
            const res = await fetch(`/api/agents/${passwordAgent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('✅ Contraseña actualizada correctamente');
                setShowPasswordModal(false);
                setPasswordAgent(null);
                setNewPassword('');
                fetchAgents(); // Recargar para ver la nueva contraseña
            } else {
                alert(`❌ ${data.error || 'Error al cambiar contraseña'}`);
            }
        } catch (error) {
            console.error('Change password error:', error);
            alert('❌ Error al cambiar contraseña');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleEditAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAgent) return;

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingAgent.id,
                    name: editFormData.name,
                    role: editFormData.role,
                    branch: editFormData.branch,
                    whatsapp: editFormData.whatsapp,
                }),
            });

            if (res.ok) {
                alert('✅ Agente actualizado');
                setShowEditModal(false);
                setEditingAgent(null);
                fetchAgents();
            } else {
                alert('❌ Error al actualizar agente');
            }
        } catch (error) {
            console.error('Edit error:', error);
            alert('❌ Error al actualizar agente');
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
                    {!sofiaExists && isAdmin && (
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
                                    className={`p-3 rounded border transition-all ${
                                        agent.active === false ? 'opacity-50 bg-gray-100' : ''
                                    } ${selectedAgent?.id === agent.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'hover:bg-gray-50 border-gray-200'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => handleSelectAgent(agent)}>
                                            <Bot size={16} className={agent.type === 'ai' ? 'text-purple-600' : 'text-blue-600'} />
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {agent.name}
                                                    {agent.active === false && (
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inactivo</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 capitalize">{agent.type} - {agent.role}</div>
                                                {agent.branch && agent.branch !== 'general' && (
                                                    <div className="text-xs text-teal-600 flex items-center gap-1 mt-0.5">
                                                        <MapPin size={10} />
                                                        {BRANCH_NAMES[agent.branch]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {agent.type === 'human' && (
                                                <>
                                                    {/* Ver/Cambiar contraseña - solo admin/supervisor */}
                                                    {(isAdmin || agent.role !== 'admin') && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openPasswordModal(agent); }}
                                                            className="text-amber-600 hover:text-amber-800 p-1"
                                                            title="Ver/Cambiar contraseña"
                                                        >
                                                            <Key size={14} />
                                                        </button>
                                                    )}
                                                    {/* Solo mostrar editar si es admin O si el agente no es admin */}
                                                    {(isAdmin || agent.role !== 'admin') && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(agent); }}
                                                            className="text-blue-600 hover:text-blue-800 p-1"
                                                            title="Editar"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    )}
                                                    {/* Solo mostrar activar/desactivar si es admin O si el agente no es admin */}
                                                    {(isAdmin || agent.role !== 'admin') && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleToggleActive(agent); }}
                                                            className={`p-1 ${agent.active === false ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'}`}
                                                            title={agent.active === false ? 'Activar' : 'Desactivar'}
                                                        >
                                                            {agent.active === false ? <Power size={14} /> : <PowerOff size={14} />}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {/* Solo admin puede eliminar */}
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteAgent(agent.id); }}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
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

                            {/* Detalles del agente humano */}
                            {selectedAgent.type === 'human' && (
                                <div className="space-y-4 mb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                            <p className="text-sm font-medium">{selectedAgent.email || 'No especificado'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
                                            <p className="text-sm font-medium capitalize">
                                                <span className={`px-2 py-0.5 rounded text-xs ${
                                                    selectedAgent.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    selectedAgent.role === 'supervisor' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {selectedAgent.role === 'admin' ? 'Administrador' : 
                                                     selectedAgent.role === 'supervisor' ? 'Supervisor' : 'Agente'}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Sucursal</label>
                                            <p className="text-sm font-medium flex items-center gap-1">
                                                <MapPin size={14} className="text-teal-600" />
                                                {selectedAgent.branch ? BRANCH_NAMES[selectedAgent.branch] || selectedAgent.branch : 'General'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</label>
                                            <p className="text-sm font-medium">{(selectedAgent as any).whatsapp || 'No especificado'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${selectedAgent.active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {selectedAgent.active !== false ? 'Activo' : 'Inactivo'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedAgent.type === 'ai' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
                                    {isAdmin ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <div className="bg-gray-50 border rounded p-4">
                                            <div className="flex items-center gap-2 text-amber-600 mb-3">
                                                <Lock size={16} />
                                                <span className="text-sm font-medium">Solo lectura - Solo administradores pueden editar</span>
                                            </div>
                                            <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-64 overflow-auto font-mono">
                                                {prompt || 'Sin prompt configurado'}
                                            </pre>
                                        </div>
                                    )}
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
                                            <option value="supervisor">Supervisor</option>
                                            {isAdmin && <option value="admin">Administrador</option>}
                                        </select>
                                        {!isAdmin && (
                                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                <Lock size={10} />
                                                Solo administradores pueden crear otros administradores
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                            <MapPin size={14} className="text-teal-600" />
                                            Sucursal
                                        </label>
                                        <select
                                            className="w-full border rounded p-2"
                                            value={formData.branch}
                                            onChange={(e) => setFormData({ ...formData, branch: e.target.value as BranchId })}
                                        >
                                            {Object.entries(BRANCH_NAMES).map(([id, name]) => (
                                                <option key={id} value={id}>{name}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            El agente solo verá conversaciones de esta sucursal
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (opcional)</label>
                                        <input
                                            type="tel"
                                            className="w-full border rounded p-2"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            placeholder="+52 442 123 4567"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Número de contacto del agente
                                        </p>
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

            {/* Edit Agent Modal */}
            {showEditModal && editingAgent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Editar Agente</h3>
                            <button onClick={() => { setShowEditModal(false); setEditingAgent(null); }} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditAgent} className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded mb-4">
                                <p className="text-sm text-gray-600">
                                    <strong>Email:</strong> {editingAgent.email}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                {/* Si el agente es admin y el usuario no es admin, no puede cambiar el rol */}
                                {editingAgent?.role === 'admin' && !isAdmin ? (
                                    <div className="w-full border rounded p-2 bg-gray-100 text-gray-500">
                                        Administrador
                                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            <Lock size={10} />
                                            No puedes modificar administradores
                                        </p>
                                    </div>
                                ) : (
                                    <select
                                        className="w-full border rounded p-2"
                                        value={editFormData.role}
                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                    >
                                        <option value="agent">Agente</option>
                                        <option value="supervisor">Supervisor</option>
                                        {isAdmin && <option value="admin">Administrador</option>}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <MapPin size={14} className="text-teal-600" />
                                    Sucursal
                                </label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={editFormData.branch}
                                    onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value as BranchId })}
                                >
                                    {Object.entries(BRANCH_NAMES).map(([id, name]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                <input
                                    type="tel"
                                    className="w-full border rounded p-2"
                                    value={editFormData.whatsapp}
                                    onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                                    placeholder="+52 442 123 4567"
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Guardar Cambios
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingAgent(null); }}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && passwordAgent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Key className="text-amber-600" size={20} />
                                Contraseña de {passwordAgent.name}
                            </h3>
                            <button 
                                onClick={() => { setShowPasswordModal(false); setPasswordAgent(null); setNewPassword(''); }} 
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mostrar contraseña actual */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordAgent.password || '(no disponible)'}
                                    readOnly
                                    className="flex-1 border rounded p-2 bg-white font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-2 text-gray-500 hover:text-gray-700"
                                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {passwordAgent.password && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(passwordAgent.password || '');
                                        alert('Contraseña copiada al portapapeles');
                                    }}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    📋 Copiar al portapapeles
                                </button>
                            )}
                        </div>

                        {/* Cambiar contraseña */}
                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full border rounded p-2 mb-2"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={handleChangePassword}
                                disabled={changingPassword || newPassword.length < 6}
                                className="w-full bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {changingPassword ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={16} />
                                        Cambiando...
                                    </>
                                ) : (
                                    <>
                                        <Key size={16} />
                                        Cambiar Contraseña
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex gap-2 pt-4 border-t mt-4">
                            <button
                                type="button"
                                onClick={() => { setShowPasswordModal(false); setPasswordAgent(null); setNewPassword(''); }}
                                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
