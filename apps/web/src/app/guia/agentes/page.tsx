/**
 * Guía Visual de Agentes — Dashboard Elecsa
 * Ruta pública: /guia/agentes
 *
 * @id IMPL-20260506-05
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guía de Agentes | Elecsa Chat",
  description:
    "Manual visual para agentes: cómo leer el dashboard, gestionar conversaciones y escalar correctamente.",
};

export default function GuiaAgentesPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        margin: 0,
        padding: 0,
        background: "#f1f5f9",
      }}
    >
      <iframe
        src="/guia/manual-agentes-dashboard.html"
        title="Guía visual de agentes — Dashboard Elecsa"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          display: "block",
        }}
        allowFullScreen
      />
    </main>
  );
}
