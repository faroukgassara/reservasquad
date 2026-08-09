import { NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function POST(req: Request) {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const body = await req.json();

        const apiRes = await api.post(
            '/auth/register',
            body,
            await CommonFunction.createHeaders({ withToken: false }),
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
