import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { Message, Conversation } from "@/lib/types";
import {
  handOffToHuman,
  CONCRETE_BRANCH_IDS,
  assigneeIsBranchPlaceholder,
} from "@/lib/aiProvider";

export async function POST(request: NextRequest) {
  try {
    const { conversationId, content, mediaUrl, mediaType } =
      await request.json();

    if (!conversationId || (!content && !mediaUrl)) {
      return NextResponse.json(
        { error: "Missing conversationId or content/media" },
        { status: 400 },
      );
    }

    // 1. Get Conversation to find contact phone number
    const convRef = adminDb.collection("conversations").doc(conversationId);
    const convSnap = await convRef.get();

    if (!convSnap.exists) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const convData = convSnap.data() as Conversation;
    const phoneNumber = convData.contactId; // Assuming contactId is phoneNumber

    // 2. Send via Twilio (with optional media)
    await sendWhatsAppMessage(phoneNumber, content || "", undefined, mediaUrl);

    // 3. Determine content type
    let contentType: "text" | "image" | "document" | "video" | "audio" = "text";
    if (mediaType) {
      if (mediaType.startsWith("image/")) contentType = "image";
      else if (mediaType.startsWith("video/")) contentType = "video";
      else if (mediaType.startsWith("audio/")) contentType = "audio";
      else if (mediaType === "application/pdf") contentType = "document";
    }

    // 4. Save to Firestore
    const messagesRef = adminDb.collection("messages");
    const newMessageRef = messagesRef.doc();
    const newMessage: Message = {
      id: newMessageRef.id,
      conversationId,
      senderId: "human-agent", // TODO: Get actual agent ID from auth context if passed
      senderType: "agent",
      content: content || "",
      contentType,
      createdAt: FieldValue.serverTimestamp() as any,
      status: "sent",
      ...(mediaUrl && { mediaUrl }),
    };

    await newMessageRef.set(newMessage);

    // Si el chat ya tiene sucursal pero sigue en Sofía, en "human" o en el id
    // de la sucursal, responder desde el dashboard no debe dejarlo sin agente.
    const branch = convData.branch;
    const shouldAssignBranchAgent =
      Boolean(phoneNumber) &&
      Boolean(branch && CONCRETE_BRANCH_IDS.has(branch)) &&
      (!convData.assignedTo ||
        convData.assignedTo === "ai" ||
        assigneeIsBranchPlaceholder(convData.assignedTo));

    let handedOff = false;
    if (shouldAssignBranchAgent) {
      try {
        await handOffToHuman(
          conversationId,
          "Respuesta enviada desde el dashboard sin agente de sucursal",
          undefined,
          {
            phone: phoneNumber,
            name: convData.displayName,
            lastMessage: content || undefined,
            mediaUrl: mediaUrl || undefined,
            mediaMimeType: mediaType || undefined,
          },
        );
        handedOff = true;
      } catch (assignError) {
        console.error("[chat/send] No se pudo asignar agente de sucursal:", assignError);
      }
    }

    const updateData: Record<string, unknown> = {
      lastMessage: content || (mediaUrl ? "📎 Archivo adjunto" : ""),
      lastMessageAt: FieldValue.serverTimestamp(),
      needsHuman: false,
      unreadCount: 0, // Reset unread count since we replied
    };
    // No pisar el uid que acaba de escribir handOffToHuman.
    if (!handedOff) {
      updateData.assignedTo =
        convData.assignedTo && convData.assignedTo !== "ai"
          ? convData.assignedTo
          : "human";
    }

    // 5. Update Conversation
    await convRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
