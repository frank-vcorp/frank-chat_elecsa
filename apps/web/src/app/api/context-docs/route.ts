import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const COLLECTION = 'context_docs';

export async function GET() {
  try {
    const snapshot = await adminDb.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(docs);
  } catch (error) {
    console.error('[API/context-docs] GET error', error);
    return NextResponse.json({ error: 'Failed to fetch context docs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, source = 'products-page' } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'Missing title or content' }, { status: 400 });
    }

    const size = Buffer.byteLength(content, 'utf8');
    const MAX_SIZE_BYTES = 250 * 1024; // ~250KB por documento
    if (size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Document too large', maxSizeBytes: MAX_SIZE_BYTES }, { status: 400 });
    }

    const doc = {
      title,
      content,
      source,
      active: true,
      size,
      createdAt: new Date().toISOString(),
    };

    const ref = await adminDb.collection(COLLECTION).add(doc);
    return NextResponse.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (error) {
    console.error('[API/context-docs] POST error', error);
    return NextResponse.json({ error: 'Failed to save context doc' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, active } = await req.json();
    if (!id || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Missing id or active' }, { status: 400 });
    }

    await adminDb.collection(COLLECTION).doc(id).update({ active });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/context-docs] PATCH error', error);
    return NextResponse.json({ error: 'Failed to update context doc' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await adminDb.collection(COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/context-docs] DELETE error', error);
    return NextResponse.json({ error: 'Failed to delete context doc' }, { status: 500 });
  }
}
