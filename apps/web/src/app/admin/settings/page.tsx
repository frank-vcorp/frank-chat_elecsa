"use client";

import { useState } from "react";
import {
  Settings,
  CheckCircle,
  Shield,
  Database,
  Cpu,
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { requestFCMToken } from "@/lib/firebase";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const { user } = useAuth();
  const [pushStatus, setPushStatus] = useState<
    "idle" | "loading" | "success" | "denied" | "unsupported"
  >("idle");

  const handleEnablePush = async () => {
    setPushStatus("loading");
    try {
      const token = await requestFCMToken();
      if (!token) {
        setPushStatus("denied");
        return;
      }

      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) { setPushStatus("denied"); return; }

      const res = await fetch("/api/notifications/register-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token }),
      });

      setPushStatus(res.ok ? "success" : "denied");
    } catch (e) {
      console.error("[Push] Error:", e);
      setPushStatus("unsupported");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-gray-400" size={32} />
        <h1 className="text-2xl font-bold text-gray-900">
          Configuración del Sistema
        </h1>
      </div>

      <div className="grid gap-6">
        {/* System Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Cpu size={18} className="text-blue-600" />
              Estado de Servicios
            </h2>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium border border-green-100">
              Sistema Operativo
            </span>
          </div>
          <div className="p-6 grid gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database size={20} className="text-orange-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    Firebase Firestore
                  </p>
                  <p className="text-xs text-gray-500">
                    Base de datos y tiempo real
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle size={16} /> Conectado
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">OpenAI GPT-4</p>
                  <p className="text-xs text-gray-500">
                    Motor de Inteligencia Artificial
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle size={16} /> Configurado
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                  T
                </div>
                <div>
                  <p className="font-medium text-gray-900">Twilio WhatsApp</p>
                  <p className="text-xs text-gray-500">
                    Pasarela de mensajería
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle size={16} /> Activo
              </div>
            </div>
          </div>
        </div>

        {/* Branding Settings (Read Only) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800">Perfil de Empresa</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center p-2">
                <img
                  src="https://elecsa.com.mx/sites/default/files/LOGO-ELECSA%20mr.png"
                  alt="Logo Actual"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    value="Elecsa"
                    disabled
                    className="w-full max-w-md px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    URL del Sitio Web
                  </label>
                  <input
                    type="text"
                    value="https://elecsa.com.mx"
                    disabled
                    className="w-full max-w-md px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700"
                  />
                </div>
              </div>
            </div>
            <p className="mt-6 text-xs text-gray-400">
              * Para modificar estos datos, contacta a soporte de vCorp.
            </p>
          </div>
        </div>

        {/* Notificaciones Push — ARCH-20260423-01 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Bell size={18} className="text-teal-600" />
              Notificaciones Push
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Activa las notificaciones para recibir alertas en tu iPhone o
              Android cuando llegue una conversación a tu sucursal, aunque la
              app esté cerrada.
            </p>

            {pushStatus === "success" && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm">
                <CheckCircle size={16} />
                ¡Listo! Recibirás notificaciones en este dispositivo.
              </div>
            )}
            {pushStatus === "denied" && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm">
                <BellOff size={16} />
                Permiso denegado. Ve a Configuración del iPhone → Safari/Chrome
                → Notificaciones y actívalas manualmente.
              </div>
            )}
            {pushStatus === "unsupported" && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
                <BellOff size={16} />
                Tu navegador no soporta notificaciones push. Asegúrate de usar
                Safari en iPhone y tener la app agregada al Home Screen.
              </div>
            )}

            <button
              onClick={handleEnablePush}
              disabled={pushStatus === "loading" || pushStatus === "success"}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pushStatus === "loading" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : pushStatus === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <Bell size={16} />
              )}
              {pushStatus === "success"
                ? "Notificaciones activas"
                : pushStatus === "loading"
                  ? "Activando..."
                  : "Activar notificaciones en este dispositivo"}
            </button>

            <p className="mt-3 text-xs text-gray-400">
              Cada dispositivo (iPhone, computadora) debe activarlo por
              separado. El token se guarda de forma segura en tu perfil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
