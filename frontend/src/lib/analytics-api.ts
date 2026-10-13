import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export interface ProductAnalyticsQuery {
    startDate?: string;
    endDate?: string;
    limit?: number;
    productId?: string;
    categoryId?: string;
    interval?: 'day' | 'month';
}

export interface ProductLeaderboardItem {
    rank: number;
    productId: string;
    productName: string;
    categoryName: string | null;
    imageUrl: string | null;
    price: number;
    unitsSold: number;
    totalRevenue: number;
    ordersCount: number;
    percentageOfTotalSales: number;
}

export interface MonthlySalesTrendItem {
    month: string;
    label: string;
    unitsSold: number;
    totalRevenue: number;
    ordersCount: number;
}

export interface ProductAnalyticsSummary {
    totalUnitsSold: number;
    totalRevenue: number;
    totalOrdersCount: number;
    productsCount: number;
}

export interface ProductBreakdownDetails {
    product: {
        id: string;
        name: string;
        imageUrl: string | null;
        price: number;
        cost: number;
        stockQty: number;
        categoryName: string | null;
    };
    totalUnitsSold: number;
    totalRevenue: number;
    ordersCount: number;
    monthlyTrends: MonthlySalesTrendItem[];
}

export interface ProductAnalyticsResponse {
    timeframe: {
        startDate: string | null;
        endDate: string | null;
        limit: number | null;
    };
    summary: ProductAnalyticsSummary;
    topSellingByQuantity: ProductLeaderboardItem[];
    topSellingByRevenue: ProductLeaderboardItem[];
    monthlyTrends: MonthlySalesTrendItem[];
    productBreakdown: ProductBreakdownDetails | null;
}

export type AnalyticsTimeframePreset = '30d' | 'ytd' | 'all' | 'custom' | 'compare';

function formatIsoDateOnly(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getTimeframePresetRange(preset: AnalyticsTimeframePreset): {
    startDate?: string;
    endDate?: string;
} {
    const now = new Date();
    const endStr = formatIsoDateOnly(now);

    if (preset === '30d') {
        const past = new Date(now);
        past.setDate(past.getDate() - 30);
        return { startDate: formatIsoDateOnly(past), endDate: endStr };
    }

    if (preset === 'ytd') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { startDate: formatIsoDateOnly(yearStart), endDate: endStr };
    }

    // 'all', 'custom' or 'compare'
    return {};
}

function unwrapData<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

export async function fetchProductAnalytics(
    query: ProductAnalyticsQuery = {},
): Promise<ProductAnalyticsResponse> {
    const params = new URLSearchParams();
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    if (query.productId) params.set('productId', query.productId);
    if (query.categoryId) params.set('categoryId', query.categoryId);
    if (query.interval) params.set('interval', query.interval);

    const queryString = params.toString();
    const endpoint = queryString
        ? `/api/analytics/products?${queryString}`
        : '/api/analytics/products';

    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(endpoint, headers);

    if (res.status !== HttpStatus.SuccessOK) {
        const body = res.data as { message?: string | string[]; error?: string } | undefined;
        const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
        throw new Error(msg || body?.error || 'Failed to fetch product analytics');
    }

    return unwrapData<ProductAnalyticsResponse>(res.data as { data?: ProductAnalyticsResponse });
}
