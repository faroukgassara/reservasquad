import { NextRequest } from 'next/server';
import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';
import type { SubscriptionCard } from '@/lib/pos-api';
import { cardLocale, subscriptionCardImage } from '@/lib/subscription-card-image';

type RouteContext = { params: Promise<{ token: string }> };

const TOKEN_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

async function fetchCard(token: string): Promise<SubscriptionCard | null> {
    if (!TOKEN_PATTERN.test(token)) return null;
    const api = new Api(process.env.NEXT_PUBLIC_API_URL);
    const res = await api.get(
        `/public/subscription-cards/${token}`,
        await CommonFunction.createHeaders({ withToken: false }),
    );
    if (res.status === HttpStatus.NotFound) return null;
    if (res.status !== HttpStatus.SuccessOK) throw new Error(`Card request failed with status ${res.status}`);
    return (res.data as { data: SubscriptionCard }).data;
}

/** Opened by the QR code: answers with the member card itself as an image, shown directly on the phone. */
export async function GET(req: NextRequest, context: RouteContext) {
    const { token } = await context.params;
    const card = await fetchCard(token);
    return subscriptionCardImage(card, cardLocale(req.headers.get('accept-language')));
}
