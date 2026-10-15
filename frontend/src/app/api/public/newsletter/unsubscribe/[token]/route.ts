import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

type RouteContext = { params: Promise<{ token: string }> };

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{10,64}$/;

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const { token } = await context.params;
        if (!token || !TOKEN_PATTERN.test(token)) {
            return NextResponse.json({ message: 'Invalid token format' }, { status: 400 });
        }
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const apiRes = await api.get(
            `/public/newsletter/unsubscribe/${token}`,
            await CommonFunction.createHeaders({ withToken: false }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}

export async function POST(_req: NextRequest, context: RouteContext) {
    try {
        const { token } = await context.params;
        if (!token || !TOKEN_PATTERN.test(token)) {
            return NextResponse.json({ message: 'Invalid token format' }, { status: 400 });
        }
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const apiRes = await api.post(
            `/public/newsletter/unsubscribe/${token}`,
            {},
            await CommonFunction.createHeaders({ withToken: false }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
