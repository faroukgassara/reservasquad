'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import IncomeReport from '@/components/Organisms/Reports/IncomeReport';
import { useAuthorization } from '@/hooks/useAuthorization';
import { fetchDailyIncomeSummary, fetchIncomeTrend } from '@/lib/daily-income-api';
import { Routes } from '@/lib/routes';

export default function IncomeReportsPage() {
    const t = useTranslations('reports');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Launcher);
    }, [isAdmin, router]);

    const { data: summary, isLoading } = useQuery({
        queryKey: ['daily-income-summary', year, month],
        queryFn: () => fetchDailyIncomeSummary({ year, month }),
        enabled: isAdmin,
    });

    const { data: trend } = useQuery({
        queryKey: ['daily-income-trend', 6],
        queryFn: () => fetchIncomeTrend({ months: 6 }),
        enabled: isAdmin,
    });

    if (!isAdmin) return null;

    return (
        <LayoutWrapper
            title={t('incomeTitle')}
            subTitle={t('incomeSubtitle')}
            mainSection={<IncomeReport summary={summary} trend={trend} isLoading={isLoading} />}
        />
    );
}
