// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/products
 * Returns a list of all products in the catalog.
 */
export async function GET(request: NextRequest) {
    try {
        const snapshot = await adminDb.collection('products').get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

/**
 * POST /api/products
 * Creates a new product. Expects a JSON body with at least `sku`.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sku, ...rest } = body;
        if (!sku) {
            return NextResponse.json({ error: 'Missing sku' }, { status: 400 });
        }
        const productRef = adminDb.collection('products').doc(sku);
        await productRef.set({ sku, ...rest, createdAt: FieldValue.serverTimestamp() });
        return NextResponse.json({ message: 'Product created', sku });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
