'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useToast } from '@/contexts/ToastContext';
import { EToastType } from '@/Enum/Enum';
import { useNotificationText } from '@/hooks/useNotificationText';
import type { AppNotification } from '@/lib/notification-api';

const STAFF_ROLES = new Set(['ADMIN', 'USER']);
const RESERVATION_QUERY_KEYS = ['reservations', 'calendar', 'today-snapshot', 'unpaid-summary', 'professor-reservations'];

function socketOrigin(): string | null {
    const raw = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!raw) return null;
    try {
        // A path in the URL would be read as a Socket.IO namespace, so only the origin is kept.
        return new URL(raw).origin;
    } catch {
        return null;
    }
}

/** Keeps a Socket.IO connection open for staff and surfaces new notifications as toasts. Renders nothing. */
export default function NotificationListener() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const toText = useNotificationText();

    const accessToken = (session as { accessToken?: string } | null)?.accessToken;
    const isStaff = STAFF_ROLES.has(session?.user?.role ?? '');

    useEffect(() => {
        const origin = socketOrigin();
        if (!accessToken || !isStaff || !origin) return;

        const socket: Socket = io(origin, {
            auth: { token: accessToken },
            transports: ['websocket', 'polling'],
        });

        socket.on('notification:new', (notification: AppNotification) => {
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            for (const key of RESERVATION_QUERY_KEYS) {
                void queryClient.invalidateQueries({ queryKey: [key] });
            }
            const { title, body } = toText(notification);
            openToast(title, body, { type: EToastType.INFO });
        });

        return () => {
            socket.disconnect();
        };
    }, [accessToken, isStaff, openToast, queryClient, toText]);

    return null;
}
