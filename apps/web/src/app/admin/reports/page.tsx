// src/app/admin/reports/page.tsx
// IMPL-20260410-03: Dashboard analítico de reportes — SPEC-ARCH-20260410-03
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Search,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Clock,
} from "lucide-react";
import type { ReportConversation, ReportKPIs, ReportsResponse } from "@/app/api/admin/reports/route";
import type { AnalyticsData } from "@/app/api/admin/analytics/route";

const PAGE_SIZE = 25;

// ─── Mapas de etiquetas ─────────────────────────────────────────────────────
const BRANCH_LABELS: Record<string, string> = {
  guadalajara: "Guadalajara",
  coahuila: "Coahuila",
  leon: "León",
  queretaro: "Querétaro",
  toluca: "Toluca",
  monterrey: "Monterrey",
  centro: "Centro",
  armas: "Armas",
  veracruz: "Veracruz",
  slp: "San Luis Potosí",
  puebla: "Puebla",
  general: "General",
  sin_sucursal: "Sin sucursal",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  resolved: "Resuelto",
  pending: "Pendiente",
  closed: "Cerrado",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-700 border-green-200",
  resolved: "bg-blue-100 text-blue-700 border-blue-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
};

function branchLabel(key: string): string {
  return BRANCH_LABELS[key] ?? key;
}

