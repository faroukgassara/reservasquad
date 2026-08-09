import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization =
            req.headers.get('Authorization') ?? req.headers.get('authorization') ?? undefined;
        const body = await req.json();

        const apiRes = await api.post(
            `/backoffice/product-category/${id}`,
            body,
            await CommonFunction.createHeaders({ customToken: authorization }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in product category update route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 },
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization =
            req.headers.get('Authorization') ?? req.headers.get('authorization') ?? undefined;

        const apiRes = await api.delete(
            `/backoffice/product-category/${id}`,
            {},
            await CommonFunction.createHeaders({ customToken: authorization }),
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in product category delete route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 },
        );
    }
}
