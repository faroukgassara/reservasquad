import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';

export async function POST(req: NextRequest) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const body = await req.json();

        const apiRes = await api.post(
            '/contact/message',
            body,
            await CommonFunction.createHeaders({ withToken: false })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
