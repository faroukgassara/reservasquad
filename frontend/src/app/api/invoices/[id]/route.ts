import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;
        const apiRes = await api.get(
            `/backoffice/invoice/${id}`,
            await CommonFunction.createHeaders({ customToken: authorization }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;
        const apiRes = await api.delete(
            `/backoffice/invoice/${id}`,
            {},
            await CommonFunction.createHeaders({ customToken: authorization }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
