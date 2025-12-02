import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Simple test endpoint to verify that the webhook URL is reachable from the internet.
 * It logs the incoming request payload to the `system_logs` collection and returns 200.
 */
export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        await adminDb.collection('system_logs').add({
            type: 'webhook_test',
            payload,
            timestamp: FieldValue.serverTimestamp(),
        });
        return new NextResponse('ok', { status: 200 });
    } catch (e) {
        console.error('Webhook test error', e);
        return new NextResponse('error', { status: 500 });
    }
}

export async function GET() {
    // Simple health check
    return new NextResponse('alive', { status: 200 });
}
