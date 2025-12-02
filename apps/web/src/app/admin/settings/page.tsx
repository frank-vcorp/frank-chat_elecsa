'use client';

import { Settings, CheckCircle, XCircle, Shield, Database, Cpu } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <Settings className="text-gray-400" size={32} />
                <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
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
                                    <p className="font-medium text-gray-900">Firebase Firestore</p>
                                    <p className="text-xs text-gray-500">Base de datos y tiempo real</p>
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
                                    <p className="text-xs text-gray-500">Motor de Inteligencia Artificial</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                <CheckCircle size={16} /> Configurado
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-red-500 flex items-center justify-center text-white text-xs font-bold">T</div>
                                <div>
                                    <p className="font-medium text-gray-900">Twilio WhatsApp</p>
                                    <p className="text-xs text-gray-500">Pasarela de mensajería</p>
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
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Nombre de la Empresa</label>
                                    <input
                                        type="text"
                                        value="Elecsa"
                                        disabled
                                        className="w-full max-w-md px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">URL del Sitio Web</label>
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
                            * Para modificar estos datos, contacta al administrador del sistema (Frank Saavedra).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
