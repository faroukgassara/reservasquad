import { NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function POST(req: Request) {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('Authorization') ?? undefined;
        const body = await req.json();

        const headers = await CommonFunction.createHeaders({
            customToken: authorization,
        });
        const apiRes = await api.post('/backoffice/product', body, headers);

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in product create route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 },
        );
    }
}
