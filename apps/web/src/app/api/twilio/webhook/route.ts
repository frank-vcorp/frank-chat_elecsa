
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

        if (!from || !body) {
            return NextResponse.json({ error: 'Missing From or Body' }, { status: 400 });
        }

        // Strip 'whatsapp:' prefix to get the raw phone number
        const phoneNumber = from.replace('whatsapp:', '');

        // ----------------------------------------------------------------------
        // 1. Get or Create Contact
        // ----------------------------------------------------------------------
        // We check if the contact already exists in our 'contacts' collection.
        // If not, we create a new record with their profile name and phone number.
        const contactRef = adminDb.collection('contacts').doc(phoneNumber);
        const contactSnap = await contactRef.get();

        if (!contactSnap.exists) {
            const newContact: Contact = {
                id: phoneNumber,
                name: profileName || phoneNumber,
                phoneNumber,
                createdAt: FieldValue.serverTimestamp() as any,
                lastSeen: FieldValue.serverTimestamp() as any,
            };
            await contactRef.set(newContact);
        } else {
            // Update lastSeen timestamp for existing contacts
            await contactRef.update({
                lastSeen: FieldValue.serverTimestamp(),
                // Update name if provided and different? Maybe not to overwrite manual edits.
            });
        }

        // ----------------------------------------------------------------------
        // 2. Find or Create Conversation
        // ----------------------------------------------------------------------
        // We look for an active ('open') conversation for this contact.
        // If none exists, we start a new one. This groups messages into sessions.
        const conversationsRef = adminDb.collection('conversations');
        const activeConvQuery = await conversationsRef
            .where('contactId', '==', phoneNumber)
            .where('status', '==', 'open')
            .limit(1)
            .get();

        let conversationId: string;

        if (activeConvQuery.empty) {
            // Create new conversation
            const newConvRef = conversationsRef.doc();
            conversationId = newConvRef.id;
            const newConversation: Conversation = {
                id: conversationId,
                contactId: phoneNumber,
                status: 'open',
                lastMessage: body,
                lastMessageAt: FieldValue.serverTimestamp() as any,
                unreadCount: 1,
            };
            await newConvRef.set(newConversation);
        } else {
            // Update existing conversation with latest message preview
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
        // Store the actual message content in the 'messages' sub-collection (or root collection linked by ID).
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
        // If the conversation is NOT assigned to a human agent (or explicitly assigned to 'ai'),
        // we trigger the AI to generate a response.

        // Fetch fresh conversation data to check assignment status
        const currentConvSnap = await adminDb.collection('conversations').doc(conversationId).get();
        const currentConvData = currentConvSnap.data() as Conversation;

        if (!currentConvData.assignedTo || currentConvData.assignedTo === 'ai') {
            // Let Sofia handle the incoming message, including hand‑off logic.
            const sofiaReply = await getSofiaResponse(body, conversationId, phoneNumber);

            if (sofiaReply) {
                // Send reply via Twilio
                await sendWhatsAppMessage(phoneNumber, sofiaReply);

                // Save Sofia's message to Firestore
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

                // Update conversation metadata (lastMessage, timestamp). Hand‑off may have updated assignedTo.
                await currentConvSnap.ref.update({
                    lastMessage: sofiaReply,
                    lastMessageAt: FieldValue.serverTimestamp(),
                    // Preserve assignedTo if hand‑off changed it; otherwise keep existing.
                });
            }
        }

        // Return success to Twilio
        return new NextResponse('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' },
        });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
