// src/app/api/templates/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const snap = await adminDb.collection('templates').orderBy('title').get();
        const templates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ templates });
    } catch (error: any) {
        console.error('Error fetching templates', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { title, content } = await req.json();
        if (!title || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        const docRef = await adminDb.collection('templates').add({ title, content });
        return NextResponse.json({ id: docRef.id, title, content });
    } catch (error: any) {
        console.error('Error creating template', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
