import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export interface RoomRecord {
    id: string;
    name: string;
    capacity: number;
    pricePerHour: number | string;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedRooms {
    data: RoomRecord[];
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

export async function fetchRooms(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<PaginatedRooms> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    const q = sp.toString();
    const res = await api.get(`/api/rooms${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch rooms');
    return unwrapData<PaginatedRooms>(res.data as { data?: PaginatedRooms });
}

export async function createRoom(body: {
    name: string;
    capacity: number;
    pricePerHour: number;
    imageUrl?: string;
}): Promise<RoomRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/rooms', body, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to create room');
    }
    return unwrapData<RoomRecord>(res.data as { data?: RoomRecord });
}

export async function updateRoom(
    id: string,
    body: Partial<{
        name: string;
        capacity: number;
        pricePerHour: number;
        imageUrl: string;
    }>,
): Promise<RoomRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/rooms/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to update room');
    return unwrapData<RoomRecord>(res.data as { data?: RoomRecord });
}

export async function deleteRoom(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/rooms/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to delete room');
}
