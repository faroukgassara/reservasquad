import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';
const api = new Api();

type Money = number | string;

export type PosProductType = 'STOCKABLE' | 'CONSUMABLE';
export type PosPaymentMethod = 'CASH' | 'BANK' | 'CLIENT_ACCOUNT';
export type PosOrderStatus = 'PAID' | 'REFUND';
export interface PosUserRef {
    id: string;
    firstName: string;
    lastName: string;
}

export interface PosCategory {
    id: string;
    name: string;
    imageUrl: string | null;
    sortOrder: number;
    productCount?: number;
}

export interface PosProduct {
    id: string;
    name: string;
    categoryId: string | null;
    category: Pick<PosCategory, 'id' | 'name' | 'imageUrl'> | null;
    imageUrl: string | null;
    price: Money;
    cost: Money;
    type: PosProductType;
    availableInPos: boolean;
    stockQty: Money;
    barcode: string | null;
    reference: string | null;
    taxRate: Money;
    subscriptionDuration: number | null;
    subscriptionUnit: SubscriptionUnit | null;
}

export interface PosProductInput {
    name: string;
    categoryId: string | null;
    imageUrl?: string | null;
    price: number;
    cost: number;
    type: PosProductType;
    availableInPos: boolean;
    barcode: string | null;
    reference: string | null;
    taxRate: number;
    subscriptionDuration: number | null;
    subscriptionUnit: SubscriptionUnit | null;
}

export const POS_TAX_RATES = [0, 7, 19] as const;

export interface PosProductStats {
    bought: number;
    sold: number;
    remaining: number;
}

export interface PosStockEntry {
    id: string;
    productId: string;
    quantity: Money;
    unitCost: Money;
    supplier: string | null;
    note: string | null;
    createdAt: string;
    createdBy: PosUserRef | null;
}

export interface PosSession {
    id: string;
    number: number;
    status: 'OPEN' | 'CLOSED';
    openedAt: string;
    openingCash: Money;
    openedBy: PosUserRef | null;
    closedAt: string | null;
    closedBy: PosUserRef | null;
    countedCash: Money | null;
    expectedCash: Money | null;
    difference: Money | null;
    closingNote: string | null;
    _count?: { orders: number };
}

export interface PosSessionSummary {
    session: PosSession;
    ordersCount: number;
    refundsCount: number;
    ordersTotal: number;
    openingCash: number;
    cashPayments: number;
    bankPayments: number;
    clientAccountPayments: number;
    expectedCash: number;
    revenue: number;
}

export interface PosClientRef {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
}

export interface PosPayment {
    id: string;
    method: PosPaymentMethod;
    amount: Money;
}

export interface PosOrder {
    id: string;
    number: number;
    status: PosOrderStatus;
    total: Money;
    amountPaid: Money;
    change: Money;
    note: string | null;
    createdAt: string;
    cashier: PosUserRef | null;
    creditClient: PosClientRef | null;
    payments: PosPayment[];
    session: { id: string; number: number };
    refundOf: { id: string; number: number } | null;
}

export interface PosOrderLine {
    id: string;
    productId: string | null;
    saleOrderId: string | null;
    subscriptionId: string | null;
    creditId: string | null;
    invoiceId: string | null;
    productName: string;
    quantity: Money;
    unitPrice: Money;
    discountPct: Money;
    total: Money;
    refundedQuantity: number;
    refundableQuantity: number;
}

export interface PosOrderDetail extends PosOrder {
    lines: PosOrderLine[];
    refunds: { id: string; number: number; total: Money; createdAt: string }[];
}

export interface PosOrderInput {
    lines: {
        productId?: string;
        saleOrderId?: string;
        subscriptionId?: string;
        creditId?: string;
        invoiceId?: string;
        creditRemainder?: boolean;
        quantity: number;
        unitPrice: number;
        discountPct: number;
    }[];
    payments: { method: PosPaymentMethod; amount: number }[];
    creditClientId?: string;
    note?: string;
}

export interface Paginated<T> {
    data: T[];
    meta: {
        total: number;
        currentPage: number;
        perPage: number;
        lastPage: number;
        hasMore: boolean;
    };
}

export function formatOrderNumber(value: number): string {
    return String(value).padStart(4, '0');
}

export function formatSaleNumber(value: number): string {
    return `S${String(value).padStart(5, '0')}`;
}

export function formatPosDate(value: string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'short', timeZone: 'UTC' });
}

export function toDateInput(value: string | Date | null | undefined): string {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
}

export function formatPosDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function personName(person: { firstName: string; lastName: string } | null | undefined): string {
    return person ? `${person.firstName} ${person.lastName}`.trim() : '—';
}

