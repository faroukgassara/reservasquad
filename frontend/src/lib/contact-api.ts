import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export interface ContactMessageRow {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string;
}

export interface PaginatedContactMessages {
    data: ContactMessageRow[];
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

export async function submitContactMessage(body: {
    name: string;
    email: string;
    message: string;
}): Promise<ContactMessageRow> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.post('/api/contact/message', body, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string; errors?: unknown };
        throw new Error(err?.message || 'Failed to send message');
    }
    const raw = res.data as { data?: ContactMessageRow } | ContactMessageRow;
    const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: ContactMessageRow }).data : raw;
    return data as ContactMessageRow;
}

export async function fetchContactMessages(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<PaginatedContactMessages> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    const q = sp.toString();

    const res = await api.get(`/api/contact-messages${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch contact messages');
    }
    const payload = res.data as { data?: PaginatedContactMessages } | PaginatedContactMessages;
    return (
        payload && typeof payload === 'object' && 'data' in payload
            ? (payload as { data: PaginatedContactMessages }).data
            : payload
    ) as PaginatedContactMessages;
}

export async function deleteContactMessage(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/contact-messages/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to delete');
    }
}
