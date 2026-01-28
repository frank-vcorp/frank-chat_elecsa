'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Agent, BranchId } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    agent: Agent | null;
    loading: boolean;
    isAdmin: boolean;
    isSupervisor: boolean;
    branch: BranchId | null;
    branches: BranchId[];
    isActive: boolean;
    mustChangePassword: boolean;
    setMustChangePassword: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    agent: null,
    loading: true,
    isAdmin: false,
    isSupervisor: false,
    branch: null,
    branches: [],
    isActive: true,
    mustChangePassword: false,
    setMustChangePassword: () => {},
});

export function useAuth() {
    return useContext(AuthContext);
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [mustChangePassword, setMustChangePassword] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            
            if (firebaseUser?.email) {
                try {
                    // Buscar el documento del agente por UID
                    const agentDoc = await getDoc(doc(db, 'agents', firebaseUser.uid));
                    
                    if (agentDoc.exists()) {
                        // IMPORTANTE: incluir el id del documento en los datos
                        // FIX REFERENCE: FIX-20250128-02
                        const agentData = { id: agentDoc.id, ...agentDoc.data() } as Agent;
                        
                        console.log('[AuthContext] Agent loaded:', {
                            id: agentData.id,
                            email: agentData.email,
                            role: agentData.role,
                            branch: agentData.branch,
                            branches: agentData.branches,
                        });
                        
                        // Check if agent is inactive
                        if (agentData.active === false) {
                            console.warn('[AuthContext] Agent is inactive, logging out:', firebaseUser.email);
                            await signOut(auth);
                            setAgent(null);
                            setUser(null);
                            setLoading(false);
                            return;
                        }
                        
                        // Verificar si debe cambiar contraseña
                        setMustChangePassword(agentData.mustChangePassword === true);
                        
                        setAgent(agentData);
                    } else {
                        // Fallback: buscar por email en la colección
                        const { collection, query, where, getDocs } = await import('firebase/firestore');
                        const q = query(
                            collection(db, 'agents'),
                            where('email', '==', firebaseUser.email)
                        );
                        const snap = await getDocs(q);
                        if (!snap.empty) {
                            // IMPORTANTE: incluir el id también en el fallback
                            const docData = snap.docs[0];
                            setAgent({ id: docData.id, ...docData.data() } as Agent);
                        } else {
                            console.warn('[AuthContext] No agent profile found for user:', firebaseUser.email);
                            setAgent(null);
                        }
                    }
                } catch (error) {
                    console.error('[AuthContext] Error fetching agent profile:', error);
                    setAgent(null);
                }
            } else {
                setAgent(null);
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const isAdmin = agent?.role === 'admin';
    const isSupervisor = agent?.role === 'supervisor' || isAdmin;
    const branch = agent?.branch || null;
    // Soportar múltiples sucursales: usar branches si existe, sino usar branch individual
    const branches: BranchId[] = agent?.branches || (agent?.branch ? [agent.branch] : []);
    const isActive = agent?.active !== false;

    return (
        <AuthContext.Provider value={{ user, agent, loading, isAdmin, isSupervisor, branch, branches, isActive, mustChangePassword, setMustChangePassword }}>
            {children}
        </AuthContext.Provider>
    );
}
