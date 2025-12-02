import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Message, Conversation, Contact } from '@/lib/types';
import { getSofiaResponse } from '@/lib/aiProvider';
import { sendWhatsAppMessage } from '@/lib/twilio';

/**
 * Twilio webhook endpoint for incoming WhatsApp messages.
 * Logs every request to the `system_logs` Firestore collection and processes
 * contacts, conversations, messages, and optional AI replies.
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = formData.get('Body') as string;
        const profileName = formData.get('ProfileName') as string;
        const messageStatus = formData.get('MessageStatus') as string;
        const to = formData.get('To') as string; // The number we sent the message to (our bot)

        // ----------------------------------------------------------------------
        // 0. Handle Status Callbacks (Sent, Delivered, Read)
        // ----------------------------------------------------------------------
        if (messageStatus) {
            console.log(`[Webhook] Status update: ${messageStatus}`);
            await adminDb.collection('system_logs').add({
                type: 'webhook_status',
                status: messageStatus,
                timestamp: FieldValue.serverTimestamp(),
            });
            return new NextResponse('OK', { status: 200 });
        }

        // ----------------------------------------------------------------------
        // 1. Log incoming request
        // ----------------------------------------------------------------------
        await adminDb.collection('system_logs').add({
            type: 'webhook_incoming',
            from,
            body,
            profileName,
            timestamp: FieldValue.serverTimestamp(),
        });

        // Validate required fields
        if (!from || !body) {
            console.error('[Webhook] Missing From or Body');
            await adminDb.collection('system_logs').add({
                type: 'webhook_error',
                error: 'Missing From or Body',
                timestamp: FieldValue.serverTimestamp(),
            });
            return NextResponse.json({ error: 'Missing From or Body' }, { status: 400 });
        }

        // Strip the "whatsapp:" prefix to get the raw phone number
        const phoneNumber = from.replace('whatsapp:', '');

        // ----------------------------------------------------------------------
        // 2. Get or Create Contact
        // ----------------------------------------------------------------------
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
            await contactRef.update({ lastSeen: FieldValue.serverTimestamp() });
        }

        // ----------------------------------------------------------------------
        // 3. Find or Create Conversation
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
                // Ensure the conversation stays assigned to AI unless explicitly set to human
                assignedTo: convDoc.data().assignedTo === 'human' ? 'human' : 'ai',
            });
        }

        // ----------------------------------------------------------------------
        // 4. Save Incoming Message
        // ----------------------------------------------------------------------
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
        // 5. AI Auto‑Response (if conversation is assigned to AI)
        // ----------------------------------------------------------------------
        const convSnap = await adminDb.collection('conversations').doc(conversationId).get();
        const convData = convSnap.data() as Conversation;
        // Trigger AI unless the conversation is explicitly assigned to a human agent
        if (convData.assignedTo !== 'human') {
            console.log('[Webhook] Triggering AI response');
            try {
                const sofiaReply = await getSofiaResponse(body, conversationId, phoneNumber);
                if (sofiaReply) {
                    console.log('[Webhook] Sending AI reply via Twilio');
                    // Use the original "To" number as the sender to match sandbox/production
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

                    await convSnap.ref.update({
                        lastMessage: sofiaReply,
                        lastMessageAt: FieldValue.serverTimestamp(),
                    });
                }
            } catch (aiError) {
                console.error('[Webhook] AI/Twilio error:', aiError);
                await adminDb.collection('system_logs').add({
                    type: 'webhook_ai_error',
                    error: (aiError as any).message || 'unknown',
                    timestamp: FieldValue.serverTimestamp(),
                });
            }
        } else {
            console.log('[Webhook] Conversation assigned to human, skipping AI');
        }

        // ----------------------------------------------------------------------
        // 6. Log successful processing
        // ----------------------------------------------------------------------
        await adminDb.collection('system_logs').add({
            type: 'webhook_success',
            from,
            action: 'Message processed',
            timestamp: FieldValue.serverTimestamp(),
        });

        // Respond to Twilio with an empty <Response> to acknowledge receipt
        return new NextResponse('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' },
        });
    } catch (error: any) {
        console.error('[Webhook] Critical error:', error);
        await adminDb.collection('system_logs').add({
            type: 'webhook_critical_error',
            error: error.message || 'unknown',
            stack: error.stack,
            timestamp: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
