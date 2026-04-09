import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * PATCH /api/conversation/[conversationId]/display-name
 * Actualiza el nombre visible manual de una conversación.
 * Establece displayNameSource = 'manual' para tener prioridad absoluta.
 *
 * IMPL-20260409-01 — SPEC-ARCH-20260409-11
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const displayName: string | undefined = body?.displayName;

    if (typeof displayName !== "string" || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: "displayName must be a non-empty string" },
        { status: 400 },
      );
    }

    if (displayName.trim().length > 120) {
      return NextResponse.json(
        { error: "displayName must not exceed 120 characters" },
        { status: 400 },
      );
    }

    const convRef = adminDb.collection("conversations").doc(conversationId);
    const snap = await convRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    await convRef.update({
      displayName: displayName.trim(),
      displayNameSource: "manual",
    });

    return NextResponse.json({ success: true, displayName: displayName.trim() });
  } catch (error: any) {
    console.error("[display-name] Error updating display name:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
