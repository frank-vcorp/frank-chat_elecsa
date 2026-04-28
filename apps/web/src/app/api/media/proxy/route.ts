// src/app/api/media/proxy/route.ts
// Proxy autenticado para archivos de Twilio y Firebase Storage.
// Requiere sesión Firebase activa (token en query param).
// Seguridad anti-SSRF: solo permite dominios de Twilio y Firebase Storage.
// @intervention ARCH-20260427-04
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Dominios permitidos (previene SSRF)
const TWILIO_HOSTS = [
  "api.twilio.com",
  "media.twiliocdn.com",
  "mcs.us1.twilio.com",
];

const FIREBASE_STORAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
];

function isAllowedUrl(urlString: string): "twilio" | "firebase" | null {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "https:") return null;
    if (TWILIO_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)))
      return "twilio";
    if (FIREBASE_STORAGE_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)))
      return "firebase";
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación via header Bearer o query param token
    const authHeader = request.headers.get("Authorization");
    const queryToken = request.nextUrl.searchParams.get("token");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : queryToken;

    if (!token) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    await adminAuth.verifyIdToken(token);

    // Obtener y validar la URL destino
    const targetUrl = request.nextUrl.searchParams.get("url");
    if (!targetUrl) {
      return new NextResponse("Falta parámetro url", { status: 400 });
    }

    const urlType = isAllowedUrl(targetUrl);
    if (!urlType) {
      return new NextResponse("URL no permitida", { status: 403 });
    }

    let upstream: Response;

    if (urlType === "twilio") {
      // Descargar con Basic Auth de Twilio
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!sid || !authToken) {
        return new NextResponse("Credenciales Twilio no configuradas", { status: 500 });
      }
      const credentials = Buffer.from(`${sid}:${authToken}`).toString("base64");
      upstream = await fetch(targetUrl, {
        headers: { Authorization: `Basic ${credentials}` },
      });
    } else {
      // Firebase Storage — la URL ya incluye token de acceso público (?alt=media&token=...)
      // El admin SDK tiene acceso sin credenciales adicionales
      upstream = await fetch(targetUrl);
    }

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
        "Content-Disposition": contentType.startsWith("image/")
          ? "inline"
          : `attachment; filename="archivo"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("[MediaProxy] Error:", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}
