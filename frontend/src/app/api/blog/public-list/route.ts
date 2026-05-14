import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';

export async function GET(req: NextRequest) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const { searchParams } = new URL(req.url);
        const take = searchParams.get('take') ?? '12';
        const query = new URLSearchParams({ take }).toString();

        const apiRes = await api.get(
            `/blog/list?${query}`,
            await CommonFunction.createHeaders({ withToken: false })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        console.error('Error in blog public list:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
