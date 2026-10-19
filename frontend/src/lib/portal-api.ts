import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export interface PortalReservation {
    id: string;
    title: string | null;
    startAt: string;
    endAt: string;
    price: number;
    isPaid: boolean;
    paidAt: string | null;
    status: 'CONFIRMED' | 'CANCELLED';
    room: { id: string; name: string };
}

export interface PortalMe {
    profile: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        specialty: string | null;
    };
    balance: {
        unpaidTotal: number;
        unpaidCount: number;
        paidTotal: number;
        paidCount: number;
    };
    upcoming: PortalReservation[];
}

export interface PortalScheduleRoom {
    id: string;
    name: string;
    capacity: number;
    pricePerHour: number;
    imageUrl: string | null;
    /** Other professors' bookings are anonymous; the professor's own ones carry their details. */
    busy: {
        startAt: string;
        endAt: string;
        mine: boolean;
        id?: string;
        title?: string | null;
        price?: number;
        isPaid?: boolean;
    }[];
}

export interface PortalSchedule {
    from: string;
    to: string;
    rooms: PortalScheduleRoom[];
}

export interface PortalAvailableRoom {
    id: string;
    name: string;
    capacity: number;
    pricePerHour: number;
    estimatedPrice: number;
}

export interface PortalAvailability {
    startAt: string;
    endAt: string;
    rooms: PortalAvailableRoom[];
}

export type PortalReservationScope = 'upcoming' | 'past' | 'all';

export interface PaginatedPortalReservations {
    data: PortalReservation[];
    meta: { total: number; page: number; perPage: number };
}

export class PortalApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
    }
}

function errorMessage(raw: unknown, fallback: string): string {
    const body = raw as { message?: string; error?: string } | undefined;
    return body?.message || body?.error || fallback;
}

function unwrap<T>(raw: unknown): T {
    return (raw as { data: T }).data;
}

export async function fetchPortalMe(): Promise<PortalMe> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/portal/me', headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(errorMessage(res.data, 'Failed to load profile'));
    return unwrap<PortalMe>(res.data);
}

export async function fetchPortalSchedule(from: string, to: string): Promise<PortalSchedule> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams({ from, to });
    const res = await api.get(`/api/portal/schedule?${sp}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(errorMessage(res.data, 'Failed to load schedule'));
    return unwrap<PortalSchedule>(res.data);
}

export async function fetchPortalAvailability(startAt: string, endAt: string): Promise<PortalAvailability> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams({ startAt, endAt });
    const res = await api.get(`/api/portal/availability?${sp}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(errorMessage(res.data, 'Failed to load availability'));
    return unwrap<PortalAvailability>(res.data);
}

export async function fetchPortalReservations(params: {
    scope: PortalReservationScope;
    page: number;
    perPage?: number;
}): Promise<PaginatedPortalReservations> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams({
        scope: params.scope,
        page: String(params.page),
        perPage: String(params.perPage ?? 10),
    });
    const res = await api.get(`/api/portal/reservations?${sp}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error(errorMessage(res.data, 'Failed to load bookings'));
    return unwrap<PaginatedPortalReservations>(res.data);
}

export async function bookPortalReservation(body: {
    roomId: string;
    startAt: string;
    endAt: string;
    title?: string;
    notes?: string;
}): Promise<PortalReservation> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/portal/reservations', body, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        throw new PortalApiError(errorMessage(res.data, 'Booking failed'), res.status);
    }
    return unwrap<PortalReservation>(res.data);
}

/** `YYYY-MM-DD` + `HH:mm` in the browser's time zone → ISO string. */
export function toIsoDateTime(date: string, time: string): string {
    return new Date(`${date}T${time}:00`).toISOString();
}

export function toDateInput(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatPortalDate(iso: string, locale: string): string {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
}

export function formatPortalTimeRange(startIso: string, endIso: string, locale: string): string {
    const format = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${format.format(new Date(startIso))} – ${format.format(new Date(endIso))}`;
}
