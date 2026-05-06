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
    /un asesor.*te (ayude|contactar|atender|llama|contacta)/i,
    /en breve te (contactarán|llaman|llamaran)/i,
    /el equipo de.*te (llama|contacta)/i,
    /te van a llamar/i,
    /urgencia|urgente|emergencia/i,
    // Frases de cotización/propuesta que Sofia usa cuando va a cerrar la venta
    /propuesta formal/i,
    /te (envío|envio|mando|paso|comparto) (la |una |el )?(propuesta|cotización|cotizacion|presupuesto)/i,
    /te env[ií]a (la |una |el )?(propuesta|cotización|cotizacion|presupuesto)/i,
    /el equipo de.*te env[ií]a (la |una |el )?(propuesta|cotización|cotizacion|presupuesto)/i,
    /en unos momentos te (envío|envio|mando|paso|comparto)/i,
    /ya tengo todo.*propuesta/i,
    /cotización lista/i,
    // Frases de "te conecto" / "déjame conectarte" — handoff explícito
    /te conecto con (el |un )?(equipo|asesor|ejecutivo)/i,
    /d[ée]jame conectarte (con|al|directamente)/i,
    /conect[áa]ndote con (el |un )?(equipo|asesor|ejecutivo)/i,
    /seguimiento (directo|personalizado|humano)/i,
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
 * Determina el contentType del mensaje basado en el MIME type de Twilio.
 * @intervention IMPL-20260427-02
 */
function getContentType(mime: string | null): "text" | "image" | "document" | "video" {
  if (!mime) return "text";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf" || mime.startsWith("application/")) return "document";
  return "text";
}

/**
 * FIX-20260506-01 — Respuesta TwiML consistente para Twilio.
 * Respaldo: context/interconsultas/DICTAMEN_FIX-20260506-01.md
 */
