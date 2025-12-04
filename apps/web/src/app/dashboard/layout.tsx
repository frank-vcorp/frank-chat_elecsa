'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Settings, Users, Package, LogOut, Menu, X, FileText } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

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
        </div>
    );
}
