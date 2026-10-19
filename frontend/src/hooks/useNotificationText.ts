'use client';

import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { AppNotification } from '@/lib/notification-api';
import { formatPortalDate, formatPortalTimeRange } from '@/lib/portal-api';

/** Localised title/body for a stored notification (falls back to the server-side French text). */
export function useNotificationText() {
    const t = useTranslations('notifications');
    const locale = useLocale();

    return useCallback(
        (notification: AppNotification): { title: string; body: string } => {
            const data = notification.data;
            if (notification.type === 'PROFESSOR_RESERVATION_CREATED' && data?.startAt && data.endAt) {
                return {
                    title: t('professorBookedTitle', { professor: data.professorName ?? '' }),
                    body: t('professorBookedBody', {
                        room: data.roomName ?? '',
                        date: formatPortalDate(data.startAt, locale),
                        time: formatPortalTimeRange(data.startAt, data.endAt, locale),
                    }),
                };
            }
            return { title: notification.title, body: notification.body ?? '' };
        },
        [t, locale],
    );
}
