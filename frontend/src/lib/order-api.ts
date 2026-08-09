import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

export type ShippingMethod = 'STANDARD' | 'EXPRESS' | 'PICKUP';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export const SHIPPING_OPTIONS: Array<{
    method: ShippingMethod;
    fee: number;
}> = [
    { method: 'STANDARD', fee: 2 },
    { method: 'EXPRESS', fee: 7 },
    { method: 'PICKUP', fee: 0 },
];

export function getShippingFee(method: ShippingMethod): number {
    return SHIPPING_OPTIONS.find((option) => option.method === method)?.fee ?? 0;
}

export type CreateOrderLinePayload = {
    productId?: string;
    productTitle: string;
    productSlug: string;
    imageUrl?: string;
    unitPrice: number;
    quantity: number;
    material?: string;
    size?: string;
    engraving?: string;
};

export type CreateOrderPayload = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    governorate: string;
    postalCode: string;
    shippingMethod: ShippingMethod;
    lines: CreateOrderLinePayload[];
};

export type OrderLineRecord = {
    id: string;
    productId: string | null;
    productTitle: string;
    productSlug: string;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    material: string | null;
    size: string | null;
    engraving: string | null;
    lineTotal: number;
};

export type OrderRecord = {
    id: string;
    number: string;
    status: OrderStatus;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    governorate: string;
    postalCode: string;
    shippingMethod: ShippingMethod;
    shippingFee: number;
    subtotal: number;
    total: number;
    createdAt: string;
    updatedAt: string;
    lines?: OrderLineRecord[];
    _count?: { lines?: number };
};

export type PaginatedOrders = {
    data: OrderRecord[];
    meta: {
        total: number;
        currentPage: number;
        perPage: number;
        lastPage: number;
        prev: number | null;
        next: number | null;
        hasMore: boolean;
    };
};

const api = new Api();

function unwrapData<T>(payload: unknown): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as { data: T }).data;
    }
    return payload as T;
}

function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function asNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function mapOrderLine(raw: Record<string, unknown>): OrderLineRecord {
    return {
        id: asString(raw.id),
        productId: raw.productId ? asString(raw.productId) : null,
        productTitle: asString(raw.productTitle),
        productSlug: asString(raw.productSlug),
        imageUrl: raw.imageUrl ? asString(raw.imageUrl) : null,
        unitPrice: asNumber(raw.unitPrice),
        quantity: asNumber(raw.quantity),
        material: raw.material ? asString(raw.material) : null,
        size: raw.size ? asString(raw.size) : null,
        engraving: raw.engraving ? asString(raw.engraving) : null,
        lineTotal: asNumber(raw.lineTotal),
    };
}

function mapOrder(raw: Record<string, unknown>): OrderRecord {
    const linesRaw = Array.isArray(raw.lines) ? raw.lines : [];
    return {
        id: asString(raw.id),
        number: asString(raw.number),
        status: asString(raw.status, 'PENDING') as OrderStatus,
        firstName: asString(raw.firstName),
        lastName: asString(raw.lastName),
        email: asString(raw.email),
        phone: asString(raw.phone),
        address: asString(raw.address),
        city: asString(raw.city),
        governorate: asString(raw.governorate),
        postalCode: asString(raw.postalCode),
        shippingMethod: asString(raw.shippingMethod, 'STANDARD') as ShippingMethod,
        shippingFee: asNumber(raw.shippingFee),
        subtotal: asNumber(raw.subtotal),
        total: asNumber(raw.total),
        createdAt: asString(raw.createdAt),
        updatedAt: asString(raw.updatedAt),
        lines: linesRaw.map((line) => mapOrderLine(line as Record<string, unknown>)),
    };
}

export async function createOrder(body: CreateOrderPayload): Promise<OrderRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    if (headers.Authorization === 'Bearer undefined' || headers.Authorization === 'Bearer null') {
        delete headers.Authorization;
    }

    const res = await api.post('/api/order', body, headers);

    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { message?: string; error?: string })?.message ||
            (res.data as { error?: string })?.error ||
            'Failed to place order';
        throw new Error(message);
    }

    return mapOrder(unwrapData<Record<string, unknown>>(res.data));
}

export async function fetchOrders(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: OrderStatus;
}): Promise<PaginatedOrders> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    if (params.status) sp.set('status', params.status);

    const res = await api.get(`/api/orders?${sp.toString()}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch orders');
    }

    const payload = unwrapData<{ data?: unknown[]; meta?: PaginatedOrders['meta'] } | unknown[]>(
        res.data,
    );

    if (Array.isArray(payload)) {
        return {
            data: payload.map((row) => mapOrder(row as Record<string, unknown>)),
            meta: {
                total: payload.length,
                currentPage: 1,
                perPage: payload.length,
                lastPage: 1,
                prev: null,
                next: null,
                hasMore: false,
            },
        };
    }

    const rows = Array.isArray(payload?.data) ? payload.data : [];
    return {
        data: rows.map((row) => mapOrder(row as Record<string, unknown>)),
        meta: payload.meta ?? {
            total: rows.length,
            currentPage: 1,
            perPage: rows.length,
            lastPage: 1,
            prev: null,
            next: null,
            hasMore: false,
        },
    };
}

export async function fetchOrderById(id: string): Promise<OrderRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/orders/${id}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch order');
    }
    return mapOrder(unwrapData<Record<string, unknown>>(res.data));
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.patch(`/api/orders/${id}/status`, { status }, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { message?: string })?.message || 'Failed to update order status';
        throw new Error(message);
    }
    return mapOrder(unwrapData<Record<string, unknown>>(res.data));
}

export async function deleteOrder(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/orders/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const message = (res.data as { message?: string })?.message || 'Failed to delete order';
        throw new Error(message);
    }
}