function twilioAck(status = 200) {
  return new NextResponse("<Response></Response>", {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
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

    // Capture media fields — MUST be before validation (IMPL-20260427-02)
    const numMedia = parseInt(formData.get("NumMedia") as string || "0", 10);
    const mediaUrl = numMedia > 0 ? (formData.get("MediaUrl0") as string) : null;
    const mediaContentType = numMedia > 0 ? (formData.get("MediaContentType0") as string) : null;

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
      return twilioAck();
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
    if (!from || (!body && numMedia === 0)) {
      console.error("[Webhook] Missing From or Body");
      await adminDb.collection("system_logs").add({
        type: "webhook_error",
        error: "Missing From or Body",
        timestamp: FieldValue.serverTimestamp(),
      });
      return twilioAck(400);
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
      content: body || (mediaUrl ? `[Archivo adjunto: ${mediaContentType}]` : ""),
      contentType: getContentType(mediaContentType),
      ...(mediaUrl ? { mediaUrl, mediaMimeType: mediaContentType } : {}),
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

    if (earlyBranch) {
      console.log(
        `[Webhook] Early Warning: City '${earlyCity}' detected → branch '${earlyBranch}'.`,
      );
      const conversationRef = adminDb
        .collection("conversations")
        .doc(conversationId);

      // FIX-20260506-01: asignación de agente "a prueba de fallas".
      // Si la IA ya estaba pidiendo la sucursal o ya había escalado, en cuanto
      // el cliente menciona su ciudad ejecutamos el handoff completo —
      // sin depender de que Sofía vuelva a generar una frase de escalación.
      if (isAssignedToAi) {
        // ¿El último mensaje de Sofía estaba pidiendo la sucursal o escalando?
        let escalationContextActive = currentConv?.needsHuman === true;
        try {
          const lastMsgsSnap = await adminDb
            .collection("messages")
            .where("conversationId", "==", conversationId)
            .orderBy("createdAt", "desc")
            .limit(5)
            .get();
          const lastSofiaMsg = lastMsgsSnap.docs.find(
            (d) => d.data().senderType === "agent",
          );
          const lastSofiaContent = (lastSofiaMsg?.data().content as string) || "";
          const askedBranch =
            /cu[áa]l de nuestras sucursales|necesito confirmar tu zona|cu[áa]l (sucursal|zona)/i.test(
              lastSofiaContent,
            );
          const wasEscalating = detectEscalation(lastSofiaContent);
          if (askedBranch || wasEscalating) {
            escalationContextActive = true;
          }
          console.log(
            `[Webhook] Early handoff context — needsHuman=${currentConv?.needsHuman} askedBranch=${askedBranch} wasEscalating=${wasEscalating}`,
          );
        } catch (e) {
          console.warn("[Webhook] No se pudo leer último mensaje para handoff temprano:", e);
        }

        if (escalationContextActive) {
          console.log(
            `[Webhook] Early handoff: cliente confirmó '${earlyCity}' → asignando agente de '${earlyBranch}' sin esperar respuesta de Sofía.`,
          );
          await handOffToHuman(
            conversationId,
            `Cliente confirmó sucursal: ${earlyCity}`,
            earlyCity || undefined,
            {
              phone: phoneNumber,
              name: profileName || undefined,
              lastMessage: body || undefined,
              mediaUrl: mediaUrl || undefined,
              mediaMimeType: mediaContentType || undefined,
            },
          );
          // Cortamos aquí: el agente ya fue notificado, evitamos que Sofía siga "conectando".
          return twilioAck();
        }

        // Sin contexto de escalación: solo corregir branch para futura referencia.
        if (currentConv?.branch !== earlyBranch) {
          await conversationRef.update({ branch: earlyBranch });
        }
      } else {
        // Conversación ya en mano humana: corregir branch y reasignar agente si falta.
        if (currentConv?.branch !== earlyBranch) {
          await conversationRef.update({ branch: earlyBranch });
        }
        if (!currentConv?.assignedToName || currentConv?.assignedTo === "human") {
          console.log(
            `[Webhook] Conversación en humano sin agente concreto — re-ejecutando handoff para asignar agente de '${earlyBranch}'.`,
          );
          await handOffToHuman(
            conversationId,
            `Reasignación por ciudad detectada: ${earlyCity}`,
            earlyCity || undefined,
            {
              phone: phoneNumber,
              name: profileName || undefined,
              lastMessage: body || undefined,
              mediaUrl: mediaUrl || undefined,
              mediaMimeType: mediaContentType || undefined,
            },
          );
          return twilioAck();
        }
      }
    }

    if (!isAssignedToAi) {
      console.log(
        `[Webhook] Conversation assigned to ${currentConv?.assignedTo}, skipping AI response.`,
      );
      return twilioAck();
    }

    console.log("[Webhook] Triggering AI response");

    try {
      const sofiaReply = await getSofiaResponse(
        body,
        conversationId,
        phoneNumber,
        mediaUrl && mediaContentType ? { url: mediaUrl, mimeType: mediaContentType } : null,
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
        // 5.1 Detect escalation (in User Input OR AI Response)
        // Imágenes/docs siempre escalan: el agente humano debe cotizar.
        // --------------------------------------------------------------
        const isUserEscalating = detectEscalation(body);
        const isAiEscalating = detectEscalation(sofiaReply);
        const isMediaEscalation = !!mediaUrl; // imagen/PDF siempre va a humano

        if (isUserEscalating || isAiEscalating || isMediaEscalation) {
          console.log(
            `[Webhook] Escalation detected (User: ${isUserEscalating}, AI: ${isAiEscalating}, Media: ${isMediaEscalation})`,
          );

          // Try to detect city from user's message or sofia's reply
          // Fallback: usar el branch ya asignado a la conversación (Early Warning previo)
          const detectedCity =
            extractCityMention(body) || extractCityMention(sofiaReply);
          const branchFromMessage = detectedCity ? detectBranchByCity(detectedCity) : null;
          const branchFromConv = currentConv?.branch && currentConv.branch !== "general"
            ? currentConv.branch
            : null;
          const branch = branchFromMessage || branchFromConv;
          const effectiveCity = detectedCity || (branchFromConv ? `(sucursal: ${branchFromConv})` : null);

          console.log(
            `[Webhook] Detected city: ${detectedCity}, Branch from message: ${branchFromMessage}, Branch from conv: ${branchFromConv}, Effective branch: ${branch}`,
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
            // IMPL-20260506-04: Sucursal desconocida → pedir confirmación explícita al cliente
            // SPEC: SPEC-ARCH-20260506-03_confirmacion-sucursal-ambigua.md
            console.log(
              "[Webhook] Escalation detected but no city/branch — asking client to confirm branch.",
            );
            const branchConfirmMsg =
              `Para canalizarte correctamente con un asesor, necesito confirmar tu zona. ` +
              `¿Cuál de nuestras sucursales te queda mejor?\n\n${getBranchesListText()}\n\n` +
              `Si prefieres, también puedes decirme tu ciudad o estado y yo te indico la sucursal más conveniente.`;

            await sendWhatsAppMessage(phoneNumber, branchConfirmMsg, to);

            const branchConfirmMsgRef = messagesRef.doc();
            await branchConfirmMsgRef.set({
              id: branchConfirmMsgRef.id,
              conversationId,
              senderId: "sofia",
              senderType: "agent",
              content: branchConfirmMsg,
              contentType: "text",
              createdAt: FieldValue.serverTimestamp() as any,
              status: "sent",
            } as Message);

            console.log(
              "[Webhook] Branch confirmation sent. AI remains active awaiting client response.",
            );
          } else {
            // Ciudad o sucursal conocida: handoff completo.
            await handOffToHuman(
              conversationId,
              `Sofia escaló la conversación. Ciudad detectada: ${effectiveCity}`,
              detectedCity || undefined,
              {
                phone: phoneNumber,
                name: profileName || undefined,
                lastMessage: body || undefined,
                mediaUrl: mediaUrl || undefined,
                mediaMimeType: mediaContentType || undefined,
              },
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
    return twilioAck();
  } catch (error: any) {
    console.error("[Webhook] Critical error:", error);
    await adminDb.collection("system_logs").add({
      type: "webhook_critical_error",
      error: error.message || "unknown",
      stack: error.stack,
      timestamp: FieldValue.serverTimestamp(),
    });
    return twilioAck(500);
  }
}
