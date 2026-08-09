import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;
        const apiRes = await api.post(
            `/backoffice/quote/${id}/convert-to-invoice`,
            {},
            await CommonFunction.createHeaders({ customToken: authorization }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
