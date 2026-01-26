// src/app/admin/layout.tsx
'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Bot, MessageSquare, ArrowLeft, Settings, Activity, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAdmin, isSupervisor, loading } = useAuth();

    // Redirigir si no tiene permisos
    useEffect(() => {
        if (!loading && !isAdmin && !isSupervisor) {
            router.push('/dashboard');
        }
    }, [loading, isAdmin, isSupervisor, router]);

    // Mostrar loading mientras verifica
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    // Si no tiene permisos, no mostrar nada (se redirige arriba)
    if (!isAdmin && !isSupervisor) {
        return null;
    }

    const navItems = [
        { href: '/admin/products', label: 'Productos', icon: Package },
        { href: '/admin/agents', label: 'Agentes IA', icon: Bot },
        { href: '/admin/settings', label: 'Configuración', icon: Settings },
        { href: '/admin/logs', label: 'Logs del Sistema', icon: Activity },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="flex items-center gap-2 text-white">
                        <Settings size={24} />
                        <h1 className="text-xl font-bold">Admin Panel</h1>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Volver al Chat
                    </Link>
                    <div className="border-t my-2"></div>
                    {navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${pathname.includes(href.split('/').pop() || '')
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Icon size={18} />
                            {label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t text-xs text-gray-500">
                    <p>Frank Chat v1.0</p>
                    <p className="mt-1">Powered by Elecsa</p>
                    <div className="mt-2 flex items-center gap-1">
                        <ShieldAlert size={12} className={isAdmin ? 'text-purple-600' : 'text-blue-600'} />
                        <span className={isAdmin ? 'text-purple-600' : 'text-blue-600'}>
                            {isAdmin ? 'Administrador' : 'Supervisor'}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}
