'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import IncomeReport from '@/components/Organisms/Reports/IncomeReport';
import { useAuthorization } from '@/hooks/useAuthorization';
import { fetchDailyIncomeSummary, fetchIncomeTrend, type DailyIncomeScope } from '@/lib/daily-income-api';
import { Routes } from '@/lib/routes';

export default function IncomeReportsPage() {
    const t = useTranslations('reports');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    const now = new Date();
    const [year, setYear] = useState<number>(now.getFullYear());
    const [month, setMonth] = useState<number>(now.getMonth() + 1);
    const [scope, setScope] = useState<DailyIncomeScope>('month');

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Launcher);
    }, [isAdmin, router]);

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['daily-income-summary', scope, year, month],
        queryFn: () => fetchDailyIncomeSummary({ year, month, scope }),
        enabled: isAdmin,
    });

    const { data: trend, isLoading: trendLoading } = useQuery({
        queryKey: ['daily-income-trend', 12],
        queryFn: () => fetchIncomeTrend({ months: 12 }),
        enabled: isAdmin,
    });

    if (!isAdmin) return null;

    return (
        <LayoutWrapper
            title={t('incomeTitle')}
            subTitle={t('incomeSubtitle')}
            mainSection={
                <IncomeReport
                    summary={summary}
                    trend={trend}
                    isLoading={summaryLoading || trendLoading}
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
