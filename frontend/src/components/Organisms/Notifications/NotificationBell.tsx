'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useNotificationText } from '@/hooks/useNotificationText';
import {
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    type AppNotification,
} from '@/lib/notification-api';

const STAFF_ROLES = new Set(['ADMIN', 'USER']);

function formatWhen(iso: string, locale: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

export default function NotificationBell() {
    const t = useTranslations('notifications');
    const locale = useLocale();
    const { data: session } = useSession();
    const isStaff = STAFF_ROLES.has(session?.user?.role ?? '');
    const queryClient = useQueryClient();
    const toText = useNotificationText();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => fetchNotifications(1, 15),
        enabled: isStaff,
        refetchInterval: 5 * 60 * 1000,
    });

    const refresh = () => void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    const readOne = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh });
    const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh });

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    if (!isStaff) return null;

    const unread = data?.meta.unread ?? 0;
    const items = data?.data ?? [];

    const renderItem = (notification: AppNotification) => {
        const { title, body } = toText(notification);
        const isUnread = !notification.readAt;
        return (
            <li key={notification.id}>
                <button
                    type="button"
                    onClick={() => isUnread && readOne.mutate(notification.id)}
                    className={twMerge(
                        'flex w-full cursor-default items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50',
                        isUnread && 'cursor-pointer bg-primary-25',
                    )}
                >
                    <span
                        className={twMerge('mt-1.5 size-2 shrink-0 rounded-full', isUnread ? 'bg-primary-500' : 'bg-transparent')}
                    />
                    <Div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold">
                            {title}
                        </Label>
                        {body ? (
                            <Label variant={EVariantLabel.caption} color="text-gray-600">
                                {body}
                            </Label>
                        ) : null}
                        <Label variant={EVariantLabel.caption} color="text-gray-400">
                            {formatWhen(notification.createdAt, locale)}
                        </Label>
                    </Div>
                </button>
            </li>
        );
    };

    return (
        <div ref={containerRef} className="relative shrink-0">
            <button
                type="button"
                id="notification-bell"
                aria-label={unread > 0 ? t('bellUnread', { count: unread }) : t('bell')}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="relative flex size-11 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:bg-gray-50 sm:size-10"
            >
                <Icon name={IconComponentsEnum.bell} size={ESize.sm} color="text-gray-700" />
                {unread > 0 ? (
                    <span className="absolute -end-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-accent-500 px-1">
                        <Label variant={EVariantLabel.caption} color="text-white" className="font-semibold tabular-nums">
                            {unread > 99 ? '99+' : unread}
                        </Label>
                    </span>
                ) : null}
            </button>

            {open ? (
                <div
                    role="dialog"
                    aria-label={t('title')}
                    className="absolute end-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                >
                    <Div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                        <Label variant={EVariantLabel.h6} color="text-gray-900">
                            {t('title')}
                        </Label>
                        {unread > 0 ? (
                            <button
                                type="button"
                                onClick={() => readAll.mutate()}
                                className="min-h-11 cursor-pointer rounded-md px-2 transition-colors hover:bg-gray-50 sm:min-h-0 sm:py-1"
                            >
                                <Label variant={EVariantLabel.caption} color="text-primary-600" className="font-semibold">
                                    {t('markAllRead')}
                                </Label>
                            </button>
                        ) : null}
                    </Div>
                    <Div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <Div className="flex justify-center py-8">
                                <Spinner color="text-primary-500" size={ESize.md} />
                            </Div>
                        ) : items.length === 0 ? (
                            <Div className="px-4 py-8 text-center">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                    {t('empty')}
                                </Label>
                            </Div>
                        ) : (
                            <ul className="divide-y divide-gray-100">{items.map(renderItem)}</ul>
                        )}
                    </Div>
                </div>
            ) : null}
        </div>
    );
}
