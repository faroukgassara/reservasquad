import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function POST(req: NextRequest) {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('Authorization') ?? undefined;
        const body = await req.json();

        const headers = await CommonFunction.createHeaders({
            customToken: authorization,
        });
        const apiRes = await api.post('/backoffice/product-category', body, headers);

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in product category create route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 },
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;

        const apiRes = await api.get(
            '/backoffice/product-category/list',
            await CommonFunction.createHeaders({ customToken: authorization }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in product categories route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 },
        );
    }
}
