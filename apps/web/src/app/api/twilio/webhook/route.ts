import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Message, Conversation, Contact } from "@/lib/types";
import {
  getSofiaResponse,
  handOffToHuman,
  detectBranchByCity,
  detectEstadoSinSucursal,
  getBranchesListText,
  normalizeText,
  getAllCities,
} from "@/lib/aiProvider";
import {
  sendWhatsAppMessage,
  humanDelay,
  splitForWhatsApp,
} from "@/lib/twilio";

/** Detecta si Sofia indica escalación a humano (semáforo rojo)
 * FIX REFERENCE: FIX-20250128-01
 */
function detectEscalation(response: string): boolean {
  const escalationPatterns = [
    /\[SEMÁFORO:\s*ROJO\]/i,
    /transferir|transfiero/i, // Cualquier variante de transferir
    /realizo la transferencia/i, // Frase exacta que usa Sofía
    /te comunico con|te paso con/i, // Frases de handoff
    /comunic.*humano|conectar.*asesor/i,
    /escalando.*conversación/i,
    /un asesor.*te (ayude|contactar|atender|llama|contacta)/i, // Aumentado: "te llama", "te contacta"
    /en breve te (contactarán|llaman|llamaran)/i, // Aumentado: "te llaman"
    /el equipo de.*te (llama|contacta)/i, // "El equipo de Querétaro te llama"
    /te van a llamar/i, // Frase común
    /urgencia|urgente|emergencia/i, // Palabras clave de usuario (Direct Red Light)
  ];
  return escalationPatterns.some((pattern) => pattern.test(response));
}

/** Extrae menciones de ciudades en el mensaje del usuario o historial */
function extractCityMention(text: string): string | null {
  // Lista de ciudades/términos a detectar (ordenadas por especificidad)
  // Nota: normalizeText maneja acentos y getAllCities viene ordenado por longitud
  const cityPatterns = getAllCities();

  const normalized = normalizeText(text);
  for (const city of cityPatterns) {
    if (normalized.includes(city)) {
      return city;
    }
  }
  return null;
}

