// src/app/api/conversation/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { notifyAgentManualAssignment } from "@/lib/aiProvider";

/**
 * POST /api/conversation/assign
 * Assigns a conversation to a specific agent (human or AI).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, agentId, agentName } = body;

    if (!conversationId || !agentId) {
      return NextResponse.json(
        { error: "Missing conversationId or agentId" },
        { status: 400 },
      );
    }

    const convRef = adminDb.collection("conversations").doc(conversationId);

    // If assigning to a human, we also clear the needsHuman flag
    const updateData: any = {
      assignedTo: agentId,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (agentId !== "ai") {
      updateData.needsHuman = false;
      updateData.unreadCount = 0; // IMPL-20260506-03: limpiar badge al asignar a humano
      // Guardar nombre del agente para mostrar en UI
      if (agentName) {
        updateData.assignedToName = agentName;
      }
    } else {
      // Si vuelve a IA, limpiar el nombre del agente
      updateData.assignedToName = null;
    }

    await convRef.update(updateData);

    // FIX-20260506-01: Notificar por WhatsApp al agente cuando se asigna manualmente.
    // No interrumpir la respuesta si la notificación falla.
    let waNotification: { sent: boolean; reason?: string } | null = null;
    if (agentId !== "ai") {
      try {
        waNotification = await notifyAgentManualAssignment(conversationId, agentId);
      } catch (waErr) {
        console.error("[assign] Error en notificación WA (no crítico):", waErr);
        waNotification = { sent: false, reason: "exception" };
      }
    }

    return NextResponse.json({
      message: "Conversation assigned",
      conversationId,
      assignedTo: agentId,
      assignedToName: agentName,
      waNotification,
    });
  } catch (error) {
    console.error("Error assigning conversation:", error);
    return NextResponse.json(
      { error: "Failed to assign conversation" },
      { status: 500 },
    );
  }
}
