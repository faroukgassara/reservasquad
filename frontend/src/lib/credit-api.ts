import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export interface CreditTotals {
    totalCredit: number;
    totalPaid: number;
    remaining: number;
}

export interface CreditClientRecord {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email?: string | null;
    address?: string | null;
    taxId?: string | null;
    cin?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreditClientListItem extends CreditClientRecord, CreditTotals {
    creditCount: number;
}

export interface CreditPaymentRecord {
    id: string;
    creditId: string;
    date: string;
    amount: number | string;
    note: string | null;
    createdAt: string;
}

export interface CreditRecord extends CreditTotals {
    id: string;
    clientId: string;
    date: string;
    amount: number | string;
    description: string | null;
    payments: CreditPaymentRecord[];
    createdAt: string;
}

export interface CreditClientDetail extends CreditClientRecord, CreditTotals {
    credits: CreditRecord[];
}

export interface CreditSummary extends CreditTotals {
    clientsWithBalance: number;
}

export interface PaginatedCreditClients {
    data: CreditClientListItem[];
    meta: {
        total: number;
        currentPage: number;
        perPage: number;
        lastPage: number;
        prev: number | null;
        next: number | null;
        hasMore: boolean;
    };
}

export const CREDIT_ERROR_PAYMENT_EXCEEDS = 'Payment exceeds the remaining amount';
export const CREDIT_ERROR_REGISTER_PAYMENT = 'Register payments must be refunded from the register';

export function todayDateInputValue(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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

export async function fetchCreditSummary(): Promise<CreditSummary> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/credits/summary', headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Failed to fetch credit summary');
    return unwrapData<CreditSummary>(res.data as { data?: CreditSummary });
}

export async function fetchCreditClients(params: {
    page?: number;
    perPage?: number;
    search?: string;
}): Promise<PaginatedCreditClients> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    const q = sp.toString();
    const res = await api.get(`/api/credits/clients${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Failed to fetch credit clients');
    return unwrapData<PaginatedCreditClients>(res.data as { data?: PaginatedCreditClients });
}

export async function fetchCreditClient(id: string): Promise<CreditClientDetail> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/credits/clients/${id}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Failed to fetch credit client');
    return unwrapData<CreditClientDetail>(res.data as { data?: CreditClientDetail });
}

export interface CreditClientInput {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    address?: string;
    taxId?: string;
    cin?: string;
}

export async function createCreditClient(body: CreditClientInput): Promise<CreditClientRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/credits/clients', body, headers);
    if (!isSuccess(res.status)) throw errorFrom(res.data, 'Failed to create client');
    return unwrapData<CreditClientRecord>(res.data as { data?: CreditClientRecord });
}

export async function updateCreditClient(
    id: string,
    body: CreditClientInput,
): Promise<CreditClientRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/credits/clients/${id}`, body, headers);
    if (!isSuccess(res.status)) throw errorFrom(res.data, 'Failed to update client');
    return unwrapData<CreditClientRecord>(res.data as { data?: CreditClientRecord });
}

export async function deleteCreditClient(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/credits/clients/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Failed to delete client');
}

export async function createCredit(body: {
    clientId: string;
    date: string;
    productId: string;
    quantity: number;
    description?: string;
}): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/credits/items', body, headers);
    if (!isSuccess(res.status)) throw errorFrom(res.data, 'Failed to create credit');
}

export async function deleteCredit(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/credits/items/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Failed to delete credit');
}

export async function addCreditPayment(
    creditId: string,
    body: { date: string; amount: number; note?: string },
): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/credits/items/${creditId}/payments`, body, headers);
    if (!isSuccess(res.status)) throw errorFrom(res.data, 'Failed to record payment');
}

export async function deleteCreditPayment(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/credits/payments/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Failed to delete payment');
}
