import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function GET(req: NextRequest) {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const { searchParams } = new URL(req.url);
        const take = searchParams.get('take');
        const categoryId = searchParams.get('categoryId');
        const params = new URLSearchParams();
        if (take) params.set('take', take);
        if (categoryId) params.set('categoryId', categoryId);
        const query = params.toString() ? `?${params.toString()}` : '';

        const apiRes = await api.get(
            `/faq/list${query}`,
            await CommonFunction.createHeaders({ withToken: false }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        console.error('Error in faq public list:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
