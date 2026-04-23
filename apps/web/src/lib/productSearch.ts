// src/lib/productSearch.ts
import { getFirestore } from "firebase-admin/firestore";
import MiniSearch from "minisearch";
import "@/lib/firebase-admin";

const db = getFirestore();

// Interfaces
interface ProductDocument {
  id: string; // SKU será el ID
  sku: string;
  /** SKU sin guiones, puntos ni espacios para búsqueda normalizada.
   * Ej: "456-789" → "456789". FIX: ARCH-20260422-01 */
  skuNormalized: string;
  description: string;
  price: number | string;
  currency: string;
  supplier: string;
  stock: number;
  category: string;
  family: string;
  status: string;
}

// Mantenemos la instancia de MiniSearch en el scope global (Server/Serverless lifecycle)
// para evitar re-indexar los 12,500 productos en cada petición HTTP al mismo contenedor.
// En Next.js App Router (Dev) esto evita regeneraciones completas por el Fast Refresh.

/**
 * Síntesis pre-construida: Mapa de marcas por familia/categoría.
 * Se construye UNA SOLA VEZ al indexar el catálogo. Instantáneo y 100% preciso.
 * @intervention FIX-20260303-02
 */
interface CatalogSynthesis {
  brandsByFamily: Map<string, Set<string>>; // "CABLE" → {"Viakon", "Condumex", ...}
  brandsByCategory: Map<string, Set<string>>; // "MATERIAL ELÉCTRICO" → {"ABB", ...}
  allBrands: Set<string>; // Todas las marcas del catálogo
  allFamilies: Set<string>; // Todas las familias
  allCategories: Set<string>; // Todas las categorías
  totalProducts: number;
}

declare global {
  var searchIndexInstance: MiniSearch<ProductDocument> | null;
  var catalogSynthesis: CatalogSynthesis | null;
  var isIndexing: boolean;
}

if (!global.searchIndexInstance) {
  global.searchIndexInstance = null;
  global.catalogSynthesis = null;
  global.isIndexing = false;
}

/**
 * Inicializa y descarga todo el catálogo a la RAM desde Firestore.
 * Ahora también construye la SÍNTESIS de marcas por familia/categoría.
 * @intervention IMPL-20260225-02 + FIX-20260303-02
 */
export async function initializeSearchIndex(): Promise<
  MiniSearch<ProductDocument>
> {
  if (global.searchIndexInstance && global.catalogSynthesis) {
    return global.searchIndexInstance;
  }

  if (global.isIndexing) {
    // Simple polling si otro request ya disparó la indexación concurrently
    console.log("[MiniSearch] Ya hay una indexación en progreso, esperando...");
    while (global.isIndexing) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return global.searchIndexInstance!;
  }

  try {
    global.isIndexing = true;
    console.log(
      "[MiniSearch] Inicializando indexación masiva del catálogo desde Firestore...",
    );

    const miniSearch = new MiniSearch<ProductDocument>({
      fields: ["sku", "skuNormalized", "description", "supplier", "category", "family"], // Campos en los que buscaremos
      storeFields: [
        "sku",
        "description",
        "price",
        "currency",
        "supplier",
        "stock",
        "category",
        "family",
        "status",
      ], // Campos a retornar
      searchOptions: {
        boost: { sku: 2, skuNormalized: 3 }, // skuNormalized con boost mayor: match sin guiones tiene alta prioridad
        fuzzy: 0.2, // Tolerancia a fallos ortográficos leves ("Tladro" -> "Taladro")
        prefix: true, // Soporta autocompletado parcial ("Talad" -> "Taladro")
      },
    });

    const snap = await db
      .collection("products")
      .where("status", "==", "active")
      .get();

    // === CONSTRUIR SÍNTESIS Y DOCUMENTOS AL MISMO TIEMPO ===
    const docs: ProductDocument[] = [];
    const synthesis: CatalogSynthesis = {
      brandsByFamily: new Map(),
      brandsByCategory: new Map(),
      allBrands: new Set(),
      allFamilies: new Set(),
      allCategories: new Set(),
      totalProducts: 0,
    };

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.sku) {
        const supplier = (data.supplier || "").trim();
        const family = (data.family || "").trim().toUpperCase();
        const category = (data.category || "").trim().toUpperCase();

        docs.push({
          id: data.sku,
          sku: data.sku,
          // FIX ARCH-20260422-01: Índice alternativo sin separadores para que
          // búsquedas como "456789" encuentren SKUs almacenados como "456-789"
          skuNormalized: (data.sku as string).replace(/[-._\s]/g, ""),
          description: data.description || "",
          price: data.price || 0,
          currency: data.currency || "MXN",
          supplier: supplier,
          stock: data.stock || 0,
          category: data.category || "",
          family: data.family || "",
          status: data.status || "active",
        });

        // Construir síntesis de marcas por familia
        if (supplier) {
          synthesis.allBrands.add(supplier);

          if (family) {
            synthesis.allFamilies.add(family);
            if (!synthesis.brandsByFamily.has(family)) {
              synthesis.brandsByFamily.set(family, new Set());
            }
            synthesis.brandsByFamily.get(family)!.add(supplier);
          }

          if (category) {
            synthesis.allCategories.add(category);
            if (!synthesis.brandsByCategory.has(category)) {
              synthesis.brandsByCategory.set(category, new Set());
            }
            synthesis.brandsByCategory.get(category)!.add(supplier);
          }
        }
      }
    });

    synthesis.totalProducts = docs.length;
    miniSearch.addAll(docs);
    global.searchIndexInstance = miniSearch;
    global.catalogSynthesis = synthesis;

    console.log(
      `[MiniSearch] Indexación completada: ${docs.length} productos, ${synthesis.allBrands.size} marcas, ${synthesis.allFamilies.size} familias en memoria.`,
    );
    return miniSearch;
  } catch (error) {
    console.error("[MiniSearch] Falló la creación del índice:", error);
    throw error;
  } finally {
    global.isIndexing = false;
  }
}

