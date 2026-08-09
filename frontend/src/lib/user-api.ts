import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserRecord {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    status: UserStatus;
    role: UserRole;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedUsers {
    data: UserRecord[];
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

export async function fetchUsers(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: UserStatus;
    role?: UserRole;
}): Promise<PaginatedUsers> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    if (params.status) sp.set('status', params.status);
    if (params.role) sp.set('role', params.role);
    const q = sp.toString();

    const res = await api.get(`/api/users${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch users');
    }
    return unwrapData<PaginatedUsers>(res.data as { data?: PaginatedUsers });
}

export async function createUser(body: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    status?: UserStatus;
}): Promise<UserRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/users', body, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string; error?: string };
        throw new Error(err?.message || err?.error || 'Failed to create user');
    }
    return unwrapData<UserRecord>(res.data as { data?: UserRecord });
}

export async function updateUser(
    id: string,
    body: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        role?: UserRole;
        status?: UserStatus;
        password?: string;
    },
): Promise<UserRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.patch(`/api/users/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string; error?: string };
        throw new Error(err?.message || err?.error || 'Failed to update user');
    }
    return unwrapData<UserRecord>(res.data as { data?: UserRecord });
}

export async function deleteUser(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/users/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string; error?: string };
        throw new Error(err?.message || err?.error || 'Failed to delete user');
    }
}
