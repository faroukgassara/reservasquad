import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const authorization = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? undefined;

        const apiRes = await api.post(
            `/backoffice/formation/${id}/archive`,
            {},
            await CommonFunction.createHeaders({ customToken: authorization })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in formation archive route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 }
        );
    }
}
