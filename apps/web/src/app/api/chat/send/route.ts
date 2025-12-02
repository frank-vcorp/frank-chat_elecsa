import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendWhatsAppMessage } from '@/lib/twilio';
import { Message, Conversation } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { conversationId, content } = await request.json();

        if (!conversationId || !content) {
            return NextResponse.json({ error: 'Missing conversationId or content' }, { status: 400 });
        }

        // 1. Get Conversation to find contact phone number
        const convRef = adminDb.collection('conversations').doc(conversationId);
        const convSnap = await convRef.get();

        if (!convSnap.exists) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const convData = convSnap.data() as Conversation;
        const phoneNumber = convData.contactId; // Assuming contactId is phoneNumber

        // 2. Send via Twilio
        await sendWhatsAppMessage(phoneNumber, content);

        // 3. Save to Firestore
        const messagesRef = adminDb.collection('messages');
        const newMessageRef = messagesRef.doc();
        const newMessage: Message = {
            id: newMessageRef.id,
            conversationId,
            senderId: 'human-agent', // TODO: Get actual agent ID from auth context if passed
            senderType: 'agent',
            content,
            contentType: 'text',
            createdAt: FieldValue.serverTimestamp() as any,
            status: 'sent',
        };

        await newMessageRef.set(newMessage);

        // 4. Update Conversation
        await convRef.update({
            lastMessage: content,
            lastMessageAt: FieldValue.serverTimestamp(),
            assignedTo: 'agent', // Mark as handled by human
            unreadCount: 0, // Reset unread count since we replied
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