/**
 * Función principal para buscar productos en milisegundos sin tocar Base de Datos.
 */
export async function searchLocalProducts(
  query: string,
  limit: number = 5,
): Promise<string> {
  try {
    let index = global.searchIndexInstance;

    // Cold start: Si el contenedor reinició (Vercel Serverless) reconstruye el índice
    if (!index) {
      index = await initializeSearchIndex();
    }

    const normalizedQuery = query.trim();
    if (!normalizedQuery) return "Consulta vacía.";

    // Búsqueda ultrarrápida (RAM)
    let results = index.search(normalizedQuery, {
      // Ajustamos la lógica fuzzy para combinaciones de SKU (que en general de ser cortos mejor no sean fuzzy)
      fuzzy: normalizedQuery.length > 4 ? 0.2 : false,
    });

    // FIX ARCH-20260422-01: Si no hay resultados, intentar búsqueda con query
    // normalizado (sin guiones/puntos/espacios). Cubre el caso donde el usuario
    // escribe "456-789" y el SKU en BD es "456789", o viceversa.
    if (results.length === 0) {
      const strippedQuery = normalizedQuery.replace(/[-._\s]/g, "");
      if (strippedQuery !== normalizedQuery && strippedQuery.length > 0) {
        results = index.search(strippedQuery, {
          fuzzy: strippedQuery.length > 4 ? 0.2 : false,
        });
      }
    }

    if (results.length === 0) {
      return `No se encontraron productos coincidentes para "${query}". Intenta con otros términos.`;
    }

    // Formatear los top N resultados para Claude
    // Modificación de seguridad: Encubrir stock real
    const formattedLines = results.slice(0, limit).map((res) => {
      const stockStatus = res.stock > 0 ? "Disponible" : "Agotado";
      return `- SKU: ${res.sku} | Desc: ${res.description} | Disp: ${stockStatus} | Precio: ${res.price} ${res.currency} | Prov: ${res.supplier} | Fam: ${res.family}`;
    });

    return `Resultados de Catálogo (${results.length} encontrados, mostrando top ${limit}):\n${formattedLines.join("\n")}`;
  } catch (error) {
    console.error("[searchLocalProducts] Error en búsqueda:", error);
    return "Ocurrió un error leyendo el inventario local. Solicita asistencia humana si es urgente.";
  }
}

/**
 * Utilidad expuesta para forzar el vaciado de la caché, útil si un admin inserta
 * masivamente nuevos productos desde el backend.
 */
