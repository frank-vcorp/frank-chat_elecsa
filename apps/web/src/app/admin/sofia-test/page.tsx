"use client";
// src/app/admin/sofia-test/page.tsx
// Panel de prueba de Sofía — permite probar respuestas con texto y archivos adjuntos.
// @intervention ARCH-20260427-03

import { useState } from "react";
import { Bot, Send, Image, FileText, Loader2, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";

const MIME_OPTIONS = [
  { label: "Imagen JPEG", value: "image/jpeg" },
  { label: "Imagen PNG", value: "image/png" },
  { label: "Imagen WebP", value: "image/webp" },
  { label: "PDF", value: "application/pdf" },
];

export default function SofiaTestPage() {
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!message.trim() && !mediaUrl.trim()) return;
    setLoading(true);
    setReply(null);
    setError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setError("Sesión expirada. Recarga la página.");
        return;
      }

      const res = await fetch("/api/sofia/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: message.trim() || undefined,
          mediaUrl: mediaUrl.trim() || undefined,
          mimeType: mediaUrl.trim() ? mimeType : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error desconocido");
      } else {
        setReply(data.reply);
      }
    } catch (e: any) {
      setError(e.message ?? "Error de red");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessage("");
    setMediaUrl("");
    setMimeType("image/jpeg");
    setReply(null);
    setError(null);
  };

  const hasMedia = mediaUrl.trim().length > 0;
  const isImage = mimeType.startsWith("image/");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="text-purple-600" size={28} />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Probar Sofía</h1>
          <p className="text-sm text-gray-500">
            Simula mensajes de clientes con texto y/o archivos adjuntos
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {/* Mensaje de texto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje del cliente
          </label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            placeholder="Escribe un mensaje como si fueras el cliente..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Archivo adjunto */}
        <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            {isImage ? (
              <Image size={16} className="text-blue-500" />
            ) : (
              <FileText size={16} className="text-red-500" />
            )}
            Archivo adjunto (opcional)
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="https://... (URL pública o de Twilio)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              value={mimeType}
              onChange={(e) => setMimeType(e.target.value)}
            >
              {MIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview de imagen */}
          {hasMedia && isImage && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl}
                alt="Preview"
                className="max-h-40 rounded-lg border border-gray-200 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={loading || (!message.trim() && !mediaUrl.trim())}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {loading ? "Esperando a Sofía..." : "Enviar a Sofía"}
          </button>

          {(reply || error) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 border border-gray-300 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Respuesta de Sofía */}
      {reply && (
        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={18} className="text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">
              Respuesta de Sofía
            </span>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {reply}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-medium">Error: {error}</p>
        </div>
      )}

      {/* Tip */}
      <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 leading-relaxed">
        <strong>Tip:</strong> Para probar con una imagen real de WhatsApp, copia la URL de{" "}
        <code className="bg-blue-100 px-1 rounded">mediaUrl</code> que guarda Firestore en el
        mensaje. Las URLs de Twilio requieren autenticación y solo funcionan desde el servidor
        — en este panel la URL es solo de referencia visual.
      </div>
    </div>
  );
}
