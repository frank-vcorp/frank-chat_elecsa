// src/app/admin/layout.tsx
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  Bot,
  MessageSquare,
  ArrowLeft,
  Settings,
  Activity,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isSupervisor, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirigir si no tiene permisos
  useEffect(() => {
    if (!loading && !isAdmin && !isSupervisor) {
      router.push("/dashboard");
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
    { href: "/admin/products", label: "Productos", icon: Package },
    { href: "/admin/agents", label: "Agentes IA", icon: Bot },
    { href: "/admin/sofia-test", label: "Probar Sofía", icon: Bot },
    { href: "/admin/settings", label: "Configuración", icon: Settings },
    { href: "/admin/logs", label: "Logs del Sistema", icon: Activity },
  ];

  return (
    <div className="flex h-screen h-[100dvh] bg-gray-100 overflow-hidden relative">
      {/* Overlay móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Drawer responsive */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white shadow-md
          transition-transform duration-300
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:inset-y-auto md:left-auto md:z-auto md:translate-x-0
          md:w-64 md:transition-none
        `}
      >
        {/* Header sidebar */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Settings size={24} />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            {/* Botón cerrar en móvil */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
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
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                pathname.includes(href.split("/").pop() || "")
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t text-xs text-gray-500">
          <p>Sistema v2.1</p>
          <p className="mt-1">Powered by vCorp</p>
          <div className="mt-2 flex items-center gap-1">
            <ShieldAlert
              size={12}
              className={isAdmin ? "text-purple-600" : "text-blue-600"}
            />
            <span className={isAdmin ? "text-purple-600" : "text-blue-600"}>
              {isAdmin ? "Administrador" : "Supervisor"}
            </span>
          </div>
        </div>
      </aside>

      {/* Contenedor principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar móvil — safe area separada del contenido para evitar compresión con notch */}
        <header className="md:hidden flex flex-col flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          {/* Espaciador safe area — el fondo del notch se colorea sin comprimir el contenido */}
          <div style={{ height: "var(--sat)" }} aria-hidden="true" />
          <div className="flex items-center gap-3 h-14 px-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Abrir menú de administración"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <Settings size={20} />
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