// ─── Utilidades de fecha ────────────────────────────────────────────────────
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

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "amber" | "blue" | "red" | "indigo" | "gray";
}) {
  const colorMap: Record<string, string> = {
    green: "text-green-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
    red: "text-red-600",
    indigo: "text-indigo-600",
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

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({
  title,
  description,
  type,
  timestamp,
  onRefresh,
  loading,
}: {
  title: string;
  description: string;
  type: "actual" | "historico";
  timestamp?: string | null;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  const badgeCls =
    type === "actual"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";
  const borderCls = type === "actual" ? "border-blue-400" : "border-emerald-400";
  const badgeText = type === "actual" ? "Ahora" : "Período seleccionado";
  const Icon = type === "actual" ? Activity : Clock;

  return (
    <div className={`border-l-4 ${borderCls} pl-4 flex items-start justify-between gap-3`}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${badgeCls}`}
          >
            <Icon size={12} />
            {badgeText}
          </span>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
        {timestamp && (
          <p className="text-xs text-gray-400 mt-0.5">
            Capturado:{" "}
            {new Date(timestamp).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      )}
    </div>
  );
}

// ─── Distribución por estatus ────────────────────────────────────────────────
function StatusDistribution({
  byStatus,
  total,
}: {
  byStatus: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(byStatus).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        Distribución por estatus
      </p>
      <div className="space-y-2.5">
        {entries.map(([status, count]) => (
          <div key={status} className="flex items-center gap-3">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded border min-w-[80px] text-center ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-blue-500 rounded-full transition-all"
                style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700 min-w-[28px] text-right">
              {count}
            </span>
            <span className="text-xs text-gray-400 min-w-[36px]">
              {total > 0 ? `${Math.round((count / total) * 100)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Ranking de sucursales ───────────────────────────────────────────────────
function BranchRanking({
  byBranch,
  title,
  barColor = "bg-indigo-500",
}: {
  byBranch: Record<string, number>;
  title: string;
  barColor?: string;
}) {
  const entries = Object.entries(byBranch)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  if (entries.length === 0) return null;

  const maxCount = entries[0]?.[1] ?? 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      <div className="space-y-2.5">
        {entries.map(([branch, count], i) => (
          <div key={branch} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-4 text-right font-medium">{i + 1}</span>
            <span className="text-sm text-gray-700 min-w-[100px]">{branchLabel(branch)}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 ${barColor} rounded-full transition-all`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700 min-w-[28px] text-right">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top etiquetas ───────────────────────────────────────────────────────────
function TagRanking({ topTags }: { topTags: [string, number][] }) {
  if (topTags.length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        Top etiquetas del período
      </p>
      <div className="flex flex-wrap gap-2">
        {topTags.map(([tag, count]) => (
          <span
            key={tag}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-medium"
          >
            {tag}
            <span className="bg-emerald-200 text-emerald-800 rounded-full px-1.5 py-0.5 text-xs font-bold leading-none">
              {count}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Mini bar chart por día ──────────────────────────────────────────────────
function DayDistribution({ byDay }: { byDay: Record<string, number> }) {
  const entries = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14);

  if (entries.length === 0) return null;

  const maxCount = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        Cierres por día (últimos {entries.length} días con actividad)
      </p>
      <div className="flex items-end gap-1.5 h-20 overflow-x-auto pb-1">
        {entries.map(([day, count]) => (
          <div key={day} className="flex flex-col items-center gap-1 min-w-[32px] flex-1">
            <span className="text-xs text-gray-600 font-medium leading-none">{count}</span>
            <div
              className="bg-emerald-500 rounded-t w-full transition-all"
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

// ─── Bloque: Operación Actual ────────────────────────────────────────────────
function OperacionActualBlock({
  data,
  loading,
  error,
  onRefresh,
}: {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const { ai, human, unassigned } = data?.aiVsHuman ?? { ai: 0, human: 0, unassigned: 0 };
  const totalAssigned = ai + human + unassigned;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Operación actual"
        description="Chats activos (no cerrados) en este momento. Snapshot independiente de los filtros históricos."
        type="actual"
        timestamp={data?.capturedAt}
        onRefresh={onRefresh}
        loading={loading}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          Cargando operación actual...
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Chats activos ahora"
              value={data.activeTotal}
              sub="open + pending + resolved"
              accent="indigo"
            />
            <KpiCard
              label="Requieren humano"
              value={data.needsHuman}
              sub={
                data.activeTotal > 0
                  ? `${Math.round((data.needsHuman / data.activeTotal) * 100)}% del total activo`
                  : "—"
              }
              accent={data.needsHuman > 0 ? "red" : "gray"}
            />
            <KpiCard
              label="Mensajes sin leer"
              value={data.unreadTotal}
              sub="suma acumulada de chats activos"
              accent={data.unreadTotal > 0 ? "amber" : "gray"}
            />
            <KpiCard
              label="Asignado a IA"
              value={ai}
              sub={
                totalAssigned > 0
                  ? `${Math.round((ai / totalAssigned) * 100)}% IA · ${human} humano · ${unassigned} sin asignar`
                  : "sin datos"
              }
              accent="blue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusDistribution byStatus={data.byStatus} total={data.activeTotal} />
            <BranchRanking
              byBranch={data.byBranch}
              title="Top sucursales activas"
              barColor="bg-indigo-500"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tabla paginada ──────────────────────────────────────────────────────────
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

// ─── Página principal ────────────────────────────────────────────────────────
export default function ReportsPage() {
  // ── Estado: Operación actual (independiente de filtros) ─────────────────────
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // ── Estado: Histórico (gobernado por filtros) ───────────────────────────────
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDateTo);
  const [search, setSearch] = useState("");
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

  // ── Fetch analítica (operación actual) ─────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Error HTTP ${res.status}`);
      }
      setAnalyticsData((await res.json()) as AnalyticsData);
    } catch (err: unknown) {
      setAnalyticsError(err instanceof Error ? err.message : "Error al cargar analítica");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // ── Fetch histórico ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async (filters: typeof applied, p: number) => {
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
      setData((await res.json()) as ReportsResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard de Conversaciones
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Operación actual y análisis histórico del período seleccionado
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

        {/* ── Filtros (gobiernan solo el bloque histórico y la exportación) ─ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Filtros — aplican al bloque histórico y a la exportación
          </p>
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

        {/* ═══════════════════════════════════════════════════════════════════
            BLOQUE 1: OPERACIÓN ACTUAL
            Snapshot independiente. Fuente: /api/admin/analytics
        ════════════════════════════════════════════════════════════════════ */}
        <OperacionActualBlock
          data={analyticsData}
          loading={analyticsLoading}
          error={analyticsError}
          onRefresh={fetchAnalytics}
        />

        {/* ═══════════════════════════════════════════════════════════════════
            BLOQUE 2: HISTÓRICO DEL PERÍODO
            Gobernado por filtros. Solo conversaciones cerradas en el rango.
            Fuente: /api/admin/reports
        ════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <SectionHeader
            title="Histórico del período"
            description={`Conversaciones cerradas entre ${applied.dateFrom} y ${applied.dateTo}. Los filtros gobiernan este bloque.`}
            type="historico"
          />

          {loading && !data && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              Cargando histórico...
            </div>
          )}
          {loading && data && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-gray-400 text-sm">
              Aplicando filtros...
            </div>
          )}
          {error && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="font-medium text-red-600">Error al cargar reportes</p>
              <p className="text-sm mt-1 text-red-400">{error}</p>
            </div>
          )}

          {kpis && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  label="Total cerradas"
                  value={kpis.totalClosed}
                  sub="en el período seleccionado"
                  accent="gray"
                />
                <KpiCard
                  label="Con resumen IA"
                  value={kpis.withSummary}
                  sub={
                    kpis.totalClosed > 0
                      ? `${Math.round((kpis.withSummary / kpis.totalClosed) * 100)}% del total`
                      : "—"
                  }
                  accent="green"
                />
                <KpiCard
                  label="Sin resumen"
                  value={kpis.withoutSummary}
                  sub={
                    kpis.totalClosed > 0
                      ? `${Math.round((kpis.withoutSummary / kpis.totalClosed) * 100)}% del total`
                      : "—"
                  }
                  accent="amber"
                />
                <KpiCard
                  label="Promedio / día"
                  value={
                    Object.keys(kpis.byDay).length > 0
                      ? (kpis.totalClosed / Object.keys(kpis.byDay).length).toFixed(1)
                      : "0"
                  }
                  sub="conversaciones cerradas"
                  accent="blue"
                />
              </div>

              {kpis.byBranch && Object.keys(kpis.byBranch).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BranchRanking
                    byBranch={kpis.byBranch}
                    title="Top sucursales — cierres del período"
                    barColor="bg-emerald-500"
                  />
                  {kpis.topTags && kpis.topTags.length > 0 && (
                    <TagRanking topTags={kpis.topTags} />
                  )}
                </div>
              )}

              <DayDistribution byDay={kpis.byDay} />
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            DETALLE: Tabla de conversaciones cerradas (subordinada al resumen)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Detalle de conversaciones cerradas
            </h3>
            {data && (
              <span className="text-xs text-gray-400">
                {data.total} registro{data.total !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {!loading && !error && data && data.conversations.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
              <FileText className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="font-medium text-gray-600">Sin conversaciones en este período</p>
              <p className="text-sm mt-1">Ajusta el rango de fechas o limpia la búsqueda</p>
            </div>
          )}

          {data && data.conversations.length > 0 && (
            <ReportsTable
              conversations={data.conversations}
              total={data.total}
              page={data.page}
              totalPages={data.totalPages}
              hasMore={data.hasMore}
              loading={loading}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
