import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export type NotificationType = 'PROFESSOR_RESERVATION_CREATED';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string | null;
    data: {
        reservationId?: string;
        professorId?: string;
        professorName?: string;
        roomName?: string;
        startAt?: string;
        endAt?: string;
        price?: number;
    } | null;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationList {
    data: AppNotification[];
    meta: { total: number; page: number; perPage: number; unread: number };
}

export async function fetchNotifications(page = 1, perPage = 20): Promise<NotificationList> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams({ page: String(page), perPage: String(perPage) });
    const res = await api.get(`/api/notifications?${sp}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to load notifications');
    return (res.data as { data: NotificationList }).data;
}

export async function markNotificationRead(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/notifications/${id}/read`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to update notification');
}

export async function markAllNotificationsRead(): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/notifications/read-all', {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to update notifications');
}
