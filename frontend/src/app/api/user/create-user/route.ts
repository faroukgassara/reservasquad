// src/app/api/user/create-user/route.ts
import { NextResponse } from 'next/server';
import { CommonFunction, Config } from '@/common';
import { Api } from '@/common/StandardApi/api';

export async function POST(req: Request) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const body = await req.json();

        const apiRes = await api.post(
            `/user/create-user`,
            body,
            await CommonFunction.createHeaders({ withToken: false })
        );

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in create-user route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message || error },
            { status: 500 }
        );
    }
}