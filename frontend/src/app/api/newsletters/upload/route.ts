import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const authorization = req.headers.get('authorization') ?? undefined;
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
        }

        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

        const forwardFormData = new FormData();
        forwardFormData.append('file', file);

        const backendRes = await fetch(`${backendUrl}/backoffice/newsletter/upload`, {
            method: 'POST',
            headers: {
                ...(authorization ? { Authorization: authorization } : {}),
            },
            body: forwardFormData,
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
