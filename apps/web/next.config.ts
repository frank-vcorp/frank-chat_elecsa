import type { NextConfig } from "next";

/**
 * @intervention FIX-20260506-04
 * @source context/interconsultas/DICTAMEN_FIX-20260505-01.md
 * Mantener PWA solo en producción para evitar ruido de Workbox en development y preview.
 */
const enablePwa =
  process.env.NODE_ENV === "production" &&
  (process.env.VERCEL_ENV ?? "production") === "production";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: !enablePwa,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /**
   * @intervention ARCH-20260506-01
   * @source Vercel build log 2026-05-06
   * Next 15 está chocando con la integración de lint durante build; se mantiene el lint fuera del pipeline de `next build`.
   */
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);
