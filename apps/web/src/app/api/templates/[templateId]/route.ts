
// src/app/api/templates/[templateId]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function PUT(req: Request, { params }: { params: Promise<{ templateId: string }> }) {
    try {
        const { templateId } = await params;
        const { title, content } = await req.json();
        if (!title || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        await adminDb.collection('templates').doc(templateId).update({ title, content });
        return NextResponse.json({ id: templateId, title, content });
    } catch (error: any) {
        console.error('Error updating template', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ templateId: string }> }) {
    try {
        const { templateId } = await params;
        await adminDb.collection('templates').doc(templateId).delete();
        return NextResponse.json({ status: 'ok', id: templateId });
    } catch (error: any) {
        console.error('Error deleting template', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

