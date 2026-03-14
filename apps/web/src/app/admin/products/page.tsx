// src/app/admin/products/page.tsx
"use client";
import React, { useEffect, useState, useRef } from "react";
import { Upload, FileText, X, ArrowRight, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const [productCount, setProductCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [contextDocs, setContextDocs] = useState<any[]>([]);
  const [contextUploading, setContextUploading] = useState(false);
  const contextFileInputRef = useRef<HTMLInputElement>(null);
  const MAX_CONTEXT_DOC_SIZE_KB = 250;

  const totalContextBytes = contextDocs.reduce(
    (sum, doc) => sum + (typeof doc.size === "number" ? doc.size : 0),
    0,
  );
  const activeContextBytes = contextDocs
    .filter((doc) => doc.active)
    .reduce(
      (sum, doc) => sum + (typeof doc.size === "number" ? doc.size : 0),
      0,
    );
  const activeCount = contextDocs.filter((doc) => doc.active).length;

  // Ya no traemos los miles de productos, solo el conteo para rendimiento extremo
  const fetchProductSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      // Si la API devuelve un array, tomamos el length. Si ya devuelve un count, mejor.
      setProductCount(Array.isArray(data) ? data.length : data.count || 0);
    } catch (error) {
      console.error("Failed to fetch summary", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContextDocs = async () => {
    try {
      const res = await fetch("/api/context-docs");
      if (!res.ok) throw new Error("Failed to fetch context docs");
      const data = await res.json();
      setContextDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch context docs", error);
    }
  };

  useEffect(() => {
    fetchProductSummary();
    fetchContextDocs();
  }, []);

  const handleContextFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md") && !file.name.endsWith(".txt")) {
      alert("Solo se permiten archivos .md o .txt");
      return;
    }

    setContextUploading(true);
    try {
      const content = await file.text();
      const sizeKb = Math.round((new Blob([content]).size / 1024) * 10) / 10;
      if (sizeKb > MAX_CONTEXT_DOC_SIZE_KB) {
        alert(
          `El documento es demasiado grande (${sizeKb} KB). Máximo permitido: ${MAX_CONTEXT_DOC_SIZE_KB} KB.`,
        );
        return;
      }
      const res = await fetch("/api/context-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: file.name,
          content,
          source: "products-page",
        }),
      });
      if (!res.ok) throw new Error("Failed to upload context doc");
      await fetchContextDocs();
    } catch (error) {
      console.error("Context upload error", error);
      alert("Error al subir el documento de contexto");
    } finally {
      setContextUploading(false);
      if (contextFileInputRef.current) contextFileInputRef.current.value = "";
    }
  };

  const handleDeleteContextDoc = async (id: string) => {
    if (!confirm("¿Eliminar este documento de contexto?")) return;
    try {
      const res = await fetch(
        `/api/context-docs?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete context doc");
      await fetchContextDocs();
    } catch (error) {
      console.error("Context delete error", error);
      alert("Error al eliminar el documento de contexto");
    }
  };

  const handleToggleActiveContextDoc = async (
    docId: string,
    currentActive: boolean,
  ) => {
    try {
      const res = await fetch("/api/context-docs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, active: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to update context doc");
      await fetchContextDocs();
    } catch (error) {
      console.error("Context toggle error", error);
      alert("Error al actualizar el estado del documento");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Configuración de Conocimiento
          </h2>
          <p className="text-gray-500 text-sm">
            Gestiona la información que Sofía utiliza para atender clientes.
          </p>
        </div>
      </div>

      {/* Nueva Sección de Catálogo Resumida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <LayoutGrid size={20} />
            </div>
            <h3 className="font-bold text-gray-900">Catálogo de Productos</h3>
            <p className="text-3xl font-black text-blue-600 mt-2">
              {loading ? "..." : productCount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
              Items cargados
            </p>
          </div>
          <Link
            href="/admin/upload-catalog"
            className="mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sincronizar Excel <ArrowRight size={16} />
          </Link>
        </div>

        <div className="md:col-span-2 bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col justify-center">
          <h4 className="font-bold text-blue-900 mb-2">
            Optimización de Escala Masiva
          </h4>
          <p className="text-blue-800 text-sm leading-relaxed">
            Hemos optimizado esta vista para soportar catálogos masivos (12,500+
            items). La lista detallada ha sido removida para maximizar la
            velocidad de tu panel. Cualquier cambio de existencias o precios
            debe realizarse a través del
            <strong> Sincronizador Maestro</strong> usando un archivo XLSX.
          </p>
        </div>
      </div>

      <input
        ref={contextFileInputRef}
        type="file"
        accept=".md,.txt"
        onChange={handleContextFileUpload}
        className="hidden"
      />

      {/* Documentos de contexto */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Documentos de Referencia (Contexto)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Información sobre sucursales, horarios, servicios o políticas de
              Elecsa.
            </p>
          </div>
          <button
            onClick={() => contextFileInputRef.current?.click()}
            disabled={contextUploading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-semibold transition-all shadow-sm"
          >
            <Upload size={16} />
            {contextUploading ? "Subiendo..." : "Agregar Documento .md"}
          </button>
        </div>

        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <p className="text-xs text-gray-600">
            <strong>Estatus del Conocimiento:</strong> {activeCount} documentos
            activos · {(activeContextBytes / 1024).toFixed(1)} KB en uso por la
            IA.
          </p>
        </div>

        {contextDocs.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-lg">
            <FileText size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-sm text-gray-400">
              No hay documentos de contexto. Sube archivos de texto para dar
              sabiduría a Sofía.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-md overflow-hidden">
            {contextDocs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center ${doc.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}
                  >
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {doc.title}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">
                      {(doc.size / 1024).toFixed(1)} KB ·{" "}
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${doc.active ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"}`}
                  >
                    {doc.active ? "En Línea" : "Desactivado"}
                  </span>
                  <div className="h-6 w-px bg-gray-200 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleToggleActiveContextDoc(doc.id, !!doc.active)
                      }
                      className={`text-xs px-3 py-1 rounded border transition-colors ${doc.active ? "bg-white border-gray-200 text-gray-600 hover:bg-gray-50" : "bg-green-600 border-green-600 text-white hover:bg-green-700"}`}
                    >
                      {doc.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => handleDeleteContextDoc(doc.id)}
                      className="p-1.5 text-red-200 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                      title="Eliminar permanentemente"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
