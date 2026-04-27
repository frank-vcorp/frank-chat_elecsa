// src/app/api/sofia/test/route.ts
// Endpoint de prueba para Sofía — solo disponible para usuarios autenticados (admin).
// Permite probar respuestas de Sofía con texto y/o URL de archivo adjunto.
// @intervention ARCH-20260427-03
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getSofiaResponse } from "@/lib/aiProvider";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    await adminAuth.verifyIdToken(idToken);

    const body = await request.json();
    const { message, mediaUrl, mimeType } = body as {
      message?: string;
      mediaUrl?: string;
      mimeType?: string;
    };

    if (!message && !mediaUrl) {
      return NextResponse.json(
        { error: "Debes enviar un mensaje o una URL de archivo" },
        { status: 400 }
      );
    }

    const mediaInfo =
      mediaUrl && mimeType ? { url: mediaUrl, mimeType } : null;

    const reply = await getSofiaResponse(
      message ?? "",
      "test-preview-conversation",
      "test-preview-phone",
      mediaInfo,
    );

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("[SofiaTest] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
