import { NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';

export async function POST(req: Request) {
    try {
        const config = Config.getInstance();
        const api = new Api(config.API_URL);
        const authorization = req.headers.get('Authorization') ?? undefined;
        const body = await req.json();

        const headers = await CommonFunction.createHeaders({
            customToken: authorization,
        });
        const apiRes = await api.post('/backoffice/formation', body, headers);

        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: any) {
        console.error('Error in formation create route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message || error },
            { status: 500 }
        );
    }
}
