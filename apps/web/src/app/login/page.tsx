'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { MessageSquare, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Check if agent is active
            const agentDoc = await getDoc(doc(db, 'agents', userCredential.user.uid));
            if (agentDoc.exists() && agentDoc.data().active === false) {
                await auth.signOut();
                setError('Tu cuenta ha sido desactivada. Contacta al administrador.');
                setLoading(false);
                return;
            }
            
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError('Credenciales inválidas. Por favor intenta de nuevo.');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <img
                        src="https://elecsa.com.mx/sites/default/files/LOGO-ELECSA%20mr.png"
                        alt="Elecsa Logo"
                        className="h-16 object-contain mb-4"
                    />
                    <h1 className="text-xl font-bold text-gray-900">Portal de Agentes</h1>
                    <p className="text-gray-500 text-sm mt-1">Inicia sesión para gestionar conversaciones</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center justify-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="ejemplo@elecsa.com"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Iniciando sesión...' : 'Ingresar al Panel'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400">
                    &copy; 2025 Elecsa Chat. by Frank Saavedra.
                </div>
            </div>
        </div>
    );
}
