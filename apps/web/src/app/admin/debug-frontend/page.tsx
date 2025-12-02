'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DebugFrontendPage() {
    const [status, setStatus] = useState<any>({ loading: true });

    useEffect(() => {
        const checkConnection = async () => {
            const result: any = {
                env: {
                    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
                    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
                    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
                },
                firestore: {
                    connected: false,
                    error: null,
                    docsFound: 0
                }
            };

            try {
                // Try to fetch 1 conversation
                const q = query(collection(db, 'conversations'), limit(1));
                const snap = await getDocs(q);
                result.firestore.connected = true;
                result.firestore.docsFound = snap.size;
            } catch (e: any) {
                result.firestore.error = e.message;
                console.error('Firestore connection error:', e);
            }

            setStatus({ loading: false, ...result });
        };

        checkConnection();
    }, []);

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Frontend Debug</h1>

            <div className="bg-white p-6 rounded-lg shadow space-y-6">
                <div>
                    <h2 className="font-semibold mb-2">Environment Variables</h2>
                    <pre className="bg-gray-100 p-4 rounded text-sm">
                        {JSON.stringify(status.env, null, 2)}
                    </pre>
                </div>

                <div>
                    <h2 className="font-semibold mb-2">Firestore Connection (Client SDK)</h2>
                    <div className={`p-4 rounded ${status.firestore?.connected ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {status.loading ? 'Checking...' : (
                            <>
                                <p><strong>Connected:</strong> {status.firestore?.connected ? 'Yes' : 'No'}</p>
                                <p><strong>Docs Found:</strong> {status.firestore?.docsFound}</p>
                                {status.firestore?.error && (
                                    <p className="mt-2 text-red-600"><strong>Error:</strong> {status.firestore.error}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
