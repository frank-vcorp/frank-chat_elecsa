// src/app/api/agent/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/agent/test
 * Tests an agent's prompt with a given message.
 * Body: { agentId, message }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agentId, message } = body;

        if (!agentId || !message) {
            return NextResponse.json({ error: 'Missing agentId or message' }, { status: 400 });
        }

        // Fetch the agent's prompt
        const agentSnap = await adminDb.collection('agents').doc(agentId).get();
        if (!agentSnap.exists) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }
        const agentData = agentSnap.data();
        const systemPrompt = agentData?.prompt || 'You are a helpful assistant.';

        // Check for API Key
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API Key is missing in server environment' }, { status: 500 });
        }

        // Call OpenAI
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
            ],
        });

        const response = completion.choices[0].message?.content;

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('Error testing agent:', error);
        return NextResponse.json({
            error: error.message || 'Failed to test agent',
            details: error
        }, { status: 500 });
    }
}
