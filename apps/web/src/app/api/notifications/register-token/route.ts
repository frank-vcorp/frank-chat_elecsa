// src/app/api/notifications/register-token/route.ts
// Guarda el token FCM del dispositivo en el perfil del agente en Firestore.
// @intervention ARCH-20260423-01
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(idToken);
    const agentId = decoded.uid;

    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    // Guardar token en el array fcmTokens del agente (sin duplicados)
    const agentRef = adminDb.collection("agents").doc(agentId);
    await agentRef.update({
      fcmTokens: FieldValue.arrayUnion(token),
      fcmUpdatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[FCM] Token registrado para agente ${agentId}`);
    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[FCM] Error registrando token:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
