import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;
        const apiRes = await api.get(
            `/backoffice/newsletter/${id}`,
            await CommonFunction.createHeaders({ customToken: authorization }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const body = await req.json();
        const authorization = req.headers.get('authorization') ?? undefined;
        const apiRes = await api.put(
            `/backoffice/newsletter/${id}`,
            body,
            await CommonFunction.createHeaders({ customToken: authorization }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;
        const apiRes = await api.delete(
            `/backoffice/newsletter/${id}`,
            {},
            await CommonFunction.createHeaders({ customToken: authorization }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
