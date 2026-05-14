import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';

export async function GET(req: NextRequest) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const { searchParams } = new URL(req.url);

        const authorization = req.headers.get('authorization') ?? undefined;

        const queryString = searchParams.toString();
        const apiRes = await api.get(
            `/backoffice/formation/list${queryString ? `?${queryString}` : ''}`,
            await CommonFunction.createHeaders({ customToken: authorization })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in formation list route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 }
        );
    }
}
