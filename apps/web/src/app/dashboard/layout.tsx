'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Settings, Users, Package, LogOut, Menu, X, FileText, Key, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { mustChangePassword, setMustChangePassword } = useAuth();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    // Modal obligatorio de primer login
    const [showMandatoryPasswordModal, setShowMandatoryPasswordModal] = useState(false);
    const [mandatoryNewPassword, setMandatoryNewPassword] = useState('');
    const [mandatoryConfirmPassword, setMandatoryConfirmPassword] = useState('');
    const [showMandatoryPwd, setShowMandatoryPwd] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Mostrar modal obligatorio si mustChangePassword es true
    useEffect(() => {
        if (mustChangePassword && user) {
            setShowMandatoryPasswordModal(true);
        }
    }, [mustChangePassword, user]);

    // Obtener contraseña actual del agente
    const fetchCurrentPassword = async (uid: string) => {
        try {
            const res = await fetch(`/api/agents/${uid}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentPassword(data.password || '(no disponible)');
            }
        } catch (error) {
            console.error('Error fetching password:', error);
        }
    };

    // Cambio de contraseña obligatorio (primer login)
    const handleMandatoryPasswordChange = async () => {
        if (!user || !mandatoryNewPassword) return;
        if (mandatoryNewPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (mandatoryNewPassword !== mandatoryConfirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        setChangingPassword(true);
        try {
            const res = await fetch(`/api/agents/${user.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: mandatoryNewPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('✅ Contraseña actualizada correctamente. ¡Bienvenido!');
                setShowMandatoryPasswordModal(false);
                setMustChangePassword(false);
                setMandatoryNewPassword('');
                setMandatoryConfirmPassword('');
            } else {
                alert(`❌ ${data.error || 'Error al cambiar contraseña'}`);
            }
        } catch (error) {
            console.error('Mandatory password change error:', error);
            alert('❌ Error al cambiar contraseña');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user || !newPassword) return;
        if (newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        setChangingPassword(true);
        try {
            const res = await fetch(`/api/agents/${user.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('✅ Contraseña actualizada correctamente');
                setCurrentPassword(newPassword);
                setNewPassword('');
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    const navigation = [
        { name: 'Conversaciones', href: '/dashboard', icon: MessageSquare },
        { name: 'Reportes', href: '/admin/reports', icon: FileText },
        { name: 'Productos', href: '/admin/products', icon: Package },
        { name: 'Agentes', href: '/admin/agents', icon: Users },
        { name: 'Configuración', href: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-20'
                    } bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col shadow-xl`}
            >
                {/* Logo & Toggle */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    {sidebarOpen ? (
                        <>
                            <div className="flex items-center gap-2">
                                <img
                                    src="https://elecsa.com.mx/sites/default/files/LOGO-ELECSA%20mr.png"
                                    alt="Elecsa Logo"
                                    className="h-8 object-contain bg-white rounded px-1"
                                />
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1 hover:bg-gray-700 rounded"
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-1 hover:bg-gray-700 rounded mx-auto"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    } ${!sidebarOpen && 'justify-center'}`}
                            >
                                <Icon size={20} />
                                {sidebarOpen && <span className="font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-gray-700">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold">
                                {user?.email?.[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.displayName || 'Usuario'}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    )}
                    <button
                        onClick={() => auth.signOut()}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors ${!sidebarOpen && 'justify-center'
                            }`}
                    >
                        <LogOut size={18} />
                        {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
                    </button>
                    <button
                        onClick={() => { setShowPasswordModal(true); if (user) fetchCurrentPassword(user.uid); }}
                        className={`flex items-center gap-2 w-full px-3 py-2 mt-2 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors ${!sidebarOpen && 'justify-center'
                            }`}
                    >
                        <Key size={18} />
                        {sidebarOpen && <span className="text-sm font-medium">Mi Contraseña</span>}
                    </button>
                    {sidebarOpen && (
                        <div className="mt-4 text-center text-[10px] text-gray-500">
                            by Frank Saavedra
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {children}
            </main>

            {/* Password Modal for current user */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                                <Key className="text-amber-600" size={20} />
                                Mi Contraseña
                            </h3>
                            <button 
                                onClick={() => { setShowPasswordModal(false); setNewPassword(''); }} 
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
                                    type={showCurrentPwd ? 'text' : 'password'}
                                    value={currentPassword}
                                    readOnly
                                    className="flex-1 border rounded p-2 bg-white font-mono text-gray-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                                    className="p-2 text-gray-500 hover:text-gray-700"
                                    title={showCurrentPwd ? 'Ocultar' : 'Mostrar'}
                                >
                                    {showCurrentPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Cambiar contraseña */}
                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type={showNewPwd ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="flex-1 border rounded p-2 text-gray-800"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPwd(!showNewPwd)}
                                    className="p-2 text-gray-500 hover:text-gray-700"
                                    title={showNewPwd ? 'Ocultar' : 'Mostrar'}
                                >
                                    {showNewPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
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
                                onClick={() => { setShowPasswordModal(false); setNewPassword(''); }}
                                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal OBLIGATORIO de cambio de contraseña (primer login) */}
            {showMandatoryPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4 text-amber-600">
                            <AlertTriangle size={28} />
                            <h3 className="text-xl font-bold text-gray-800">
                                Cambio de Contraseña Requerido
                            </h3>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-amber-800">
                                Por seguridad, debes cambiar tu contraseña genérica antes de continuar.
                                Esta acción solo se requiere la primera vez que inicias sesión.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type={showMandatoryPwd ? 'text' : 'password'}
                                        value={mandatoryNewPassword}
                                        onChange={(e) => setMandatoryNewPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        className="flex-1 border rounded p-2 text-gray-800"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowMandatoryPwd(!showMandatoryPwd)}
                                        className="p-2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showMandatoryPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
                                <input
                                    type={showMandatoryPwd ? 'text' : 'password'}
                                    value={mandatoryConfirmPassword}
                                    onChange={(e) => setMandatoryConfirmPassword(e.target.value)}
                                    placeholder="Repite la contraseña"
                                    className="w-full border rounded p-2 text-gray-800"
                                />
                                {mandatoryConfirmPassword && mandatoryNewPassword !== mandatoryConfirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleMandatoryPasswordChange}
                                disabled={changingPassword || mandatoryNewPassword.length < 6 || mandatoryNewPassword !== mandatoryConfirmPassword}
                                className="w-full bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                            >
                                {changingPassword ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={16} />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Key size={16} />
                                        Guardar Nueva Contraseña
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-4 text-center">
                            No podrás usar el sistema hasta cambiar tu contraseña.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