/**
 * Twilio webhook endpoint for incoming WhatsApp messages.
 * Logs every request to the `system_logs` Firestore collection and processes
 * contacts, conversations, messages, and optional AI replies.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const profileName = formData.get("ProfileName") as string;
    const messageStatus = formData.get("MessageStatus") as string;
    const to = formData.get("To") as string; // The number we sent the message to (our bot)

    // ----------------------------------------------------------------------
    // 0. Handle Status Callbacks (Sent, Delivered, Read)
    // ----------------------------------------------------------------------
    if (messageStatus) {
      console.log(`[Webhook] Status update: ${messageStatus}`);
      await adminDb.collection("system_logs").add({
        type: "webhook_status",
        status: messageStatus,
        timestamp: FieldValue.serverTimestamp(),
      });
      return new NextResponse("OK", { status: 200 });
    }

    // ----------------------------------------------------------------------
    // 1. Log incoming request
    // ----------------------------------------------------------------------
    await adminDb.collection("system_logs").add({
      type: "webhook_incoming",
      from,
      body,
      profileName,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Validate required fields
    if (!from || !body) {
      console.error("[Webhook] Missing From or Body");
      await adminDb.collection("system_logs").add({
        type: "webhook_error",
        error: "Missing From or Body",
        timestamp: FieldValue.serverTimestamp(),
      });
      return NextResponse.json(
        { error: "Missing From or Body" },
        { status: 400 },
      );
    }

    // Strip the "whatsapp:" prefix to get the raw phone number
    const phoneNumber = from.replace("whatsapp:", "");

    // ----------------------------------------------------------------------
    // 2. Get or Create Contact
    // ----------------------------------------------------------------------
    const contactRef = adminDb.collection("contacts").doc(phoneNumber);
    const contactSnap = await contactRef.get();
    if (!contactSnap.exists) {
      console.log("[Webhook] Creating new contact");
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
    const conversationsRef = adminDb.collection("conversations");
    const activeConvQuery = await conversationsRef
      .where("contactId", "==", phoneNumber)
      .where("status", "==", "open")
      .limit(1)
      .get();

    let conversationId: string;
    if (activeConvQuery.empty) {
      console.log("[Webhook] Creating new conversation");
      const newConvRef = conversationsRef.doc();
      conversationId = newConvRef.id;
      // IMPL-20260409-01: Poblar displayName desde WhatsApp si existe (SPEC-ARCH-20260409-11)
      const newConversation: Conversation = {
        id: conversationId,
        contactId: phoneNumber,
        status: "open",
        assignedTo: "ai",
        lastMessage: body,
        lastMessageAt: FieldValue.serverTimestamp() as any,
        unreadCount: 1,
        ...(profileName
          ? { displayName: profileName, displayNameSource: "whatsapp" }
          : {}),
      };
      await newConvRef.set(newConversation);
    } else {
      console.log("[Webhook] Updating existing conversation");
      const convDoc = activeConvQuery.docs[0];
      conversationId = convDoc.id;
      // IMPL-20260409-11-B: Backfill displayName si la conversación existente aún no tiene nombre visible
      const existingData = convDoc.data();
      const backfillName: Record<string, unknown> = {};
      if (!existingData.displayName && profileName) {
        backfillName.displayName = profileName;
        backfillName.displayNameSource = "whatsapp";
      }
      await convDoc.ref.update({
        lastMessage: body,
        lastMessageAt: FieldValue.serverTimestamp(),
        unreadCount: FieldValue.increment(1),
        // Ensure the conversation stays assigned to whoever it was assigned to (AI, human, or branch)
        assignedTo: convDoc.data().assignedTo || "ai",
        ...backfillName,
      });
    }

    // ----------------------------------------------------------------------
    // 4. Save Incoming Message
    // ----------------------------------------------------------------------
    const messagesRef = adminDb.collection("messages");
    const newMessageRef = messagesRef.doc();
    const newMessage: Message = {
      id: newMessageRef.id,
      conversationId,
      senderId: phoneNumber,
      senderType: "contact",
      content: body,
      contentType: "text",
      createdAt: FieldValue.serverTimestamp() as any,
      status: "delivered",
    };
    await newMessageRef.set(newMessage);

    // ----------------------------------------------------------------------
    // 5. AI Auto‑Response (ONLY IF ASSIGNED TO AI)
    // ----------------------------------------------------------------------
    // Get current assignment status
    const currentConv = (
      await adminDb.collection("conversations").doc(conversationId).get()
    ).data();
    const isAssignedToAi = currentConv?.assignedTo === "ai";

    // ------------------------------------------------------------------
    // EARLY WARNING SYSTEM: Detectar ciudad y asignar sucursal INMEDIATAMENTE
    // FIX ARCH-20260422-02: Ejecutar ANTES del early-return por !isAssignedToAi.
    // Caso: Sofía escaló sin ciudad conocida → branch="general". En el siguiente
    // mensaje el cliente dice su ciudad, pero el webhook retornaba antes de detectarla.
    // Ahora actualizamos el branch incluso cuando la conversación ya está en mano humana.
    // ------------------------------------------------------------------
    const earlyCity = extractCityMention(body);
    const earlyBranch = earlyCity ? detectBranchByCity(earlyCity) : null;

    if (earlyBranch && currentConv?.branch !== earlyBranch) {
      console.log(
        `[Webhook] Early Warning: City '${earlyCity}' detected. Assigning to branch '${earlyBranch}'.`,
      );
      const conversationRef = adminDb
        .collection("conversations")
        .doc(conversationId);

      if (isAssignedToAi) {
        // IA activa: marcar needsHuman para que suene la alarma 🚨
        await conversationRef.update({
          branch: earlyBranch,
          needsHuman: true,
        });
      } else {
        // Conversación ya en mano humana: solo corregir el branch sin tocar needsHuman
        await conversationRef.update({ branch: earlyBranch });
      }
    }

    if (!isAssignedToAi) {
      console.log(
        `[Webhook] Conversation assigned to ${currentConv?.assignedTo}, skipping AI response.`,
      );
      return NextResponse.json({
        status: "success",
        message: "Message saved, AI skipped",
      });
    }

    console.log("[Webhook] Triggering AI response");

    try {
      const sofiaReply = await getSofiaResponse(
        body,
        conversationId,
        phoneNumber,
      );
      if (sofiaReply) {
        // --- Social Robotics: delay humano + split de mensajes ---
        const chunks = splitForWhatsApp(sofiaReply);
        const fullReply = sofiaReply; // Guardar respuesta completa para Firestore

        for (let i = 0; i < chunks.length; i++) {
          // Delay humano REDUCIDO para evitar timeout en Vercel (Max 1s)
          // await humanDelay(chunks[i].length);
          await new Promise((r) => setTimeout(r, 1000));

          try {
            console.log(
              `[Webhook] Sending AI chunk ${i + 1}/${chunks.length} via Twilio`,
            );
            await sendWhatsAppMessage(phoneNumber, chunks[i], to);
          } catch (twilioError) {
            const err = (twilioError as any).message || "unknown";
            await sendWhatsAppMessage(
              phoneNumber,
              `⚠️ Error enviando parte ${i + 1}: ${err}`,
              to,
            );
          }
        }

        // Guardar respuesta completa en Firestore (no fragmentada)
        const sofiaMsgRef = messagesRef.doc();
        await sofiaMsgRef.set({
          id: sofiaMsgRef.id,
          conversationId,
          senderId: "sofia",
          senderType: "agent",
          content: fullReply,
          contentType: "text",
          createdAt: FieldValue.serverTimestamp() as any,
          status: "sent",
        } as Message);

        // Update the conversation's last message with Sofia's reply
        const convSnap = await adminDb
          .collection("conversations")
          .doc(conversationId)
          .get();
        await convSnap.ref.update({
          lastMessage: chunks[chunks.length - 1], // Último chunk como preview
          lastMessageAt: FieldValue.serverTimestamp(),
        });

        // --------------------------------------------------------------
        // 5.1 Detect escalation and route to correct branch
        // --------------------------------------------------------------
        // --------------------------------------------------------------
        // 5.1 Detect escalation (in User Input OR AI Response)
        // --------------------------------------------------------------
        const isUserEscalating = detectEscalation(body);
        const isAiEscalating = detectEscalation(sofiaReply);

        if (isUserEscalating || isAiEscalating) {
          console.log(
            `[Webhook] Escalation detected (User: ${isUserEscalating}, AI: ${isAiEscalating})`,
          );

          // Try to detect city from user's message or sofia's reply
          const detectedCity =
            extractCityMention(body) || extractCityMention(sofiaReply);
          const branch = detectedCity ? detectBranchByCity(detectedCity) : null;

          console.log(
            `[Webhook] Detected city: ${detectedCity}, Branch: ${branch}`,
          );

          // Si detectamos un estado sin sucursal propia, enviar mensaje con opciones
          const estadoSinSucursal = detectEstadoSinSucursal(body);
          if (estadoSinSucursal && !branch) {
            console.log(
              `[Webhook] Estado sin sucursal detectado: ${estadoSinSucursal}`,
            );

            // Enviar mensaje con opciones (directo de aiProvider)
            await sendWhatsAppMessage(phoneNumber, estadoSinSucursal, to);

            // Guardar mensaje en Firestore
            const optionsMsgRef = messagesRef.doc();
            await optionsMsgRef.set({
              id: optionsMsgRef.id,
              conversationId,
              senderId: "sofia",
              senderType: "agent",
              content: estadoSinSucursal,
              contentType: "text",
              createdAt: FieldValue.serverTimestamp() as any,
              status: "sent",
            } as Message);

            // NO asignamos a humano: IA sigue activa esperando que el cliente elija ciudad.
            console.log(
              "[Webhook] Waiting for user branch selection (AI remains active)",
            );
          } else if (!branch) {
            // FIX ARCH-20260422-02: Sofía escaló pero no se detectó ciudad todavía
            // (el cliente aún no la dijo). Mantener IA activa para que atrape la ciudad
            // en el siguiente mensaje y ejecute el handoff a la sucursal correcta.
            // NO llamar handOffToHuman() sin sucursal: resultaría en branch="general"
            // y la conversación flotaría sin agente asignado.
            console.log(
              "[Webhook] Escalation detected but no city yet — keeping AI active to capture city in next turn.",
            );
          } else {
            // Ciudad y sucursal conocidas: handoff completo a la sucursal correcta.
            await handOffToHuman(
              conversationId,
              `Sofia escaló la conversación. Ciudad detectada: ${detectedCity}`,
              detectedCity!,
            );
          }
        }
      } else {
        console.log("[Webhook] AI did not generate a reply.");
      }
    } catch (aiError) {
      console.error("[Webhook] AI/Twilio error:", aiError);

      // Send error to user for debugging (Only in dev/test)
      const errorMsg = (aiError as any).message || "unknown error";
      await sendWhatsAppMessage(
        phoneNumber,
        `⚠️ Error técnico: ${errorMsg}`,
        to,
      );

      await adminDb.collection("system_logs").add({
        type: "webhook_ai_error",
        error: errorMsg,
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    // ----------------------------------------------------------------------
    // 6. Log successful processing
    // ----------------------------------------------------------------------
    await adminDb.collection("system_logs").add({
      type: "webhook_success",
      from,
      action: "Message processed",
      timestamp: FieldValue.serverTimestamp(),
    });

    // Respond to Twilio with an empty <Response> to acknowledge receipt
    return new NextResponse("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error: any) {
    console.error("[Webhook] Critical error:", error);
    await adminDb.collection("system_logs").add({
      type: "webhook_critical_error",
      error: error.message || "unknown",
      stack: error.stack,
      timestamp: FieldValue.serverTimestamp(),
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
