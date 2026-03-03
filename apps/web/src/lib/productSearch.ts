// src/lib/productSearch.ts
import { getFirestore } from 'firebase-admin/firestore';
import MiniSearch from 'minisearch';
import '@/lib/firebase-admin';

const db = getFirestore();

// Interfaces
interface ProductDocument {
    id: string; // SKU será el ID
    sku: string;
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
declare global {
    var searchIndexInstance: MiniSearch<ProductDocument> | null;
    var isIndexing: boolean;
}

if (!global.searchIndexInstance) {
    global.searchIndexInstance = null;
    global.isIndexing = false;
}

/**
 * Inicializa y descarga todo el catálogo a la RAM desde Firestore.
 * @intervention IMPL-20260225-02
 */
export async function initializeSearchIndex(): Promise<MiniSearch<ProductDocument>> {
    if (global.searchIndexInstance) {
        return global.searchIndexInstance;
    }

    if (global.isIndexing) {
        // Simple polling si otro request ya disparó la indexación concurrently
        console.log('[MiniSearch] Ya hay una indexación en progreso, esperando...');
        while (global.isIndexing) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return global.searchIndexInstance!;
    }

    try {
        global.isIndexing = true;
        console.log('[MiniSearch] Inicializando indexación masiva del catálogo desde Firestore...');

        const miniSearch = new MiniSearch<ProductDocument>({
            fields: ['sku', 'description', 'supplier', 'category', 'family'], // Campos en los que buscaremos
            storeFields: ['sku', 'description', 'price', 'currency', 'supplier', 'stock', 'category', 'family', 'status'], // Campos a retornar
            searchOptions: {
                boost: { sku: 2 }, // El SKU exacto tiene prioridad
                fuzzy: 0.2,        // Tolerancia a fallos ortográficos leves ("Tladro" -> "Taladro")
                prefix: true       // Soporta autocompletado parcial ("Talad" -> "Taladro")
            }
        });

        const snap = await db.collection('products')
            .where('status', '==', 'active')
            .get();

        const docs: ProductDocument[] = [];
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.sku) {
                docs.push({
                    id: data.sku, // Requerido por MiniSearch
                    sku: data.sku,
                    description: data.description || '',
                    price: data.price || 0,
                    currency: data.currency || 'MXN',
                    supplier: data.supplier || '',
                    stock: data.stock || 0,
                    category: data.category || '',
                    family: data.family || '',
                    status: data.status || 'active'
                });
            }
        });

        miniSearch.addAll(docs);
        global.searchIndexInstance = miniSearch;

        console.log(`[MiniSearch] Indexación completada: ${docs.length} productos en memoria listos para buscar.`);
        return miniSearch;

    } catch (error) {
        console.error('[MiniSearch] Falló la creación del índice:', error);
        throw error;
    } finally {
        global.isIndexing = false;
    }
}

/**
 * Función principal para buscar productos en milisegundos sin tocar Base de Datos.
 */
export async function searchLocalProducts(query: string, limit: number = 5): Promise<string> {
    try {
        let index = global.searchIndexInstance;

        // Cold start: Si el contenedor reinició (Vercel Serverless) reconstruye el índice
        if (!index) {
            index = await initializeSearchIndex();
        }

        const normalizedQuery = query.trim();
        if (!normalizedQuery) return "Consulta vacía.";

        // Búsqueda ultrarrápida (RAM)
        const results = index.search(normalizedQuery, {
            // Ajustamos la lógica fuzzy para combinaciones de SKU (que en general de ser cortos mejor no sean fuzzy)
            fuzzy: normalizedQuery.length > 4 ? 0.2 : false
        });

        if (results.length === 0) {
            return `No se encontraron productos coincidentes para "${query}". Intenta con otros términos.`;
        }

        // Formatear los top N resultados para Claude
        const formattedLines = results.slice(0, limit).map(res => {
            return `- SKU: ${res.sku} | Desc: ${res.description} | Disp: ${res.stock} | Precio: ${res.price} ${res.currency} | Prov: ${res.supplier} | Fam: ${res.family}`;
        });

        return `Resultados de Catálogo (${results.length} encontrados, mostrando top ${limit}):\n${formattedLines.join('\n')}`;

    } catch (error) {
        console.error('[searchLocalProducts] Error en búsqueda:', error);
        return 'Ocurrió un error leyendo el inventario local. Solicita asistencia humana si es urgente.';
    }
}

