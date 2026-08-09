import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export type CustomerType = 'INDIVIDUAL' | 'COMPANY';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
export type InvoiceStatus = 'DRAFT' | 'POSTED' | 'PAID' | 'CANCELLED';

export interface CustomerRecord {
    id: string;
    type: CustomerType;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    vatNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    status: CustomerStatus;
    createdAt: string;
    updatedAt: string;
}

export interface DocumentLineInput {
    label: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
}

export interface DocumentLineRecord extends DocumentLineInput {
    id: string;
    sortOrder: number;
    lineSubtotal: string;
    lineTax: string;
    lineTotal: string;
}

export interface QuoteRecord {
    id: string;
    number: string;
    status: QuoteStatus;
    customerId: string;
    customer?: CustomerRecord;
    validUntil: string | null;
    notes: string | null;
    subtotal: string;
    taxTotal: string;
    total: string;
    lines?: DocumentLineRecord[];
    invoice?: { id: string; number: string; status: InvoiceStatus } | null;
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceRecord {
    id: string;
    number: string;
    status: InvoiceStatus;
    customerId: string;
    customer?: CustomerRecord;
    quoteId: string | null;
    quote?: { id: string; number: string; status: QuoteStatus } | null;
    issueDate: string;
    dueDate: string | null;
    notes: string | null;
    subtotal: string;
    taxTotal: string;
    total: string;
    lines?: DocumentLineRecord[];
    createdAt: string;
    updatedAt: string;
}

export interface Paginated<T> {
    data: T[];
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

function unwrap<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) return (raw as { data: T }).data;
    return raw as T;
}

function getErrorMessage(data: unknown, fallback: string): string {
    const err = data as { message?: string; error?: string };
    return err?.message || err?.error || fallback;
}

// --- Customers ---

export async function fetchCustomers(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<Paginated<CustomerRecord>> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    const q = sp.toString();
    const res = await api.get(`/api/customers${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to fetch customers'));
    return unwrap<Paginated<CustomerRecord>>(res.data as { data?: Paginated<CustomerRecord> });
}

export async function fetchAllCustomers(): Promise<CustomerRecord[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/customers/all', headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to fetch customers'));
    return unwrap<CustomerRecord[]>(res.data as { data?: CustomerRecord[] });
}

export async function createCustomer(body: {
    type: CustomerType;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    vatNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}): Promise<CustomerRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/customers', body, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        throw new Error(getErrorMessage(res.data, 'Failed to create customer'));
    }
    return unwrap<CustomerRecord>(res.data as { data?: CustomerRecord });
}

export async function updateCustomer(
    id: string,
    body: Partial<{
        type: CustomerType;
        name: string;
        email: string;
        phone: string;
        company: string;
        vatNumber: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
        status: CustomerStatus;
    }>,
): Promise<CustomerRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.patch(`/api/customers/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to update customer'));
    return unwrap<CustomerRecord>(res.data as { data?: CustomerRecord });
}

export async function deleteCustomer(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/customers/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to delete customer'));
}

// --- Quotes ---

export async function fetchQuotes(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<Paginated<QuoteRecord>> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    const q = sp.toString();
    const res = await api.get(`/api/quotes${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to fetch quotes'));
    return unwrap<Paginated<QuoteRecord>>(res.data as { data?: Paginated<QuoteRecord> });
}

export async function fetchQuote(id: string): Promise<QuoteRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/quotes/${id}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to fetch quote'));
    return unwrap<QuoteRecord>(res.data as { data?: QuoteRecord });
}

export async function createQuote(body: {
    customerId: string;
    validUntil?: string;
    notes?: string;
    lines: DocumentLineInput[];
}): Promise<QuoteRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/quotes', body, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        throw new Error(getErrorMessage(res.data, 'Failed to create quote'));
    }
    return unwrap<QuoteRecord>(res.data as { data?: QuoteRecord });
}

export async function updateQuote(
    id: string,
    body: Partial<{
        customerId: string;
        status: QuoteStatus;
        validUntil: string;
        notes: string;
        lines: DocumentLineInput[];
    }>,
): Promise<QuoteRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.patch(`/api/quotes/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to update quote'));
    return unwrap<QuoteRecord>(res.data as { data?: QuoteRecord });
}

export async function convertQuoteToInvoice(id: string): Promise<InvoiceRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/quotes/${id}/convert`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        throw new Error(getErrorMessage(res.data, 'Failed to convert quote'));
    }
    return unwrap<InvoiceRecord>(res.data as { data?: InvoiceRecord });
}

export async function deleteQuote(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/quotes/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to delete quote'));
}

// --- Invoices ---

export async function fetchInvoices(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<Paginated<InvoiceRecord>> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    const q = sp.toString();
    const res = await api.get(`/api/invoices${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to fetch invoices'));
    return unwrap<Paginated<InvoiceRecord>>(res.data as { data?: Paginated<InvoiceRecord> });
}

export async function fetchInvoice(id: string): Promise<InvoiceRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/invoices/${id}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to fetch invoice'));
    return unwrap<InvoiceRecord>(res.data as { data?: InvoiceRecord });
}

export async function markInvoicePaid(id: string): Promise<InvoiceRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/invoices/${id}/mark-paid`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to mark invoice paid'));
    return unwrap<InvoiceRecord>(res.data as { data?: InvoiceRecord });
}

export async function deleteInvoice(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/invoices/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(getErrorMessage(res.data, 'Failed to delete invoice'));
}

export function formatMoney(value: string | number): string {
    const n = typeof value === 'string' ? Number.parseFloat(value) : value;
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(n || 0);
}

export function computeLinePreview(line: DocumentLineInput) {
    const quantity = Number(line.quantity) || 0;
    const unitPrice = Number(line.unitPrice) || 0;
    const taxRate = Number(line.taxRate) || 0;
    const lineSubtotal = Math.round(quantity * unitPrice * 100) / 100;
    const lineTax = Math.round(lineSubtotal * (taxRate / 100) * 100) / 100;
    const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;
    return { lineSubtotal, lineTax, lineTotal };
}

export function computeDocumentPreview(lines: DocumentLineInput[]) {
    const computed = lines.map(computeLinePreview);
    const subtotal = Math.round(computed.reduce((s, l) => s + l.lineSubtotal, 0) * 100) / 100;
    const taxTotal = Math.round(computed.reduce((s, l) => s + l.lineTax, 0) * 100) / 100;
    const total = Math.round((subtotal + taxTotal) * 100) / 100;
    return { subtotal, taxTotal, total };
}
