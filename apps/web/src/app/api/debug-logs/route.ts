import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Returns the latest 20 entries from the `system_logs` collection.
 * Useful for quickly checking if the webhook (or test endpoint) is logging.
 */
export async function GET(request: NextRequest) {
    try {
        const logsSnap = await adminDb
            .collection('system_logs')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        const logs = logsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ logs }, { status: 200 });
    } catch (e) {
        console.error('Debug logs error', e);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
