import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function GET(req: NextRequest) {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const { searchParams } = new URL(req.url);
        const queryString = searchParams.toString();
        const authorization = req.headers.get('authorization') ?? undefined;

        const listPath = queryString
            ? `/backoffice/audit-log/list?${queryString}`
            : '/backoffice/audit-log/list';

        const apiRes = await api.get(
            listPath,
            await CommonFunction.createHeaders({ customToken: authorization }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: 'Internal server error', details: message },
            { status: 500 },
        );
    }
}
