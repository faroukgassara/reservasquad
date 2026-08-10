import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';
import type { RoomRecord } from './room-api';
import type { ProfessorRecord } from './professor-api';

const api = new Api();

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

export interface ReservationRecord {
    id: string;
    title: string | null;
    roomId: string;
    professorId: string | null;
    startAt: string;
    endAt: string;
    price: number | string;
    isPaid: boolean;
    status: ReservationStatus;
    notes: string | null;
    createdById: string | null;
    createdAt: string;
    updatedAt: string;
    room?: Pick<RoomRecord, 'id' | 'name' | 'capacity' | 'pricePerHour'>;
    professor?: Pick<ProfessorRecord, 'id' | 'firstName' | 'lastName'> | null;
}

export interface PaginatedReservations {
    data: ReservationRecord[];
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

export interface DashboardStats {
    rooms: number;
    professors: number;
    todayReservations: number;
}

function unwrapData<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

export function formatMoney(value: number | string): string {
    const amount = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(amount)) return String(value);
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2,
    }).format(amount);
}

export function calculateReservationPrice(
    pricePerHour: number | string | undefined,
    startAt: string,
    endAt: string,
): number | null {
    if (!pricePerHour || !startAt || !endAt) return null;
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return null;
    }
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const rate = typeof pricePerHour === 'number' ? pricePerHour : Number(pricePerHour);
    if (Number.isNaN(rate)) return null;
    return Math.round(hours * rate * 100) / 100;
}

export async function fetchReservations(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: ReservationStatus;
    roomId?: string;
    professorId?: string;
    isPaid?: boolean;
}): Promise<PaginatedReservations> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') sp.set(key, String(value));
    });
    const q = sp.toString();
    const res = await api.get(`/api/reservations${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch reservations');
    return unwrapData<PaginatedReservations>(res.data as { data?: PaginatedReservations });
}

export async function fetchCalendar(params: {
    from: string;
    to: string;
    roomId?: string;
}): Promise<ReservationRecord[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    sp.set('from', params.from);
    sp.set('to', params.to);
    if (params.roomId) sp.set('roomId', params.roomId);
    const res = await api.get(`/api/reservations/calendar?${sp.toString()}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch calendar');
    return unwrapData<ReservationRecord[]>(res.data as { data?: ReservationRecord[] });
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/reservations/stats', headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch stats');
    return unwrapData<DashboardStats>(res.data as { data?: DashboardStats });
}

export async function createReservation(body: {
    title?: string;
    roomId: string;
    professorId?: string;
    startAt: string;
    endAt: string;
    price?: number;
    status?: ReservationStatus;
    isPaid?: boolean;
    notes?: string;
}): Promise<ReservationRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/reservations', body, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { error?: string; message?: string })?.error ||
            (res.data as { message?: string })?.message ||
            'Failed to create reservation';
        throw new Error(message);
    }
    return unwrapData<ReservationRecord>(res.data as { data?: ReservationRecord });
}

export async function updateReservation(
    id: string,
    body: Partial<{
        title: string;
        roomId: string;
        professorId: string | null;
        startAt: string;
        endAt: string;
        price: number;
        status: ReservationStatus;
        isPaid: boolean;
        notes: string;
    }>,
): Promise<ReservationRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/reservations/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { error?: string; message?: string })?.error ||
            (res.data as { message?: string })?.message ||
            'Failed to update reservation';
        throw new Error(message);
    }
    return unwrapData<ReservationRecord>(res.data as { data?: ReservationRecord });
}

export async function cancelReservation(id: string): Promise<ReservationRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/reservations/${id}/cancel`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to cancel reservation');
    return unwrapData<ReservationRecord>(res.data as { data?: ReservationRecord });
}

export async function deleteReservation(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/reservations/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to delete reservation');
}
