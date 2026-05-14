import { NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';

export async function POST(req: Request) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const { searchParams } = new URL(req.url);
        const lang = searchParams.get('lang') || 'fr';
        const body = await req.json();

        const apiRes = await api.post(
            `/auth/reset-password?lang=${lang}`,
            body,
            await CommonFunction.createHeaders({ withToken: false })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 }
        );
    }
}