export function toAmount(value: Money | null | undefined): number {
    const amount = Number(value ?? 0);
    return Number.isNaN(amount) ? 0 : amount;
}

export function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function unwrapData<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

function errorFrom(data: unknown, fallback: string): Error {
    const body = data as { message?: string | string[]; error?: string } | undefined;
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    return new Error(message || body?.error || fallback);
}

function isSuccess(status: number): boolean {
    return status === HttpStatus.SuccessOK || status === HttpStatus.SuccessCreated;
}

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') sp.set(key, String(value));
    }
    const q = sp.toString();
    return q ? `${path}?${q}` : path;
}

async function posGet<T>(path: string, fallback: string): Promise<T> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/pos/${path}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, fallback);
    return unwrapData<T>(res.data as { data?: T });
}

async function posPost<T>(path: string, body: unknown, fallback: string): Promise<T> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/pos/${path}`, body, headers);
    if (!isSuccess(res.status)) throw errorFrom(res.data, fallback);
    return unwrapData<T>(res.data as { data?: T });
}

async function posDelete(path: string, fallback: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/pos/${path}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, fallback);
}

// Categories

export const fetchPosCategories = () =>
    posGet<PosCategory[]>('categories', 'Failed to fetch categories');

export const createPosCategory = (body: { name: string; sortOrder: number; imageUrl?: string | null }) =>
    posPost<PosCategory>('categories', body, 'Failed to create category');

export const updatePosCategory = (
    id: string,
    body: { name: string; sortOrder: number; imageUrl?: string | null },
) => posPost<PosCategory>(`categories/${id}`, body, 'Failed to update category');

export const deletePosCategory = (id: string) =>
    posDelete(`categories/${id}`, 'Failed to delete category');

// Products

export const fetchPosProducts = (params: {
    page?: number;
    perPage?: number;
    search?: string;
    categoryId?: string;
    availableInPos?: boolean;
    subscription?: boolean;
}) =>
    posGet<Paginated<PosProduct>>(
        withQuery('products/list', { ...params, subscription: params.subscription ? 'true' : undefined }),
        'Failed to fetch products',
    );

export const fetchAvailablePosProducts = () =>
    posGet<PosProduct[]>('products/available', 'Failed to fetch products');

export const fetchPosProduct = (id: string) =>
    posGet<PosProduct>(`products/${id}`, 'Failed to fetch product');

export const createPosProduct = (body: PosProductInput) =>
    posPost<PosProduct>('products', body, 'Failed to create product');

export const updatePosProduct = (id: string, body: Partial<PosProductInput>) =>
    posPost<PosProduct>(`products/${id}`, body, 'Failed to update product');

export const deletePosProduct = (id: string) =>
    posDelete(`products/${id}`, 'Failed to delete product');

export const fetchPosProductStats = (id: string) =>
    posGet<PosProductStats>(`products/${id}/stats`, 'Failed to fetch product stats');

export const fetchPosStockEntries = (id: string) =>
    posGet<PosStockEntry[]>(`products/${id}/stock-entries`, 'Failed to fetch purchases');

export const createPosStockEntry = (
    id: string,
    body: { quantity: number; unitCost: number; supplier?: string; note?: string },
) => posPost<PosStockEntry>(`products/${id}/stock-entries`, body, 'Failed to add purchase');

// Sessions

export const fetchCurrentPosSession = () =>
    posGet<PosSession | null>('sessions/current', 'Failed to fetch session');

export const fetchLastClosedPosSession = () =>
    posGet<PosSession | null>('sessions/last-closed', 'Failed to fetch session');

export const fetchPosSessions = (params: { page?: number; perPage?: number }) =>
    posGet<Paginated<PosSession>>(withQuery('sessions/list', params), 'Failed to fetch sessions');

export const openPosSession = (body: { openingCash: number }) =>
    posPost<PosSession>('sessions/open', body, 'Failed to open session');

export const fetchPosSessionSummary = (id: string) =>
    posGet<PosSessionSummary>(`sessions/${id}/summary`, 'Failed to fetch session summary');

export const closePosSession = (id: string, body: { countedCash: number; note?: string }) =>
    posPost<PosSession>(`sessions/${id}/close`, body, 'Failed to close session');
// Orders

export const fetchPosOrders = (params: {
    page?: number;
    perPage?: number;
    search?: string;
    sessionId?: string;
    creditClientId?: string;
    status?: PosOrderStatus;
    from?: string;
    to?: string;
}) => posGet<Paginated<PosOrder>>(withQuery('orders/list', params), 'Failed to fetch orders');

export const fetchPosOrder = (id: string) =>
    posGet<PosOrderDetail>(`orders/${id}`, 'Failed to fetch order');

/** Products paid fully on client credit become credits instead of a register order. */
export interface PosCreditSaleResult {
    onCredit: true;
    clientId: string;
    count: number;
    total: number;
}

export const createPosOrder = (body: PosOrderInput) =>
    posPost<PosOrderDetail | PosCreditSaleResult>('orders', body, 'Failed to validate order');

export const refundPosOrder = (
    id: string,
    body: { lines: { lineId: string; quantity: number }[]; method: 'CASH' | 'BANK' },
) => posPost<PosOrderDetail>(`orders/${id}/refund`, body, 'Failed to refund order');

// Documents (sale orders and invoices share the same line shape)

export interface DocumentClient extends PosClientRef {
    email: string | null;
    address: string | null;
    taxId: string | null;
    cin: string | null;
}

export interface DocumentLine {
    id: string;
    productId: string | null;
    productName: string;
    description: string | null;
    quantity: Money;
    unitPrice: Money;
    discountPct: Money;
    taxRate: Money;
    subtotal: Money;
    taxAmount: Money;
    total: Money;
}

export interface DocumentLineInput {
    productId: string | null;
    productName: string;
    description: string | null;
    quantity: number;
    unitPrice: number;
    discountPct: number;
    taxRate: number;
}

export function todayInput(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Sale orders

export type SaleOrderStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'CANCELLED';

export interface SaleOrder {
    id: string;
    number: number;
    status: SaleOrderStatus;
    orderDate: string;
    validUntil: string | null;
    confirmedAt: string | null;
    note: string | null;
    untaxed: Money;
    taxTotal: Money;
    total: Money;
    amountPaid: Money;
    client: DocumentClient;
    salesperson: PosUserRef | null;
}

export interface SaleOrderDetail extends SaleOrder {
    lines: DocumentLine[];
    invoices: {
        id: string;
        type: InvoiceType;
        status: InvoiceStatus;
        year: number | null;
        sequence: number | null;
        total: Money;
    }[];
}

export interface SaleOrderInput {
    clientId: string;
    validUntil: string | null;
    note: string | null;
    lines: DocumentLineInput[];
}

export const fetchSaleOrders = (params: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: SaleOrderStatus;
    clientId?: string;
    payable?: boolean;
}) =>
    posGet<Paginated<SaleOrder>>(
        withQuery('sale-orders/list', { ...params, payable: params.payable ? 'true' : undefined }),
        'Failed to fetch orders',
    );

export const fetchSaleOrder = (id: string) =>
    posGet<SaleOrderDetail>(`sale-orders/${id}`, 'Failed to fetch order');

export const createSaleOrder = (body: SaleOrderInput) =>
    posPost<SaleOrderDetail>('sale-orders', body, 'Failed to create quotation');

export const updateSaleOrder = (id: string, body: SaleOrderInput) =>
    posPost<SaleOrderDetail>(`sale-orders/${id}`, body, 'Failed to update quotation');

export const confirmSaleOrder = (id: string) =>
    posPost<SaleOrderDetail>(`sale-orders/${id}/confirm`, {}, 'Failed to confirm order');

export const cancelSaleOrder = (id: string) =>
    posPost<SaleOrderDetail>(`sale-orders/${id}/cancel`, {}, 'Failed to cancel order');

export const createInvoiceFromSaleOrder = (id: string) =>
    posPost<{ id: string }>(`sale-orders/${id}/invoice`, {}, 'Failed to create invoice');

export const deleteSaleOrder = (id: string) =>
    posDelete(`sale-orders/${id}`, 'Failed to delete order');

// Invoices

export type InvoiceType = 'INVOICE' | 'CREDIT_NOTE';
export type InvoiceStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type InvoicePaymentState = 'NOT_PAID' | 'PARTIAL' | 'PAID';
export type InvoicePaymentMethod = 'CASH' | 'BANK' | 'CLIENT_ACCOUNT';

export interface Invoice {
    id: string;
    type: InvoiceType;
    status: InvoiceStatus;
    year: number | null;
    sequence: number | null;
    displayNumber: string;
    invoiceDate: string;
    dueDate: string | null;
    note: string | null;
    untaxed: Money;
    taxTotal: Money;
    stampDuty: Money;
    total: Money;
    amountPaid: Money;
    amountDue: number;
    paymentState: InvoicePaymentState;
    client: DocumentClient;
}

export interface InvoicePayment {
    id: string;
    date: string;
    method: InvoicePaymentMethod;
    amount: Money;
    note: string | null;
    posOrderLineId: string | null;
    createdBy: PosUserRef | null;
}

export interface InvoiceDetail extends Invoice {
    lines: DocumentLine[];
    payments: InvoicePayment[];
    saleOrder: { id: string; number: number } | null;
    subscription: { id: string; number: number } | null;
    reversedInvoice: { id: string; type: InvoiceType; year: number | null; sequence: number | null } | null;
    creditNotes: {
        id: string;
        type: InvoiceType;
        status: InvoiceStatus;
        year: number | null;
        sequence: number | null;
        total: Money;
    }[];
}

export interface InvoiceInput {
    clientId: string;
    invoiceDate: string;
    dueDate: string | null;
    note: string | null;
    withStampDuty: boolean;
    lines: DocumentLineInput[];
}

export function formatInvoiceNumber(type: InvoiceType, year: number | null, sequence: number | null): string {
    if (year === null || sequence === null) return '/';
    return `${type === 'CREDIT_NOTE' ? 'AV' : 'FAC'}/${year}/${String(sequence).padStart(5, '0')}`;
}

export const fetchInvoices = (params: {
    page?: number;
    perPage?: number;
    search?: string;
    type?: InvoiceType;
    status?: InvoiceStatus;
    paymentState?: InvoicePaymentState;
    clientId?: string;
    payable?: boolean;
}) =>
    posGet<Paginated<Invoice>>(
        withQuery('invoices/list', { ...params, payable: params.payable ? 'true' : undefined }),
        'Failed to fetch invoices',
    );

export const fetchInvoice = (id: string) => posGet<InvoiceDetail>(`invoices/${id}`, 'Failed to fetch invoice');

export const createInvoice = (body: InvoiceInput) =>
    posPost<InvoiceDetail>('invoices', body, 'Failed to create invoice');

export const updateInvoice = (id: string, body: InvoiceInput) =>
    posPost<InvoiceDetail>(`invoices/${id}`, body, 'Failed to update invoice');

export const postInvoice = (id: string) =>
    posPost<InvoiceDetail>(`invoices/${id}/post`, {}, 'Failed to post invoice');

export const resetInvoiceToDraft = (id: string) =>
    posPost<InvoiceDetail>(`invoices/${id}/draft`, {}, 'Failed to reset invoice');

export const cancelInvoice = (id: string) =>
    posPost<InvoiceDetail>(`invoices/${id}/cancel`, {}, 'Failed to cancel invoice');

export const createCreditNote = (id: string) =>
    posPost<InvoiceDetail>(`invoices/${id}/credit-note`, {}, 'Failed to create credit note');

export const deleteInvoicePayment = (paymentId: string) =>
    posDelete(`invoices/payments/${paymentId}`, 'Failed to delete payment');

export const deleteInvoice = (id: string) => posDelete(`invoices/${id}`, 'Failed to delete invoice');

// Subscriptions (coworking)

export type SubscriptionUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export type SubscriptionStatus = 'DRAFT' | 'ACTIVE' | 'CANCELLED';
export type SubscriptionState = 'running' | 'expiring' | 'expired';
/** Status shown to users: active subscriptions are split by their period. */
export type SubscriptionDisplayStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED';

export type DiscountType = 'PERCENT' | 'AMOUNT';

export const SUBSCRIPTION_EXPIRING_DAYS = 7;

export interface Subscription {
    id: string;
    number: number;
    cardToken: string;
    status: SubscriptionStatus;
    productId: string | null;
    productName: string;
    duration: number;
    unit: SubscriptionUnit;
    startDate: string;
    endDate: string;
    unitPrice: Money;
    discountType: DiscountType;
    discountPct: Money;
    discountAmount: Money;
    subtotal: Money;
    total: Money;
    amountPaid: Money;
    note: string | null;
    activatedAt: string | null;
    client: DocumentClient;
}

export interface SubscriptionDetail extends Subscription {
    createdBy: PosUserRef | null;
    renewedFrom: { id: string; number: number } | null;
    renewal: { id: string; number: number } | null;
    invoices: {
        id: string;
        type: InvoiceType;
        status: InvoiceStatus;
        year: number | null;
        sequence: number | null;
        total: Money;
        amountPaid: Money;
    }[];
}

export interface SubscriptionInput {
    clientId: string;
    productId: string;
    startDate: string;
    unitPrice: number;
    discountType: DiscountType;
    discountPct: number;
    discountAmount: number;
    note: string | null;
}

export function formatSubscriptionNumber(value: number): string {
    return `ABN${String(value).padStart(5, '0')}`;
}

function addUtcDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

/** Mirrors the backend: last day (inclusive) of a period starting on `startDate` (YYYY-MM-DD). */
export function subscriptionEndDate(startDate: string, duration: number, unit: SubscriptionUnit): string {
    const start = new Date(`${startDate}T00:00:00Z`);
    if (Number.isNaN(start.getTime())) return '';
    if (unit === 'DAY' || unit === 'WEEK') {
        return toDateInput(addUtcDays(start, duration * (unit === 'WEEK' ? 7 : 1) - 1));
    }
    const months = unit === 'YEAR' ? duration * 12 : duration;
    const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
    return toDateInput(addUtcDays(target, -1));
}

export function subscriptionDisplayStatus(
    subscription: Pick<Subscription, 'status' | 'endDate'>,
): SubscriptionDisplayStatus {
    if (subscription.status !== 'ACTIVE') return subscription.status;
    const today = todayInput();
    const end = toDateInput(subscription.endDate);
    if (end < today) return 'EXPIRED';
    const limit = toDateInput(addUtcDays(new Date(`${today}T00:00:00Z`), SUBSCRIPTION_EXPIRING_DAYS));
    return end <= limit ? 'EXPIRING' : 'ACTIVE';
}

export const fetchSubscriptions = (params: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: SubscriptionStatus;
    state?: SubscriptionState;
    clientId?: string;
    payable?: boolean;
}) =>
    posGet<Paginated<Subscription>>(
        withQuery('subscriptions/list', { ...params, payable: params.payable ? 'true' : undefined }),
        'Failed to fetch subscriptions',
    );

export const fetchSubscription = (id: string) =>
    posGet<SubscriptionDetail>(`subscriptions/${id}`, 'Failed to fetch subscription');

export const createSubscription = (body: SubscriptionInput) =>
    posPost<SubscriptionDetail>('subscriptions', body, 'Failed to create subscription');

export const updateSubscription = (id: string, body: SubscriptionInput) =>
    posPost<SubscriptionDetail>(`subscriptions/${id}`, body, 'Failed to update subscription');

export const activateSubscription = (id: string) =>
    posPost<SubscriptionDetail>(`subscriptions/${id}/activate`, {}, 'Failed to activate subscription');

export const cancelSubscription = (id: string) =>
    posPost<SubscriptionDetail>(`subscriptions/${id}/cancel`, {}, 'Failed to cancel subscription');

export const renewSubscription = (id: string, startDate: string) =>
    posPost<SubscriptionDetail>(`subscriptions/${id}/renew`, { startDate }, 'Failed to renew subscription');

export const deleteSubscription = (id: string) =>
    posDelete(`subscriptions/${id}`, 'Failed to delete subscription');

export type SubscriptionCardState = 'DRAFT' | 'CANCELLED' | 'UPCOMING' | 'VALID' | 'EXPIRED';

export interface SubscriptionCard {
    number: number;
    status: SubscriptionStatus;
    state: SubscriptionCardState;
    productName: string;
    duration: number;
    unit: SubscriptionUnit;
    startDate: string;
    endDate: string;
    client: { firstName: string; lastName: string };
}

/** Absolute link encoded in the member card QR code: it returns the card as a PNG image. */
export function subscriptionCardUrl(cardToken: string): string {
    return `${window.location.origin}/api/public/subscription-cards/${cardToken}`;
}

// Company info printed on documents

export const COMPANY = {
    name: 'Biblio Squad',
    addressLine: 'Route mahdia km 5.5 sakiet eddaier',
    city: 'SFAX 3011',
    country: 'Tunisie',
    phone: '90606616',
    email: 'contact@bibliosquad.com',
    website: 'https://bibliosquad.com',
    taxId: null as string | null,
    logoUrl: '/company-logo.png',
    instagramUrl: 'https://www.instagram.com/squadbiblio/?hl=en' as string | null,
    facebookUrl: 'https://www.facebook.com/profile.php?id=61561194826952' as string | null,
    footerNote: null as string | null,
};

/** Must match `STAMP_DUTY` in the backend `pos.utils.ts`. */
export const STAMP_DUTY = 1;

// Reports

export interface SalesDetailsReport {
    from: string;
    to: string;
    session: { id: string; number: number } | null;
    ordersCount: number;
    products: { name: string; quantity: number; unitPrice: number; discountPct: number; total: number }[];
    payments: { method: PosPaymentMethod; total: number }[];
    taxes: { rate: number; base: number; tax: number }[];
    total: number;
}

export const fetchSalesDetails = (params: { from?: string; to?: string; sessionId?: string }) =>
    posGet<SalesDetailsReport>(withQuery('reports/sales-details', params), 'Failed to fetch report');
