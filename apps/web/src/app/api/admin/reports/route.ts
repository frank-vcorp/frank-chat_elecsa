// src/app/api/admin/reports/route.ts
// IMPL-20260409-02: Reportes v2 - lectura histórica server-side (SPEC-ARCH-20260409-15)
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const MAX_FETCH = 1000;
const DEFAULT_PAGE_SIZE = 25;

export interface ReportConversation {
  id: string;
  /** displayName || contactId — nunca vacío */
  clientName: string;
  contactId: string;
  /** ISO string de closedAt — pivot de fecha de cierre */
  closedAt: string | null;
  /** ISO string de fecha efectiva del reporte: closedAt || lastMessageAt */
  effectiveClosedAt: string | null;
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

function getEffectiveClosedAt(data: Record<string, unknown>): string | null {
  return toISO(data.closedAt) || toISO(data.lastMessageAt);
}

function mapDoc(id: string, data: Record<string, unknown>): ReportConversation {
  return {
    id,
    clientName: (data.displayName as string | undefined) || (data.contactId as string) || id,
    contactId: (data.contactId as string) || "",
    closedAt: toISO(data.closedAt),
    effectiveClosedAt: getEffectiveClosedAt(data),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    summary: typeof data.summary === "string" && data.summary.trim().length > 0
      ? data.summary
      : null,
    summarizedAt: toISO(data.summarizedAt),
    assignedTo: data.assignedTo as string | undefined,
    branch: data.branch as string | undefined,
  };
}

function isClosedConversation(data: Record<string, unknown>): boolean {
  return data.status === "closed";
}

function computeKPIs(docs: Record<string, unknown>[]): ReportKPIs {
  const byDay: Record<string, number> = {};
  let withSummary = 0;

  for (const d of docs) {
    if (typeof d.summary === "string" && d.summary.trim().length > 0) {
      withSummary++;
    }
    const isoDate = getEffectiveClosedAt(d);
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
 * Hotfix FIX-20260410-02:
 * Se consulta por status="closed" y se resuelve la fecha efectiva del reporte como
 * closedAt || lastMessageAt. Esto evita depender del índice compuesto y además cubre
 * conversaciones legacy cerradas sin closedAt persistido.
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

    const fromIso = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`).toISOString() : null;
    const toIso = dateTo ? new Date(`${dateTo}T23:59:59.999Z`).toISOString() : null;

    const snapshot = await adminDb
      .collection("conversations")
      .where("status", "==", "closed")
      .limit(MAX_FETCH)
      .get();

    interface FsDoc { id: string; data(): Record<string, unknown>; }
    const docs = snapshot.docs as unknown as FsDoc[];

    // Mapear todos los documentos
    type Row = { raw: Record<string, unknown>; mapped: ReportConversation };
    let rows: Row[] = docs.map((doc) => ({
      raw: doc.data() as Record<string, unknown>,
      mapped: mapDoc(doc.id, doc.data() as Record<string, unknown>),
    }));

    rows = rows.filter((row) => isClosedConversation(row.raw));

    rows = rows.filter((row) => {
      const effective = row.mapped.effectiveClosedAt;
      if (!effective) return false;
      if (fromIso && effective < fromIso) return false;
      if (toIso && effective > toIso) return false;
      return true;
    });

    // Filtro de texto server-side en memoria (Firestore no soporta full-text nativo)
    if (search) {
      rows = rows.filter(
        (r) =>
          r.mapped.clientName.toLowerCase().includes(search) ||
          r.mapped.contactId.toLowerCase().includes(search),
      );
    }

    rows.sort((a, b) => {
      const left = a.mapped.effectiveClosedAt ?? "";
      const right = b.mapped.effectiveClosedAt ?? "";
      return right.localeCompare(left);
    });

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
