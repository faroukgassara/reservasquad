import { NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function GET() {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);

        const apiRes = await api.get(
            '/faq/categories',
            await CommonFunction.createHeaders({ withToken: false }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        console.error('Error in faq categories public route:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
