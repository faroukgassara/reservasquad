import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? undefined;
        const body = await req.json();

        const apiRes = await api.post(
            `/backoffice/faq-category/${id}`,
            body,
            await CommonFunction.createHeaders({ customToken: authorization }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        console.error('Error in faq-categories update:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;

        const apiRes = await api.delete(
            `/backoffice/faq-category/${id}`,
            {},
            await CommonFunction.createHeaders({ customToken: authorization }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        console.error('Error in faq-categories delete:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
