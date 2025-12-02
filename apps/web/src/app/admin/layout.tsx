// src/app/admin/layout.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
                        ← Back to Chat
                    </Link>
                    <div className="border-t my-2"></div>
                    <Link
                        href="/admin/products"
                        className={`block px-4 py-2 rounded ${pathname.includes('/products') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        📦 Products
                    </Link>
                    <Link
                        href="/admin/agents"
                        className={`block px-4 py-2 rounded ${pathname.includes('/agents') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        🤖 Agents
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}
