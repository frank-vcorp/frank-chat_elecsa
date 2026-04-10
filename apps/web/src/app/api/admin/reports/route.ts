// src/app/api/admin/reports/route.ts
// IMPL-20260409-02: Reportes v2 - lectura histórica server-side (SPEC-ARCH-20260409-15)
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const MAX_FETCH = 1000;
const DEFAULT_PAGE_SIZE = 25;

export interface ReportConversation {
  id: string;
  /** displayName || contactId — nunca vacío */
  clientName: string;
  contactId: string;
  /** ISO string de closedAt — pivot de fecha de cierre */
  closedAt: string | null;
  tags: string[];
  summary: string | null;
  summarizedAt: string | null;
  assignedTo?: string;
  branch?: string;
}

export interface ReportKPIs {
  totalClosed: number;
  withSummary: number;
  withoutSummary: number;
  /** YYYY-MM-DD → cantidad de cierres ese día */
  byDay: Record<string, number>;
}

export interface ReportsResponse {
  conversations: ReportConversation[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  kpis: ReportKPIs;
}

type FirestoreTimestampLike = { toDate: () => Date };

function isTimestampLike(val: unknown): val is FirestoreTimestampLike {
  return typeof val === "object" && val !== null && typeof (val as FirestoreTimestampLike).toDate === "function";
}

function toISO(val: unknown): string | null {
  if (!val) return null;
  if (isTimestampLike(val)) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return null;
}

function mapDoc(id: string, data: Record<string, unknown>): ReportConversation {
  return {
    id,
    clientName: (data.displayName as string | undefined) || (data.contactId as string) || id,
    contactId: (data.contactId as string) || "",
    closedAt: toISO(data.closedAt),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    summary: typeof data.summary === "string" && data.summary.trim().length > 0
      ? data.summary
      : null,
    summarizedAt: toISO(data.summarizedAt),
    assignedTo: data.assignedTo as string | undefined,
    branch: data.branch as string | undefined,
  };
}

function computeKPIs(docs: Record<string, unknown>[]): ReportKPIs {
  const byDay: Record<string, number> = {};
  let withSummary = 0;

  for (const d of docs) {
    if (typeof d.summary === "string" && d.summary.trim().length > 0) {
      withSummary++;
    }
    const isoDate = toISO(d.closedAt);
    if (isoDate) {
      const day = isoDate.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }
  }

  return {
    totalClosed: docs.length,
    withSummary,
    withoutSummary: docs.length - withSummary,
    byDay,
  };
}

/**
 * GET /api/admin/reports
 *
 * Query params:
 *   dateFrom  YYYY-MM-DD  (inclusive, UTC, optional — defaults to 30 days ago)
 *   dateTo    YYYY-MM-DD  (inclusive, UTC end-of-day, optional — defaults to today)
 *   search    texto libre filtrado en clientName / contactId (optional)
 *   page      número de página 0-indexado (optional, default 0)
 *   pageSize  registros por página 1–100 (optional, default 25)
 *
 * Índice Firestore requerido (CREAR EN CONSOLA si no existe):
 *   Collection: conversations | status ASC | closedAt DESC
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
    const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10), 1),
      100,
    );

    // Build Firestore query — closedAt es el pivote obligatorio (guardrail SPEC)
    let q = adminDb
      .collection("conversations")
      .where("status", "==", "closed")
      .orderBy("closedAt", "desc");

    if (dateFrom) {
      // Inicio del día en UTC
      const from = new Date(`${dateFrom}T00:00:00.000Z`);
      if (!isNaN(from.getTime())) {
        q = q.where("closedAt", ">=", Timestamp.fromDate(from));
      }
    }

    if (dateTo) {
      // Fin del día en UTC
      const to = new Date(`${dateTo}T23:59:59.999Z`);
      if (!isNaN(to.getTime())) {
        q = q.where("closedAt", "<=", Timestamp.fromDate(to));
      }
    }

    // Fetch (capped at MAX_FETCH para proteger rendimiento)
    const snapshot = await q.limit(MAX_FETCH).get();

    interface FsDoc { id: string; data(): Record<string, unknown>; }
    const docs = snapshot.docs as unknown as FsDoc[];

    // Mapear todos los documentos
    type Row = { raw: Record<string, unknown>; mapped: ReportConversation };
    let rows: Row[] = docs.map((doc) => ({
      raw: doc.data() as Record<string, unknown>,
      mapped: mapDoc(doc.id, doc.data() as Record<string, unknown>),
    }));

    // Filtro de texto server-side en memoria (Firestore no soporta full-text nativo)
    if (search) {
      rows = rows.filter(
        (r) =>
          r.mapped.clientName.toLowerCase().includes(search) ||
          r.mapped.contactId.toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages - 1);

    const conversations = rows
      .slice(safePage * pageSize, safePage * pageSize + pageSize)
      .map((r) => r.mapped);

    const kpis = computeKPIs(rows.map((r) => r.raw));

    const response: ReportsResponse = {
      conversations,
      total,
      page: safePage,
      totalPages,
      hasMore: safePage < totalPages - 1,
      kpis,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[reports] GET error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
