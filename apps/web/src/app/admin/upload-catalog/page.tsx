"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";

export default function UploadCatalogAdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setResult({ error: "Por favor, selecciona un archivo primero." });
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/products/sync-excel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error en la carga");
      }

      setResult({ success: true, message: data.message });
      setFile(null); // Reset
      // Resetear Input Visual
      const fileInput = document.getElementById(
        "catalog-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      console.error(err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📥 Sincronizador de Catálogo (XLSX)
        </h1>
        <p className="text-gray-600 mb-8">
          Sube tu archivo de Excel con los inventarios actualizados. El sistema
          leerá automáticamente las existencias y ajustará los precios, familias
          y marcas directamente en Producción.
        </p>

        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="catalog-upload"
              className="font-semibold text-sm text-gray-700"
            >
              Archivo Excel (.xlsx)
            </label>
            <input
              type="file"
              id="catalog-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                border border-gray-300 rounded-md p-2"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`w-full py-3 px-4 rounded-md font-bold text-white transition-all 
              ${
                !file || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
              }`}
          >
            {loading
              ? "⏳ Procesando e inyectando a BD (No cierres esta pestaña)..."
              : "Subir y Sincronizar"}
          </button>
        </div>

        {/* Notificaciones */}
        {result && (
          <div
            className={`mt-6 p-4 rounded-md ${result.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}
          >
            <h3 className="font-bold">
              {result.error ? "❌ Error" : "✅ Éxito"}
            </h3>
            <p className="mt-1">{result.error || result.message}</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-lg text-sm text-blue-900 border border-blue-100">
        <h4 className="font-bold mb-2">¿Qué columnas tomará Sofía?</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Artículo</strong> (Identificador SKU)
          </li>
          <li>
            <strong>Desc. Artículo</strong> (Nombre para el Fuzzy Search)
          </li>
          <li>
            <strong>PRECIO 2</strong> (Precio al público)
          </li>
          <li>
            <strong>MONEDA</strong> (MXN / USD)
          </li>
          <li>
            <strong>Proveedor</strong> y <strong>Familia</strong> y{" "}
            <strong>Cedula</strong> (Filtros de Marca/Categoría)
          </li>
          <li>
            <strong>Disponible</strong> (Piezas en stock real-time)
          </li>
        </ul>
      </div>
    </div>
  );
}
