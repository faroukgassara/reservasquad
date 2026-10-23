'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import ReservationReport from '@/components/Organisms/Reports/ReservationReport';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
    fetchDashboardStats,
    fetchReservationTrend,
    type ReservationStatsScope,
} from '@/lib/reservation-api';
import { Routes } from '@/lib/routes';

export default function ReservationReportsPage() {
    const t = useTranslations('reports');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    const now = new Date();
    const [year, setYear] = useState<number>(now.getFullYear());
    const [month, setMonth] = useState<number>(now.getMonth() + 1);
    const [scope, setScope] = useState<ReservationStatsScope>('month');

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Today);
    }, [isAdmin, router]);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats', scope, year, month],
        queryFn: () => fetchDashboardStats({ year, month, scope }),
        enabled: isAdmin,
    });

    const { data: trend, isLoading: trendLoading } = useQuery({
        queryKey: ['reservation-trend', 12],
        queryFn: () => fetchReservationTrend({ months: 12 }),
        enabled: isAdmin,
    });

    if (!isAdmin) return null;

    return (
        <LayoutWrapper
            title={t('reservationsTitle')}
            subTitle={t('reservationsSubtitle')}
            mainSection={
                <ReservationReport
                    stats={stats}
                    trend={trend}
                    isLoading={statsLoading || trendLoading}
                    year={year}
                    month={month}
                    scope={scope}
                    onYearChange={setYear}
                    onMonthChange={setMonth}
                    onScopeChange={setScope}
                />
            }
        />
    );
}
