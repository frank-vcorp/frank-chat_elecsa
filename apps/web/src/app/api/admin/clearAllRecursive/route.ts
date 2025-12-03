// src/app/api/admin/clearAllRecursive/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Delete all documents in a collection in batches of 500 (Firestore limit).
 */
async function deleteCollection(collectionPath: string) {
    const batchSize = 500;
    const collectionRef = adminDb.collection(collectionPath);
    const query = collectionRef.limit(batchSize);
    const snapshot = await query.get();
    if (snapshot.empty) return 0;
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    // Recursively delete remaining docs
    return snapshot.size + (await deleteCollection(collectionPath));
}

export async function POST() {
    try {
        const deletedMessages = await deleteCollection('messages');
        const deletedConversations = await deleteCollection('conversations');
        // Optionally also clear alerts and logs
        const deletedAlerts = await deleteCollection('alerts');
        const deletedLogs = await deleteCollection('system_logs');
        return NextResponse.json({
            status: 'ok',
            deletedMessages,
            deletedConversations,
            deletedAlerts,
            deletedLogs,
        });
    } catch (error: any) {
        console.error('Error clearing collections:', error);
        return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
    }
}
