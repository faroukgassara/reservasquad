'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import ReservationReport from '@/components/Organisms/Reports/ReservationReport';
import { useAuthorization } from '@/hooks/useAuthorization';
import { fetchDashboardStats, fetchReservationTrend } from '@/lib/reservation-api';
import { Routes } from '@/lib/routes';

export default function ReservationReportsPage() {
    const t = useTranslations('reports');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Today);
    }, [isAdmin, router]);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: fetchDashboardStats,
        enabled: isAdmin,
    });

    const { data: trend } = useQuery({
        queryKey: ['reservation-trend', 6],
        queryFn: () => fetchReservationTrend({ months: 6 }),
        enabled: isAdmin,
    });

    if (!isAdmin) return null;

    return (
        <LayoutWrapper
            title={t('reservationsTitle')}
            subTitle={t('reservationsSubtitle')}
            mainSection={<ReservationReport stats={stats} trend={trend} isLoading={isLoading} />}
        />
    );
}
