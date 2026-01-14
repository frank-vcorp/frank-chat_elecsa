'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    agent: null,
    loading: true,
    isAdmin: false,
    isSupervisor: false,
    branch: null,
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            
            if (firebaseUser?.email) {
                try {
                    // Buscar el documento del agente por email
                    const agentDoc = await getDoc(doc(db, 'agents', firebaseUser.uid));
                    
                    if (agentDoc.exists()) {
                        setAgent(agentDoc.data() as Agent);
                    } else {
                        // Fallback: buscar por email en la colección
                        const { collection, query, where, getDocs } = await import('firebase/firestore');
                        const q = query(
                            collection(db, 'agents'),
                            where('email', '==', firebaseUser.email)
                        );
                        const snap = await getDocs(q);
                        if (!snap.empty) {
                            setAgent(snap.docs[0].data() as Agent);
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

    return (
        <AuthContext.Provider value={{ user, agent, loading, isAdmin, isSupervisor, branch }}>
            {children}
        </AuthContext.Provider>
    );
}
