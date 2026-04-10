// src/app/api/admin/reports/export/route.ts
// IMPL-20260409-02: Exportación CSV coherente con filtros (SPEC-ARCH-20260409-15)
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
// Timestamp se usa para Timestamp.fromDate() en las queries de Firestore

const MAX_EXPORT = 5000;

type TimestampLike = { toDate: () => Date };

function isTimestampLike(val: unknown): val is TimestampLike {
  return typeof val === "object" && val !== null && typeof (val as TimestampLike).toDate === "function";
}

function toISO(val: unknown): string | null {
  if (!val) return null;
  if (isTimestampLike(val)) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function escapeCSV(val: string): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function isClosedConversation(data: Record<string, unknown>): boolean {
  return data.status === "closed";
}

/**
 * GET /api/admin/reports/export
 *
 * Mismos query params que /api/admin/reports (sin page / pageSize).
 * Devuelve CSV con BOM UTF-8 para compatibilidad con Excel.
 *
 * Hotfix FIX-20260410-01:
 * Se evita depender del índice compuesto en producción consultando por closedAt
 * y filtrando status="closed" en memoria.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

    let q = adminDb
      .collection("conversations")
      .orderBy("closedAt", "desc");

    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00.000Z`);
      if (!isNaN(from.getTime())) {
        q = q.where("closedAt", ">=", Timestamp.fromDate(from));
      }
    }

    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59.999Z`);
      if (!isNaN(to.getTime())) {
        q = q.where("closedAt", "<=", Timestamp.fromDate(to));
      }
    }

    const snapshot = await q.limit(MAX_EXPORT).get();

    interface FsDoc { id: string; data(): Record<string, unknown>; }
    const docs = snapshot.docs as unknown as FsDoc[];

    type ExportRow = {
      id: string; clientName: string; contactId: string;
      closedAt: string | null; tags: string; summary: string;
      summarizedAt: string | null; branch: string; assignedTo: string;
    };
    let rows: ExportRow[] = docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        clientName: (d.displayName as string) || (d.contactId as string) || doc.id,
        contactId: (d.contactId as string) ?? "",
        closedAt: toISO(d.closedAt),
        tags: Array.isArray(d.tags) ? (d.tags as string[]).join("; ") : "",
        summary: typeof d.summary === "string" ? d.summary : "",
        summarizedAt: toISO(d.summarizedAt),
        branch: (d.branch as string) ?? "",
        assignedTo: (d.assignedTo as string) ?? "",
      };
    });

    rows = rows.filter((_, index) => isClosedConversation(docs[index].data()));

    // Mismo filtro de texto que en el reporte — CSV debe ser coherente con tabla
    if (search) {
      rows = rows.filter(
        (r) =>
          r.clientName.toLowerCase().includes(search) ||
          r.contactId.toLowerCase().includes(search),
      );
    }

    const headers = [
      "ID",
      "Cliente",
      "Teléfono",
      "Fecha Cierre",
      "Sucursal",
      "Agente Asignado",
      "Etiquetas",
      "Resumen IA",
      "Fecha Resumen",
    ];

    const csvRows = rows.map((r) => [
      escapeCSV(r.id),
      escapeCSV(r.clientName),
      escapeCSV(r.contactId),
      escapeCSV(formatDate(r.closedAt)),
      escapeCSV(r.branch),
      escapeCSV(r.assignedTo),
      escapeCSV(r.tags),
      escapeCSV(r.summary),
      escapeCSV(formatDate(r.summarizedAt)),
    ]);

    // BOM UTF-8 para compatibilidad con Excel en español
    const bom = "\uFEFF";
    const csvContent =
      bom +
      [headers.map(escapeCSV).join(","), ...csvRows.map((row) => row.join(","))].join(
        "\r\n",
      );

    const fileName = `reporte_conversaciones_${dateFrom ?? "todo"}_${dateTo ?? "todo"}.csv`;

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[reports/export] GET error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
