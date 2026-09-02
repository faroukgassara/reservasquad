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
    seriesId?: string | null;
    createdById: string | null;
    createdAt: string;
    updatedAt: string;
    room?: Pick<RoomRecord, 'id' | 'name' | 'capacity' | 'pricePerHour'>;
    professor?: Pick<ProfessorRecord, 'id' | 'firstName' | 'lastName' | 'specialPrice'> | null;
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

export interface DashboardRoomBreakdown {
    roomId: string;
    roomName: string;
    monthRevenue: number;
    totalRevenue: number;
}

export interface DashboardDailyTrendPoint {
    date: string;
    count: number;
    revenue: number;
}

export interface ReservationMonthlyTrendPoint {
    year: number;
    month: number;
    count: number;
    revenue: number;
    paidRevenue: number;
}

export interface DashboardStats {
    rooms: number;
    professors: number;
    todayReservations: number;
    month: {
        total: number;
        confirmed: number;
        cancelled: number;
        paid: number;
        unpaid: number;
        revenue: number;
        paidRevenue: number;
        unpaidRevenue: number;
    };
    topRooms: DashboardRoomBreakdown[];
    dailyTrend: DashboardDailyTrendPoint[];
    totalPaid: number;
    totalUnpaid: number;
    totalRevenue: number;
}

function unwrapData<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

export interface PaymentSummary {
    unpaidTotal: number;
    unpaidCount: number;
    paidTotal: number;
    paidCount: number;
}

export async function fetchUnpaidSummary(professorId?: string): Promise<PaymentSummary> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (professorId) sp.set('professorId', professorId);
    const q = sp.toString();
    const res = await api.get(`/api/reservations/unpaid-summary${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch unpaid summary');
    return unwrapData<PaymentSummary>(res.data as { data?: PaymentSummary });
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

export function calculateRoomReservationPrice(
    pricePerHour: number | string | undefined,
    startAt: string,
    endAt: string,
): number | null {
    if (pricePerHour === undefined || pricePerHour === null || pricePerHour === '') return null;
    if (!startAt || !endAt) return null;
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

export function calculateReservationPrice(
    room: { pricePerHour?: number | string | null } | null | undefined,
    professor: { specialPrice?: number | string | null } | null | undefined,
    startAt: string,
    endAt: string,
): number | null {
    if (professor?.specialPrice != null && professor.specialPrice !== '') {
        const flat =
            typeof professor.specialPrice === 'number'
                ? professor.specialPrice
                : Number(professor.specialPrice);
        if (!Number.isNaN(flat)) return flat;
    }
    return calculateRoomReservationPrice(room?.pricePerHour ?? undefined, startAt, endAt);
}

export type ReservationPriceMode = 'MANUAL' | 'ROOM' | 'PROFESSOR';

export function resolveReservationPriceFromMode(
    mode: ReservationPriceMode,
    params: {
        manualPrice: string;
        room?: { pricePerHour?: number | string | null } | null;
        professor?: { specialPrice?: number | string | null } | null;
        startAt: string;
        endAt: string;
    },
): number | null {
    if (mode === 'MANUAL') {
        const amount = Number(params.manualPrice);
        return Number.isNaN(amount) ? null : amount;
    }
    if (mode === 'PROFESSOR') {
        if (params.professor?.specialPrice == null || params.professor.specialPrice === '') {
            return null;
        }
        const flat =
            typeof params.professor.specialPrice === 'number'
                ? params.professor.specialPrice
                : Number(params.professor.specialPrice);
        return Number.isNaN(flat) ? null : flat;
    }
    return calculateRoomReservationPrice(
        params.room?.pricePerHour ?? undefined,
        params.startAt,
        params.endAt,
    );
}

export function inferReservationPriceMode(
    storedPrice: number | string,
    room: { pricePerHour?: number | string | null } | null | undefined,
    professor: { specialPrice?: number | string | null } | null | undefined,
    startAt: string,
    endAt: string,
): ReservationPriceMode {
    const amount = typeof storedPrice === 'number' ? storedPrice : Number(storedPrice);
    if (Number.isNaN(amount)) return 'MANUAL';

    if (professor?.specialPrice != null) {
        const special = Number(professor.specialPrice);
        if (!Number.isNaN(special) && Math.abs(amount - special) < 0.005) {
            return 'PROFESSOR';
        }
    }

    const roomPrice = calculateRoomReservationPrice(room?.pricePerHour ?? undefined, startAt, endAt);
    if (roomPrice != null && Math.abs(amount - roomPrice) < 0.005) {
        return 'ROOM';
    }

    return 'MANUAL';
}

export function resolveReservationFormPrice(
    values: {
        priceMode: ReservationPriceMode;
        price: string;
        roomId: string;
        professorId: string;
        startAt: string;
        endAt: string;
    },
    rooms: { id: string; pricePerHour?: number | string | null }[],
    professors: { id: string; specialPrice?: number | string | null }[],
): number | null {
    const room = rooms.find((item) => item.id === values.roomId);
    const professor = professors.find((item) => item.id === values.professorId);
    return resolveReservationPriceFromMode(values.priceMode, {
        manualPrice: values.price,
        room,
        professor,
        startAt: values.startAt,
        endAt: values.endAt,
    });
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
    from?: string;
    to?: string;
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

export async function fetchReservationTrend(params: {
    months?: number;
}): Promise<ReservationMonthlyTrendPoint[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.months) sp.set('months', String(params.months));
    const q = sp.toString();
    const path = q ? `/api/reservations/trend?${q}` : '/api/reservations/trend';
    const res = await api.get(path, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch reservation trend');
    return unwrapData<ReservationMonthlyTrendPoint[]>(
        res.data as { data?: ReservationMonthlyTrendPoint[] },
    );
}

export interface TodayProfessor {
    id: string;
    firstName: string;
    lastName: string;
}

export interface TodayRoomCurrent {
    reservationId: string;
    title: string | null;
    professor: TodayProfessor | null;
    startAt: string;
    endAt: string;
    isPaid: boolean;
}

export interface TodayRoomBusy {
    reservationId: string;
    title: string | null;
    professor: TodayProfessor | null;
    startAt: string;
    endAt: string;
}

export interface TodayRoomRow {
    roomId: string;
    roomName: string;
    capacity: number;
    status: 'OCCUPIED' | 'FREE';
    current: TodayRoomCurrent | null;
    nextFreeAt: string | null;
    freeUntil: string | null;
    nextBusy: TodayRoomBusy | null;
}

export interface TodayFreeSlot {
    roomId: string;
    roomName: string;
    availableAt: string;
    freeUntil: string | null;
}

export interface TodayUnpaidReservation {
    id: string;
    title: string | null;
    room: { id: string; name: string };
    professor: TodayProfessor | null;
    startAt: string;
    endAt: string;
    price: number;
    isPaid: boolean;
    timing: 'ONGOING' | 'STARTING' | 'LATER' | 'ENDED';
}

export interface TodaySnapshot {
    asOf: string;
    day: { start: string; end: string };
    counts: {
        roomsOccupied: number;
        roomsFree: number;
        confirmedToday: number;
        unpaidToday: number;
    };
    rooms: TodayRoomRow[];
    nextFreeSlots: TodayFreeSlot[];
    unpaidToday: TodayUnpaidReservation[];
}

export async function fetchTodaySnapshot(): Promise<TodaySnapshot> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/reservations/today', headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch today snapshot');
    return unwrapData<TodaySnapshot>(res.data as { data?: TodaySnapshot });
}

export interface AvailabilityRoom {
    id: string;
    name: string;
    capacity: number;
    pricePerHour: number;
    estimatedPrice: number;
}

export interface AvailabilityData {
    startAt: string;
    endAt: string;
    rooms: AvailabilityRoom[];
    preferredRoomId?: string | null;
    preferredAvailable?: boolean | null;
    alternatives?: AvailabilityRoom[];
}

export async function fetchAvailability(params: {
    startAt: string;
    endAt: string;
    excludeReservationId?: string;
    preferredRoomId?: string;
}): Promise<AvailabilityData> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    sp.set('startAt', params.startAt);
    sp.set('endAt', params.endAt);
    if (params.excludeReservationId) {
        sp.set('excludeReservationId', params.excludeReservationId);
    }
    if (params.preferredRoomId) {
        sp.set('preferredRoomId', params.preferredRoomId);
    }
    const res = await api.get(`/api/reservations/availability?${sp.toString()}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { error?: string; message?: string })?.error ||
            (res.data as { message?: string })?.message ||
            'Failed to fetch availability';
        throw new Error(message);
    }
    return unwrapData<AvailabilityData>(res.data as { data?: AvailabilityData });
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

