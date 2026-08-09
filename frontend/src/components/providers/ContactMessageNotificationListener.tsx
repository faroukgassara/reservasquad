'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { io, type Socket } from 'socket.io-client';
import { useToast } from '@/contexts/ToastContext';
import { EToastType } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';
import { getSocketUrl, SOCKET_EVENTS } from '@/lib/socket-events';
import type { ContactMessageRow } from '@/lib/contact-api';

export default function ContactMessageNotificationListener() {
    const t = useTranslations('admin.contactMessages');
    const { data: session } = useSession();
    const router = useRouter();
    const { openToast } = useToast();
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);

    const isAdmin = session?.user?.role === 'ADMIN';
    const accessToken = session?.accessToken;

    useEffect(() => {
        if (!isAdmin || !accessToken) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            return;
        }

        const socketUrl = getSocketUrl();
        if (!socketUrl) {
            return;
        }

        const socket = io(socketUrl, {
            auth: { token: accessToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on(SOCKET_EVENTS.CONTACT_MESSAGE_NEW, (message: ContactMessageRow) => {
            openToast(
                t('newNotification'),
                message.name,
                {
                    type: EToastType.INFO,
                    onClickToast: () => router.push(Routes.ContactMessages.index),
                },
            );
            queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
        });

        return () => {
            socket.disconnect();
            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        };
    }, [isAdmin, accessToken, openToast, queryClient, router, t]);

    return null;
}
