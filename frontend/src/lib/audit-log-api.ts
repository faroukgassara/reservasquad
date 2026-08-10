import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export interface AuditLogUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface AuditLogRecord {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    userId: string | null;
    user: AuditLogUser | null;
    summary: string | null;
    metadata: unknown;
    createdAt: string;
}

export interface PaginatedAuditLogs {
    data: AuditLogRecord[];
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

export async function fetchAuditLogs(params: {
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: string;
    entityType?: string;
    action?: string;
    userId?: string;
    from?: string;
    to?: string;
}): Promise<PaginatedAuditLogs> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    if (params.entityType) sp.set('entityType', params.entityType);
    if (params.action) sp.set('action', params.action);
    if (params.userId) sp.set('userId', params.userId);
    if (params.from) sp.set('from', params.from);
    if (params.to) sp.set('to', params.to);
    const q = sp.toString();

    const res = await api.get(`/api/audit-log${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch audit log');
    }
    return unwrapData<PaginatedAuditLogs>(res.data as { data?: PaginatedAuditLogs });
}
