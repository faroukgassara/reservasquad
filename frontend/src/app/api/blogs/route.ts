import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';

export async function POST(req: NextRequest) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const authorization = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? undefined;
        const body = await req.json();

        const apiRes = await api.post(
            '/backoffice/blog',
            body,
            await CommonFunction.createHeaders({ customToken: authorization })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        console.error('Error in blogs POST:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;

        const apiRes = await api.get(
            '/backoffice/blog/list',
            await CommonFunction.createHeaders({ customToken: authorization })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        console.error('Error in blogs GET:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
