import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function GET(req: NextRequest) {
    try {
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const { searchParams } = new URL(req.url);
        const queryString = searchParams.toString();

        const listPath = queryString ? '/testimonial/list?' + queryString : '/testimonial/list';

        const apiRes = await api.get(
            listPath,
            await CommonFunction.createHeaders({ withToken: false }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
