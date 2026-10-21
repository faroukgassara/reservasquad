'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import { IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney, type DailyIncomeSummary } from '@/lib/daily-income-api';
import { ChartLoader, ChartPanel, formatMonthLabel, StatCardGrid, type IReportStatCard } from './ReportPanels';

const IncomeTrendChart = dynamic(
    () => import('@/components/Organisms/Dashboard/DashboardCharts').then((m) => m.IncomeTrendChart),
    { ssr: false, loading: () => <ChartLoader /> },
);

interface IIncomeReport {
    summary?: DailyIncomeSummary;
    trend?: DailyIncomeSummary[];
    isLoading: boolean;
}

export default function IncomeReport({ summary, trend, isLoading }: IIncomeReport) {
    const t = useTranslations('dashboard');
    const tIncome = useTranslations('admin.dailyIncome');

    const trendData = useMemo(
        () =>
            (trend ?? []).map((point) => ({
                label: formatMonthLabel(point.year, point.month),
                income: point.totalIncome,
                netBalance: point.netBalance,
            })),
        [trend],
    );

    const cards: IReportStatCard[] = [
        {
            key: 'income',
            icon: IconComponentsEnum.layers,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: tIncome('totalIncome'),
            value: formatMoney(summary?.totalIncome ?? 0),
        },
        {
            key: 'charges',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-700',
            label: tIncome('totalCharges'),
            value: formatMoney(summary?.totalCharges ?? 0),
        },
        {
            key: 'investments',
            icon: IconComponentsEnum.star,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: tIncome('totalInvestments'),
            value: formatMoney(summary?.totalInvestments ?? 0),
        },
        {
            key: 'savings',
            icon: IconComponentsEnum.checkCircle,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: tIncome('totalSavings'),
            value: formatMoney(summary?.totalSavings ?? 0),
        },
        {
            key: 'benefits',
            icon: IconComponentsEnum.gift,
            iconBg: 'bg-accent-50',
            iconColor: 'text-accent-600',
            label: tIncome('totalBenefits'),
            value: formatMoney(summary?.totalBenefits ?? 0),
        },
        {
            key: 'savingsForCharges',
            icon: IconComponentsEnum.archive,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
            label: tIncome('totalSavingsForCharges'),
            value: formatMoney(summary?.totalSavingsForCharges ?? 0),
        },
        {
            key: 'net',
            icon: IconComponentsEnum.home,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: tIncome('netBalance'),
            value: formatMoney(summary?.netBalance ?? 0),
        },
    ];

    return (
        <Div className="mx-auto max-w-7xl space-y-6">
            <StatCardGrid
                cards={cards}
                isLoading={isLoading}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            />

            <ChartPanel title={t('incomeTrendTitle')}>
                <IncomeTrendChart
                    data={trendData}
                    title={t('incomeTrendTitle')}
                    periodLabel={t('chartPeriod')}
                    incomeLabel={t('chartIncome')}
                    netBalanceLabel={t('chartNetBalance')}
                />
            </ChartPanel>
        </Div>
    );
}
