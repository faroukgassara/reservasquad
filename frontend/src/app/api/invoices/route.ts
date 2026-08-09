import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function GET(req: NextRequest) {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const { searchParams } = new URL(req.url);
        const authorization = req.headers.get('authorization') ?? undefined;
        const path = searchParams.toString()
            ? `/backoffice/invoice/list?${searchParams}`
            : '/backoffice/invoice/list';
        const apiRes = await api.get(path, await CommonFunction.createHeaders({ customToken: authorization }));
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