/**
 * Utilidad expuesta para forzar el vaciado de la caché, útil si un admin inserta 
 * masivamente nuevos productos desde el backend.
 */
export function invalidateSearchIndexCaches() {
    console.log('[MiniSearch] Invalidando índice de RAM. Se reconstruirá en la próxima consulta.');
    global.searchIndexInstance = null;
}

/**
 * Escanea todo el índice en RAM y devuelve las marcas (suppliers) únicas
 * que coinciden con una categoría, familia o término general.
 * Si no se pasa filtro, devuelve TODAS las marcas del catálogo.
 * @intervention FIX-20260303-01
 */
export async function listBrandsByCategory(categoryFilter?: string): Promise<string> {
    try {
        let index = global.searchIndexInstance;
        if (!index) {
            index = await initializeSearchIndex();
        }

        // Si hay filtro, buscamos productos que coincidan y extraemos sus marcas
        if (categoryFilter && categoryFilter.trim()) {
            const results = index.search(categoryFilter.trim(), {
                fuzzy: 0.2,
                prefix: true,
            });

            if (results.length === 0) {
                return `No se encontraron productos en la categoría "${categoryFilter}". No manejamos esa línea o intenta con otro término.`;
            }

            // Extraer marcas únicas de los resultados
            const brandsSet = new Set<string>();
            for (const r of results) {
                if (r.supplier && String(r.supplier).trim()) {
                    brandsSet.add(String(r.supplier).trim());
                }
            }

            const brands = Array.from(brandsSet).sort();
            return `Marcas disponibles en "${categoryFilter}" (${brands.length} marcas, ${results.length} productos encontrados):\n${brands.join(', ')}`;
        }

        // Sin filtro: extraer TODAS las marcas del catálogo completo
        // Usamos una búsqueda con wildcard vacía — MiniSearch no lo soporta, 
        // así que accedemos a los documentos almacenados directamente.
        const allDocs = (index as any)._storedFields;
        const brandsSet = new Set<string>();

        if (allDocs) {
            for (const [, fields] of allDocs) {
                const supplier = fields?.supplier;
                if (supplier && String(supplier).trim()) {
                    brandsSet.add(String(supplier).trim());
                }
            }
        }

        const brands = Array.from(brandsSet).sort();
        return `Marcas disponibles en el catálogo completo de ELECSA (${brands.length} marcas):\n${brands.join(', ')}`;

    } catch (error) {
        console.error('[listBrandsByCategory] Error:', error);
        return 'Error al consultar marcas. Solicita asistencia humana.';
    }
}

/**
 * Lista las familias/categorías únicas disponibles en el catálogo.
 * @intervention FIX-20260303-01
 */
export async function listCategories(): Promise<string> {
    try {
        let index = global.searchIndexInstance;
        if (!index) {
            index = await initializeSearchIndex();
        }

        const allDocs = (index as any)._storedFields;
        const familiesSet = new Set<string>();
        const categoriesSet = new Set<string>();

        if (allDocs) {
            for (const [, fields] of allDocs) {
                if (fields?.family && String(fields.family).trim()) {
                    familiesSet.add(String(fields.family).trim());
                }
                if (fields?.category && String(fields.category).trim()) {
                    categoriesSet.add(String(fields.category).trim());
                }
            }
        }

        const families = Array.from(familiesSet).sort();
        const categories = Array.from(categoriesSet).sort();

        let result = `Familias de productos (${families.length}):\n${families.join(', ')}`;
        if (categories.length > 0) {
            result += `\n\nCategorías (${categories.length}):\n${categories.join(', ')}`;
        }
        return result;

    } catch (error) {
        console.error('[listCategories] Error:', error);
        return 'Error al consultar categorías. Solicita asistencia humana.';
    }
}
