// src/app/admin/reports/page.tsx
// IMPL-20260409-02: Reportes v2 — vista histórica confiable (SPEC-ARCH-20260409-15)
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Search,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ReportConversation, ReportKPIs, ReportsResponse } from "@/app/api/admin/reports/route";

const PAGE_SIZE = 25;

function getDefaultDateFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function getDefaultDateTo(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatClosedAt(iso: string | null): string {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "amber" | "blue" | "gray";
}) {
  const colorMap: Record<string, string> = {
    green: "text-green-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
    gray: "text-gray-900",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colorMap[accent ?? "gray"]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Mini bar chart por día ─────────────────────────────────────────────────
function DayDistribution({ byDay }: { byDay: Record<string, number> }) {
  const entries = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14);

  if (entries.length === 0) return null;

  const maxCount = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        Distribución por día (últimos {entries.length} días con actividad)
      </p>
      <div className="flex items-end gap-1.5 h-20 overflow-x-auto pb-1">
        {entries.map(([day, count]) => (
          <div key={day} className="flex flex-col items-center gap-1 min-w-[32px] flex-1">
            <span className="text-xs text-gray-600 font-medium leading-none">{count}</span>
            <div
              className="bg-blue-500 rounded-t w-full transition-all"
              style={{ height: `${Math.max(4, (count / maxCount) * 44)}px` }}
            />
            <span className="text-gray-400 whitespace-nowrap" style={{ fontSize: "9px" }}>
              {day.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tabla paginada ─────────────────────────────────────────────────────────
function ReportsTable({
  conversations,
  total,
  page,
  totalPages,
  hasMore,
  loading,
  onPageChange,
}: {
  conversations: ReportConversation[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  loading: boolean;
  onPageChange: (p: number) => void;
}) {
  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                Cliente
              </th>
              <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap hidden sm:table-cell">
                Teléfono
              </th>
              <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                Fecha Cierre
              </th>
              <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap hidden md:table-cell">
                Etiquetas
              </th>
              <th className="px-4 py-3 font-semibold text-gray-700 w-1/3">
                Resumen IA
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <tr key={conv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {conv.clientName}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                  {conv.contactId}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatClosedAt(conv.closedAt)}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {conv.tags.length > 0 ? (
                      conv.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">Sin etiquetas</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {conv.summary ? (
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-24 overflow-y-auto">
                      {conv.summary}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic flex items-center gap-1 text-xs">
                      <FileText size={12} />
                      Pendiente de resumen
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {total === 0
            ? "Sin resultados"
            : `Mostrando ${from}–${to} de ${total} conversaciones`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0 || loading}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-700">
            Pág. {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasMore || loading}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────────────────
export default function ReportsPage() {
  // Filtros del formulario (no aplicados aún)
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDateTo);
  const [search, setSearch] = useState("");

  // Filtros aplicados (trigger del fetch)
  const [applied, setApplied] = useState({
    dateFrom: getDefaultDateFrom(),
    dateTo: getDefaultDateTo(),
    search: "",
  });

  const [page, setPage] = useState(0);
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [didApply, setDidApply] = useState(false);

  const fetchData = useCallback(
    async (filters: typeof applied, p: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          page: String(p),
          pageSize: String(PAGE_SIZE),
        });
        if (filters.search) params.set("search", filters.search);

        const res = await fetch(`/api/admin/reports?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Error HTTP ${res.status}`);
        }
        const json = (await res.json()) as ReportsResponse;
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar reportes");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(applied, page);
  }, [applied, page, fetchData]);

  const handleApply = () => {
    setPage(0);
    setDidApply(true);
    setApplied({ dateFrom, dateTo, search });
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      dateFrom: applied.dateFrom,
      dateTo: applied.dateTo,
    });
    if (applied.search) params.set("search", applied.search);
    window.location.href = `/api/admin/reports/export?${params.toString()}`;
  };

  const kpis: ReportKPIs | null = data?.kpis ?? null;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reportes de Conversaciones
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Historial de chats cerrados — fecha de cierre real, filtros y exportación coherentes
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading || !data || data.total === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-gray-600">Buscar</label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Nombre o teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApply()}
                  className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleApply}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
          {didApply && !loading && !error && (
            <p className="mt-3 text-xs text-gray-500">
              Filtros aplicados: {applied.dateFrom} a {applied.dateTo}
              {applied.search ? `, búsqueda "${applied.search}"` : ""}.
            </p>
          )}
        </div>

        {/* KPIs */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Cerradas"
              value={kpis.totalClosed}
              sub="en el período seleccionado"
              accent="gray"
            />
            <KpiCard
              label="Con Resumen IA"
              value={kpis.withSummary}
              sub={
                kpis.totalClosed > 0
                  ? `${Math.round((kpis.withSummary / kpis.totalClosed) * 100)}% del total`
                  : "—"
              }
              accent="green"
            />
            <KpiCard
              label="Sin Resumen"
              value={kpis.withoutSummary}
              sub={
                kpis.totalClosed > 0
                  ? `${Math.round((kpis.withoutSummary / kpis.totalClosed) * 100)}% del total`
                  : "—"
              }
              accent="amber"
            />
            <KpiCard
              label="Promedio / Día"
              value={
                Object.keys(kpis.byDay).length > 0
                  ? (kpis.totalClosed / Object.keys(kpis.byDay).length).toFixed(1)
                  : "0"
              }
              sub="conversaciones cerradas"
              accent="blue"
            />
          </div>
        )}

        {/* Distribución por día */}
        {kpis && <DayDistribution byDay={kpis.byDay} />}

        {/* Tabla / Estados */}
        {loading && !data ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            Cargando reportes...
          </div>
        ) : loading && data ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            Aplicando filtros...
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-red-500">
            <p className="font-medium">Error al cargar reportes</p>
            <p className="text-sm mt-1 text-red-400">{error}</p>
          </div>
        ) : data && data.conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
            <FileText className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="font-medium text-gray-600">
              No hay conversaciones cerradas en este período
            </p>
            <p className="text-sm mt-1">
              Ajusta el rango de fechas o limpia el filtro de búsqueda
            </p>
          </div>
        ) : data ? (
          <ReportsTable
            conversations={data.conversations}
            total={data.total}
            page={data.page}
            totalPages={data.totalPages}
            hasMore={data.hasMore}
            loading={loading}
            onPageChange={(p) => setPage(p)}
          />
        ) : null}
      </div>
    </div>
  );
}
