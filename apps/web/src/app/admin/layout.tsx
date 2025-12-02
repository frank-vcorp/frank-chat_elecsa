// src/app/admin/layout.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Bot, MessageSquare, ArrowLeft, Settings } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { href: '/admin/products', label: 'Productos', icon: Package },
        { href: '/admin/agents', label: 'Agentes IA', icon: Bot },
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
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}
