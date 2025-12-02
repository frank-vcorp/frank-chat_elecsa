
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Message, Conversation, Contact } from '@/lib/types';
import { getSofiaResponse } from '@/lib/aiProvider';
import { sendWhatsAppMessage } from '@/lib/twilio';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = formData.get('Body') as string;
        const profileName = formData.get('ProfileName') as string;
        // const mediaUrl = formData.get('MediaUrl0') as string; // TODO: Handle media

        const messageStatus = formData.get('MessageStatus') as string;

        // ----------------------------------------------------------------------
        // 0. Handle Status Callbacks (Sent, Delivered, Read)
        // ----------------------------------------------------------------------
        if (messageStatus) {
            console.log(`[Webhook] Status update: ${messageStatus}`);
            return new NextResponse('OK', { status: 200 });
        }

        // LOGGING: Incoming Request
        await adminDb.collection('system_logs').add({
            type: 'webhook_incoming',
            from,
            body,
            timestamp: FieldValue.serverTimestamp(),
            details: 'Received message from Twilio'
        });

        if (!from || !body) {
            console.error('[Webhook] Missing From or Body');
            await adminDb.collection('system_logs').add({
                type: 'webhook_error',
                error: 'Missing From or Body',
                timestamp: FieldValue.serverTimestamp()
            });
            return NextResponse.json({ error: 'Missing From or Body' }, { status: 400 });
        }

        // ... (rest of the logic) ...

        // LOGGING: Success
        await adminDb.collection('system_logs').add({
            type: 'webhook_success',
            from,
            action: 'Message processed',
            timestamp: FieldValue.serverTimestamp()
        });

        return new NextResponse('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' },
        });
    } catch (error: any) {
        console.error('[Webhook] Critical Error:', error);

        // LOGGING: Critical Error
        await adminDb.collection('system_logs').add({
            type: 'webhook_critical_error',
            error: error.message || 'Unknown error',
            stack: error.stack,
            timestamp: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Strip 'whatsapp:' prefix to get the raw phone number
const phoneNumber = from.replace('whatsapp:', '');

// ----------------------------------------------------------------------
// 1. Get or Create Contact
// ----------------------------------------------------------------------
console.log(`[Webhook] Processing message from ${phoneNumber}`);

const contactRef = adminDb.collection('contacts').doc(phoneNumber);
const contactSnap = await contactRef.get();

if (!contactSnap.exists) {
    console.log('[Webhook] Creating new contact');
    const newContact: Contact = {
        id: phoneNumber,
        name: profileName || phoneNumber,
        phoneNumber,
        createdAt: FieldValue.serverTimestamp() as any,
        lastSeen: FieldValue.serverTimestamp() as any,
    };
    await contactRef.set(newContact);
} else {
    await contactRef.update({
        lastSeen: FieldValue.serverTimestamp(),
    });
}

// ----------------------------------------------------------------------
// 2. Find or Create Conversation
// ----------------------------------------------------------------------
const conversationsRef = adminDb.collection('conversations');
const activeConvQuery = await conversationsRef
    .where('contactId', '==', phoneNumber)
    .where('status', '==', 'open')
    .limit(1)
    .get();

let conversationId: string;

if (activeConvQuery.empty) {
    console.log('[Webhook] Creating new conversation');
    const newConvRef = conversationsRef.doc();
    conversationId = newConvRef.id;
    const newConversation: Conversation = {
        id: conversationId,
        contactId: phoneNumber,
        status: 'open',
        assignedTo: 'ai',
        lastMessage: body,
        lastMessageAt: FieldValue.serverTimestamp() as any,
        unreadCount: 1,
    };
    await newConvRef.set(newConversation);
} else {
    console.log('[Webhook] Updating existing conversation');
    const convDoc = activeConvQuery.docs[0];
    conversationId = convDoc.id;
    await convDoc.ref.update({
        lastMessage: body,
        lastMessageAt: FieldValue.serverTimestamp(),
        unreadCount: FieldValue.increment(1),
    });
}

// ----------------------------------------------------------------------
// 3. Save Message
// ----------------------------------------------------------------------
console.log('[Webhook] Saving incoming message');
const messagesRef = adminDb.collection('messages');
const newMessageRef = messagesRef.doc();
const newMessage: Message = {
    id: newMessageRef.id,
    conversationId,
    senderId: phoneNumber,
    senderType: 'contact',
    content: body,
    contentType: 'text',
    createdAt: FieldValue.serverTimestamp() as any,
    status: 'delivered',
};

await newMessageRef.set(newMessage);

// ----------------------------------------------------------------------
// 4. AI Logic (Auto-Response)
// ----------------------------------------------------------------------
const currentConvSnap = await adminDb.collection('conversations').doc(conversationId).get();
const currentConvData = currentConvSnap.data() as Conversation;

const to = formData.get('To') as string; // The number the user sent the message TO (our bot)

// ... (existing code)

if (!currentConvData.assignedTo || currentConvData.assignedTo === 'ai') {
    console.log('[Webhook] Triggering AI response');
    try {
        const sofiaReply = await getSofiaResponse(body, conversationId, phoneNumber);
        console.log('[Webhook] AI Reply generated:', sofiaReply ? 'Yes' : 'No');

        if (sofiaReply) {
            console.log('[Webhook] Sending WhatsApp message via Twilio');
            // Use the 'To' number from the incoming message as the sender for the reply
            // This ensures we reply from the correct channel (Sandbox or Production)
            await sendWhatsAppMessage(phoneNumber, sofiaReply, to);

            const sofiaMsgRef = messagesRef.doc();
            await sofiaMsgRef.set({
                id: sofiaMsgRef.id,
                conversationId,
                senderId: 'sofia',
                senderType: 'agent',
                content: sofiaReply,
                contentType: 'text',
                createdAt: FieldValue.serverTimestamp() as any,
                status: 'sent',
            } as Message);

            await currentConvSnap.ref.update({
                lastMessage: sofiaReply,
                lastMessageAt: FieldValue.serverTimestamp(),
            });
            console.log('[Webhook] AI response sent and saved');
        }
    } catch (aiError) {
        console.error('[Webhook] Error in AI/Twilio logic:', aiError);
        // We don't fail the request, just log the error
    }
} else {
    console.log('[Webhook] Conversation assigned to human, skipping AI');
}

return new NextResponse('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
});
    } catch (error) {
    console.error('[Webhook] Critical Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
}
