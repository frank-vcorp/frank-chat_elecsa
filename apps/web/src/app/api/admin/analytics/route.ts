// src/app/api/admin/analytics/route.ts
// IMPL-20260410-03: Analítica de operación actual — SPEC-ARCH-20260410-03

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export interface AnalyticsData {
  /** Total de conversaciones activas (status != "closed") */
  activeTotal: number;
  /** Conversaciones con needsHuman === true */
  needsHuman: number;
  /** Suma total de mensajes sin leer de chats activos */
  unreadTotal: number;
  /** Distribución por status activo { open, resolved, pending } */
  byStatus: Record<string, number>;
  /** Distribución por sucursal de chats activos */
  byBranch: Record<string, number>;
  /** Reparto por campo assignedTo */
  aiVsHuman: { ai: number; human: number; unassigned: number };
  /** ISO timestamp de cuándo se calculó la captura */
  capturedAt: string;
}

interface RawConversation {
  status?: string;
  needsHuman?: boolean;
  unreadCount?: number;
  branch?: string;
  assignedTo?: string;
}

/**
 * GET /api/admin/analytics
 *
 * Devuelve métricas de OPERACIÓN ACTUAL: conversaciones no cerradas.
 * Definición: "operación actual" = status IN ["open", "resolved", "pending"]
 * Lectura server-side consolidada. No usa listeners realtime.
 *
 * @mark IMPL-20260410-03 — SPEC-ARCH-20260410-03
 */
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("conversations")
      .where("status", "in", ["open", "resolved", "pending"])
      .limit(2000)
      .get();

    const byStatus: Record<string, number> = {};
    const byBranch: Record<string, number> = {};
    let needsHuman = 0;
    let unreadTotal = 0;
    let ai = 0;
    let human = 0;
    let unassigned = 0;

    for (const doc of snapshot.docs) {
      const d = doc.data() as RawConversation;

      const s = d.status ?? "unknown";
      byStatus[s] = (byStatus[s] ?? 0) + 1;

      const b = typeof d.branch === "string" && d.branch ? d.branch : "sin_sucursal";
      byBranch[b] = (byBranch[b] ?? 0) + 1;

      if (d.needsHuman === true) needsHuman++;

      unreadTotal += typeof d.unreadCount === "number" ? d.unreadCount : 0;

      const assigned = d.assignedTo ?? "";
      if (!assigned) unassigned++;
      else if (assigned === "ai") ai++;
      else human++;
    }

    const data: AnalyticsData = {
      activeTotal: snapshot.size,
      needsHuman,
      unreadTotal,
      byStatus,
      byBranch,
      aiVsHuman: { ai, human, unassigned },
      capturedAt: new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[analytics] GET error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
