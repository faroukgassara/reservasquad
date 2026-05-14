import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';

export async function POST(req: NextRequest) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const authorization = req.headers.get('Authorization') ?? undefined;
        const body = await req.json();

        const headers = await CommonFunction.createHeaders({
            customToken: authorization,
        });
        const apiRes = await api.post(
            '/backoffice/formation-category',
            body,
            headers
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in formation category create route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;

        const apiRes = await api.get(
            '/backoffice/formation-category/list',
            await CommonFunction.createHeaders({ customToken: authorization })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in formation categories route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 }
        );
    }
}
