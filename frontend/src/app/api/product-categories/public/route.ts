import { NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function GET() {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);

        const apiRes = await api.get(
            '/product-category/list',
            await CommonFunction.createHeaders({ withToken: false }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in public product categories route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 },
        );
    }
}
