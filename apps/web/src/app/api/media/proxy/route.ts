// src/app/api/media/proxy/route.ts
// Proxy autenticado para archivos de Twilio (imágenes, PDFs, videos).
// Descarga el archivo con Basic Auth y lo sirve al navegador del agente.
// Seguridad: solo permite URLs de dominios de Twilio y requiere sesión activa.
// @intervention ARCH-20260427-04
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Dominios permitidos — solo Twilio (previene SSRF)
const ALLOWED_HOSTS = [
  "api.twilio.com",
  "media.twiliocdn.com",
  "mcs.us1.twilio.com",
];

function isTwilioUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_HOSTS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      )
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación via header Bearer o query param token
    // (query param necesario para <img src> y <a href> donde no se pueden enviar headers)
    const authHeader = request.headers.get("Authorization");
    const queryToken = request.nextUrl.searchParams.get("token");

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : queryToken;

    if (!token) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    await adminAuth.verifyIdToken(token);

    // Obtener y validar la URL destino
    const targetUrl = request.nextUrl.searchParams.get("url");
    if (!targetUrl) {
      return new NextResponse("Falta parámetro url", { status: 400 });
    }

    if (!isTwilioUrl(targetUrl)) {
      return new NextResponse("URL no permitida", { status: 403 });
    }

    // Descargar con Basic Auth de Twilio
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token2 = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token2) {
      return new NextResponse("Credenciales Twilio no configuradas", { status: 500 });
    }

    const credentials = Buffer.from(`${sid}:${token2}`).toString("base64");
    const upstream = await fetch(targetUrl, {
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (!upstream.ok) {
      return new NextResponse(`Error al obtener archivo: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Permitir al navegador mostrar inline (imágenes) o descargar (PDF)
        "Content-Disposition": contentType.startsWith("image/")
          ? "inline"
          : `attachment; filename="archivo"`,
        // Cache 1 hora — los archivos de Twilio no cambian
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("[MediaProxy] Error:", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}
