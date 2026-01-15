// src/app/api/agent/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid build-time Firebase initialization
export const dynamic = 'force-dynamic';

/**
 * POST /api/agent/test
 * Tests an agent's prompt with a given message.
 * Body: { agentId, message }
 */
export async function POST(request: NextRequest) {
    try {
        // Lazy import to avoid build-time initialization
        const { testAgentWithContext } = await import('@/lib/aiProvider');
        
        const body = await request.json();
        const { agentId, message } = body;

        if (!agentId || !message) {
            return NextResponse.json({ error: 'Missing agentId or message' }, { status: 400 });
        }

        // Make the agent respond, including current context documents
        const response = await testAgentWithContext(agentId, message);

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('Error testing agent:', error);
        return NextResponse.json({
            error: error.message || 'Failed to test agent',
            details: error
        }, { status: 500 });
    }
}