export async function fetchDeletedReservations(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<PaginatedReservations> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
    const q = sp.toString();
    const res = await api.get(`/api/reservations/deleted${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch deleted reservations');
    return unwrapData<PaginatedReservations>(res.data as { data?: PaginatedReservations });
}

export async function restoreReservation(id: string): Promise<ReservationRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/reservations/${id}/restore`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { error?: string; message?: string })?.message ||
            (res.data as { error?: string })?.error ||
            'Failed to restore reservation';
        throw new Error(message);
    }
    return unwrapData<ReservationRecord>(res.data as { data?: ReservationRecord });
}

export async function hardDeleteReservation(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/reservations/${id}/hard`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to permanently delete reservation');
    }
}

export async function bulkMarkReservationsPaid(ids: string[]): Promise<{ updated: number }> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/reservations/bulk-paid', { ids }, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { error?: string; message?: string })?.error ||
            (res.data as { message?: string })?.message ||
            'Failed to mark reservations as paid';
        throw new Error(message);
    }
    return unwrapData<{ updated: number }>(res.data as { data?: { updated: number } });
}

export async function createReservationSeries(body: {
    title?: string;
    roomId: string;
    professorId?: string;
    startAt: string;
    endAt: string;
    frequency: 'WEEKLY' | 'MONTHLY';
    until: string;
    price?: number;
    status?: ReservationStatus;
    isPaid?: boolean;
    notes?: string;
}): Promise<{ seriesId: string; count: number; data: ReservationRecord[] }> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/reservations/series', body, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { error?: string; message?: string })?.error ||
            (res.data as { message?: string })?.message ||
            'Failed to create reservation series';
        throw new Error(message);
    }
    return unwrapData<{ seriesId: string; count: number; data: ReservationRecord[] }>(
        res.data as { data?: { seriesId: string; count: number; data: ReservationRecord[] } },
    );
}

export async function deleteFutureInSeries(
    id: string,
): Promise<{ deleted: number; seriesId: string }> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/reservations/${id}/delete-series-future`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { error?: string; message?: string })?.error ||
            (res.data as { message?: string })?.message ||
            'Failed to delete series occurrences';
        throw new Error(message);
    }
    return unwrapData<{ deleted: number; seriesId: string }>(
        res.data as { data?: { deleted: number; seriesId: string } },
    );
}
