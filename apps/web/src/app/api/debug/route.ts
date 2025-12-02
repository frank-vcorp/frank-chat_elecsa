import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        // 1. Check Environment Variables
        const envCheck = {
            TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing',
            TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing',
            TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER ? 'Set' : 'Missing',
            OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Missing',
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
            FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
            FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing',
        };

        // 2. Check Database Connection & Agents
        let agents = [];
        try {
            const agentsSnap = await adminDb.collection('agents').get();
            agents = agentsSnap.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                type: doc.data().type,
                hasPrompt: !!doc.data().prompt
            }));
        } catch (dbError: any) {
            return NextResponse.json({
                status: 'Error connecting to Firestore',
                error: dbError.message,
                env: envCheck
            }, { status: 500 });
        }

        // 3. Check specific "sofia" agent
        const sofia = agents.find(a => a.id === 'sofia' || a.name.toLowerCase().includes('sofia'));

        return NextResponse.json({
            status: 'Online',
            environment: envCheck,
            database: {
                connected: true,
                agentCount: agents.length,
                agentsFound: agents,
                sofiaDetected: !!sofia
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 'Critical Error',
            error: error.message
        }, { status: 500 });
    }
}
