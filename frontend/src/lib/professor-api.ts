import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export interface ProfessorRecord {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    specialty: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedProfessors {
    data: ProfessorRecord[];
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

function unwrapData<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

export async function fetchProfessors(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<PaginatedProfessors> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    const q = sp.toString();
    const res = await api.get(`/api/professors${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch professors');
    return unwrapData<PaginatedProfessors>(res.data as { data?: PaginatedProfessors });
}

export async function fetchProfessorById(id: string): Promise<ProfessorRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/professors/${id}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch professor');
    return unwrapData<ProfessorRecord>(res.data as { data?: ProfessorRecord });
}

export async function createProfessor(body: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    specialty?: string;
}): Promise<ProfessorRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/professors', body, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to create professor');
    }
    return unwrapData<ProfessorRecord>(res.data as { data?: ProfessorRecord });
}

export async function updateProfessor(
    id: string,
    body: Partial<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        specialty: string;
    }>,
): Promise<ProfessorRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/professors/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to update professor');
    return unwrapData<ProfessorRecord>(res.data as { data?: ProfessorRecord });
}

export async function deleteProfessor(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/professors/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to delete professor');
}

export async function fetchDeletedProfessors(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<PaginatedProfessors> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    const q = sp.toString();
    const res = await api.get(`/api/professors/deleted${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch deleted professors');
    return unwrapData<PaginatedProfessors>(res.data as { data?: PaginatedProfessors });
}

export async function restoreProfessor(id: string): Promise<ProfessorRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/professors/${id}/restore`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { error?: string; message?: string })?.message ||
            (res.data as { error?: string })?.error ||
            'Failed to restore professor';
        throw new Error(message);
    }
    return unwrapData<ProfessorRecord>(res.data as { data?: ProfessorRecord });
}

export async function hardDeleteProfessor(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/professors/${id}/hard`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to permanently delete professor');
}
