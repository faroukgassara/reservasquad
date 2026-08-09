import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export type TestimonialStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TestimonialRecord {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    title: string;
    description: string;
    rating: number;
    status: TestimonialStatus;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedTestimonials {
    data: TestimonialRecord[];
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

export async function submitTestimonial(body: {
    firstName: string;
    lastName: string;
    email: string;
    title: string;
    description: string;
    rating: number;
}): Promise<{ id: string; createdAt: string }> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.post('/api/testimonial', body, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string; errors?: unknown };
        throw new Error(err?.message || 'Failed to submit testimonial');
    }
    const raw = res.data as { data?: { id: string; createdAt: string } };
    return raw.data ?? (raw as unknown as { id: string; createdAt: string });
}

export async function fetchPublicTestimonials(take = 12): Promise<TestimonialRecord[]> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.get(`/api/testimonial/list?take=${take}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch testimonials');
    }
    const raw = res.data as { data?: TestimonialRecord[] } | TestimonialRecord[];
    if (Array.isArray(raw)) return raw;
    return Array.isArray(raw?.data) ? raw.data! : [];
}

export async function fetchTestimonials(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: TestimonialStatus;
}): Promise<PaginatedTestimonials> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    if (params.status) sp.set('status', params.status);
    const q = sp.toString();

    const res = await api.get(`/api/testimonials${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch testimonials');
    }
    const payload = res.data as { data?: PaginatedTestimonials } | PaginatedTestimonials;
    return (
        payload && typeof payload === 'object' && 'data' in payload
            ? (payload as { data: PaginatedTestimonials }).data
            : payload
    ) as PaginatedTestimonials;
}

export async function updateTestimonialStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
): Promise<TestimonialRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.patch(`/api/testimonials/${id}/status`, { status }, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to update status');
    }
    const raw = res.data as { data?: TestimonialRecord } | TestimonialRecord;
    const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: TestimonialRecord }).data : raw;
    return data as TestimonialRecord;
}

export async function deleteTestimonial(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/testimonials/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to delete testimonial');
    }
}
