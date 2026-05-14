import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const config = Config.getInstance();
        const api = new Api(config.API_URL);

        const apiRes = await api.get(
            `/blog/slug/${encodeURIComponent(slug)}`,
            await CommonFunction.createHeaders({ withToken: false })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        console.error('Error in blog slug route:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
