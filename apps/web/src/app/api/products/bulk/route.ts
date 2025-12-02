import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { products, clearExisting } = await request.json();

        if (!Array.isArray(products)) {
            return NextResponse.json({ error: 'Products must be an array' }, { status: 400 });
        }

        const batch = adminDb.batch();

        // Clear existing products if requested
        if (clearExisting) {
            const existingProducts = await adminDb.collection('products').get();
            existingProducts.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
        }

        // Add new products
        products.forEach((product) => {
            if (!product.sku) return;

            const docRef = adminDb.collection('products').doc(product.sku);
            batch.set(docRef, {
                sku: product.sku.toUpperCase(),
                description: product.description || '',
                price: Number(product.price) || 0,
                currency: product.currency || 'USD',
                status: product.status || 'active',
                updatedAt: new Date().toISOString(),
            });
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            count: products.length,
            cleared: clearExisting
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        return NextResponse.json({ error: 'Failed to upload products' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest) {
    try {
        const batch = adminDb.batch();
        const snapshot = await adminDb.collection('products').get();

        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return NextResponse.json({ success: true, count: snapshot.size });
    } catch (error) {
        console.error('Delete all products error:', error);
        return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
    }
}
