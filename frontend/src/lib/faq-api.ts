import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export interface FaqCategoryRecord {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    sortOrder: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface FaqRecord {
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
    status: string;
    categoryId: string;
    category?: FaqCategoryRecord;
    createdAt: string;
    updatedAt: string;
}

export interface PublicFaqItem {
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
}

export interface PublicFaqCategory {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    sortOrder: number;
    faqs: PublicFaqItem[];
}

function unwrapData<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

export async function fetchPublicFaqCategories(): Promise<PublicFaqCategory[]> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.get('/api/faq/categories', headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch FAQ categories');
    }
    const data = unwrapData<PublicFaqCategory[]>(res.data as { data?: PublicFaqCategory[] } | PublicFaqCategory[]);
    return Array.isArray(data) ? data : [];
}

export async function fetchPublicFaqs(take?: number, categoryId?: string): Promise<FaqRecord[]> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const params = new URLSearchParams();
    if (take) params.set('take', String(take));
    if (categoryId) params.set('categoryId', categoryId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/api/faq/getAll${query}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch FAQs');
    }
    const data = unwrapData<FaqRecord[]>(res.data as { data?: FaqRecord[] } | FaqRecord[]);
    return Array.isArray(data) ? data : [];
}

export async function fetchFaqs(): Promise<FaqRecord[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/faqs', headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch FAQs');
    }
    const raw = res.data as { data?: FaqRecord[] } | FaqRecord[];
    if (Array.isArray(raw)) return raw;
    return Array.isArray(raw?.data) ? raw.data : [];
}

export async function fetchFaqCategories(): Promise<FaqCategoryRecord[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/faq-categories', headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch FAQ categories');
    }
    const raw = res.data as { data?: FaqCategoryRecord[] } | FaqCategoryRecord[];
    if (Array.isArray(raw)) return raw;
    return Array.isArray(raw?.data) ? raw.data : [];
}

export async function createFaq(body: {
    question: string;
    answer: string;
    categoryId: string;
    sortOrder?: number;
    status?: 'ACTIVE' | 'INACTIVE';
}): Promise<FaqRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/faqs', body, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to create FAQ');
    }
    return unwrapData<FaqRecord>(res.data as { data?: FaqRecord } | FaqRecord);
}

export async function updateFaq(
    id: string,
    body: {
        question?: string;
        answer?: string;
        categoryId?: string;
        sortOrder?: number;
        status?: 'ACTIVE' | 'INACTIVE';
    },
): Promise<FaqRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/faqs/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to update FAQ');
    }
    return unwrapData<FaqRecord>(res.data as { data?: FaqRecord } | FaqRecord);
}

export async function deleteFaq(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/faqs/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to delete FAQ');
    }
}

export async function createFaqCategory(body: {
    name: string;
    description?: string;
    sortOrder?: number;
    status?: 'ACTIVE' | 'INACTIVE';
}): Promise<FaqCategoryRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/faq-categories', body, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to create FAQ category');
    }
    return unwrapData<FaqCategoryRecord>(res.data as { data?: FaqCategoryRecord } | FaqCategoryRecord);
}

export async function updateFaqCategory(
    id: string,
    body: {
        name?: string;
        description?: string;
        sortOrder?: number;
        status?: 'ACTIVE' | 'INACTIVE';
    },
): Promise<FaqCategoryRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/faq-categories/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to update FAQ category');
    }
    return unwrapData<FaqCategoryRecord>(res.data as { data?: FaqCategoryRecord } | FaqCategoryRecord);
}

export async function deleteFaqCategory(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/faq-categories/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to delete FAQ category');
    }
}
