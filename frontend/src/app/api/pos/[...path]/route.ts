import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';

type RouteContext = { params: Promise<{ path: string[] }> };

const SEGMENT_PATTERN = /^[A-Za-z0-9-]+$/;

async function resolveBackendPath(req: NextRequest, context: RouteContext): Promise<string | null> {
    const { path } = await context.params;
    if (!path?.length || !path.every((segment) => SEGMENT_PATTERN.test(segment))) return null;
    const queryString = new URL(req.url).searchParams.toString();
    const base = `/backoffice/pos/${path.join('/')}`;
    return queryString ? `${base}?${queryString}` : base;
}

function invalidPath() {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
}

function internalError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
}

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const backendPath = await resolveBackendPath(req, context);
        if (!backendPath) return invalidPath();
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;
        const apiRes = await api.get(
            backendPath,
            await CommonFunction.createHeaders({ customToken: authorization }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        return internalError(error);
    }
}

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const backendPath = await resolveBackendPath(req, context);
        if (!backendPath) return invalidPath();
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const body = await req.json();
        const authorization = req.headers.get('authorization') ?? undefined;
        const apiRes = await api.post(
            backendPath,
            body,
            await CommonFunction.createHeaders({ customToken: authorization }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        return internalError(error);
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const backendPath = await resolveBackendPath(req, context);
        if (!backendPath) return invalidPath();
        const api = new Api(process.env.NEXT_PUBLIC_API_URL);
        const authorization = req.headers.get('authorization') ?? undefined;
        const apiRes = await api.delete(
            backendPath,
            {},
            await CommonFunction.createHeaders({ customToken: authorization }),
        );
        return NextResponse.json(apiRes.data, { status: apiRes.status });
    } catch (error: unknown) {
        return internalError(error);
    }
}