export function invalidateSearchIndexCaches() {
  console.log(
    "[MiniSearch] Invalidando índice y síntesis de RAM. Se reconstruirá en la próxima consulta.",
  );
  global.searchIndexInstance = null;
  global.catalogSynthesis = null;
}

/**
 * Devuelve las marcas disponibles usando la SÍNTESIS PRE-CONSTRUIDA (no depende de búsqueda fuzzy).
 * Si se pasa un filtro de categoría, busca coincidencias parciales en familias y categorías.
 * Si no se pasa filtro, devuelve TODAS las marcas.
 * @intervention FIX-20260303-02
 */
export async function listBrandsByCategory(
  categoryFilter?: string,
): Promise<string> {
  try {
    // Asegurar que la síntesis esté cargada
    if (!global.catalogSynthesis) {
      await initializeSearchIndex();
    }
    const synthesis = global.catalogSynthesis!;

    // Sin filtro: devolver TODAS las marcas
    if (!categoryFilter || !categoryFilter.trim()) {
      const brands = Array.from(synthesis.allBrands).sort();
      return `Marcas en el catálogo completo de ELECSA (${brands.length} marcas, ${synthesis.totalProducts} productos):\n${brands.join(", ")}`;
    }

    // Con filtro: buscar en familias Y categorías con coincidencia parcial
    const filter = categoryFilter.trim().toUpperCase();
    const matchedBrands = new Set<string>();
    const matchedSources: string[] = [];

    // Buscar en familias (ej. "CABLE" match "CABLE", "CABLE USO RUDO", etc.)
    for (const [family, brands] of synthesis.brandsByFamily) {
      if (family.includes(filter) || filter.includes(family)) {
        for (const brand of brands) matchedBrands.add(brand);
        matchedSources.push(family);
      }
    }

    // Buscar también en categorías
    for (const [category, brands] of synthesis.brandsByCategory) {
      if (category.includes(filter) || filter.includes(category)) {
        for (const brand of brands) matchedBrands.add(brand);
        if (!matchedSources.includes(category)) matchedSources.push(category);
      }
    }

    if (matchedBrands.size === 0) {
      // Fallback: búsqueda fuzzy en MiniSearch por si el término no coincide con family/category exactas
      const index = global.searchIndexInstance;
      if (index) {
        const results = index.search(filter, { fuzzy: 0.3, prefix: true });
        for (const r of results) {
          if (r.supplier && String(r.supplier).trim()) {
            matchedBrands.add(String(r.supplier).trim());
          }
        }
      }

      if (matchedBrands.size === 0) {
        return `No se encontraron marcas para "${categoryFilter}". No manejamos esa línea o el término no coincide con nuestras familias de producto.`;
      }
    }

    const brands = Array.from(matchedBrands).sort();
    const sourcesInfo =
      matchedSources.length > 0
        ? ` (familias: ${matchedSources.join(", ")})`
        : "";
    return `Marcas disponibles en "${categoryFilter}"${sourcesInfo} — ${brands.length} marcas:\n${brands.join(", ")}`;
  } catch (error) {
    console.error("[listBrandsByCategory] Error:", error);
    return "Error al consultar marcas. Solicita asistencia humana.";
  }
}

/**
 * Lista las familias/categorías únicas disponibles en el catálogo.
 * Usa la SÍNTESIS PRE-CONSTRUIDA para respuesta instantánea.
 * @intervention FIX-20260303-02
 */
export async function listCategories(): Promise<string> {
  try {
    if (!global.catalogSynthesis) {
      await initializeSearchIndex();
    }
    const synthesis = global.catalogSynthesis!;

    const families = Array.from(synthesis.allFamilies).sort();
    const categories = Array.from(synthesis.allCategories).sort();

    let result = `Familias de productos disponibles en ELECSA (${families.length}):\n${families.join(", ")}`;
    if (categories.length > 0) {
      result += `\n\nCategorías (${categories.length}):\n${categories.join(", ")}`;
    }
    result += `\n\nTotal de marcas: ${synthesis.allBrands.size} | Total de productos: ${synthesis.totalProducts}`;
    return result;
  } catch (error) {
    console.error("[listCategories] Error:", error);
    return "Error al consultar categorías. Solicita asistencia humana.";
  }
}
