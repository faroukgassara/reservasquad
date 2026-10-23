'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import ProgressBar from '@/components/Primitives/ProgressBar/ProgressBar';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    EInputSize,
    ESize,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { formatMoney, type DailyIncomeScope, type DailyIncomeSummary } from '@/lib/daily-income-api';
import {
    ChartLoader,
    ChartPanel,
    exportToCsv,
    formatMonthLabel,
    printReport,
    StatCardGrid,
    type IReportStatCard,
} from './ReportPanels';

const IncomeTrendChart = dynamic(
    () => import('@/components/Organisms/Dashboard/DashboardCharts').then((m) => m.IncomeTrendChart),
    { ssr: false, loading: () => <ChartLoader /> },
);

const IncomeBreakdownChart = dynamic(
    () => import('@/components/Organisms/Dashboard/DashboardCharts').then((m) => m.IncomeBreakdownChart),
    { ssr: false, loading: () => <ChartLoader /> },
);

interface IIncomeReport {
    summary?: DailyIncomeSummary;
    trend?: DailyIncomeSummary[];
    isLoading: boolean;
    year: number;
    month: number;
    scope: DailyIncomeScope;
    onYearChange: (year: number) => void;
    onMonthChange: (month: number) => void;
    onScopeChange: (scope: DailyIncomeScope) => void;
}

export default function IncomeReport({
    summary,
    trend,
    isLoading,
    year,
    month,
    scope,
    onYearChange,
    onMonthChange,
    onScopeChange,
}: IIncomeReport) {
    const t = useTranslations('dashboard');
    const tReports = useTranslations('reports');
    const tIncome = useTranslations('admin.dailyIncome');
    const locale = useLocale();

    const isGlobal = scope === 'all';

    const trendData = useMemo(
        () =>
            (trend ?? []).map((point) => ({
                label: formatMonthLabel(point.year, point.month, locale),
                income: point.totalIncome,
                netBalance: point.netBalance,
            })),
        [trend, locale],
    );

    const breakdownData = useMemo(
        () =>
            (trend ?? []).map((point) => ({
                label: formatMonthLabel(point.year, point.month, locale),
                income: point.totalIncome,
                expenses: Math.round((point.totalCharges + point.totalInvestments) * 100) / 100,
                savings: point.totalSavings,
                benefits: point.totalBenefits,
                netBalance: point.netBalance,
            })),
        [trend, locale],
    );

    // Calculated metrics for selected month / global
    const totalIncome = summary?.totalIncome ?? 0;
    const totalCharges = summary?.totalCharges ?? 0;
    const totalInvestments = summary?.totalInvestments ?? 0;
    const totalExpenses = Math.round((totalCharges + totalInvestments) * 100) / 100;
    const netBalance = summary?.netBalance ?? 0;
    const netMarginPercent =
        totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;
    const expensePercent =
        totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
    const savingsPercent =
        totalIncome > 0 ? Math.round(((summary?.totalSavings ?? 0) / totalIncome) * 100) : 20;
    const benefitsPercent =
        totalIncome > 0 ? Math.round(((summary?.totalBenefits ?? 0) / totalIncome) * 100) : 20;

    const cards: IReportStatCard[] = [
        {
            key: 'income',
            icon: IconComponentsEnum.layers,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: tIncome('totalIncome'),
            value: formatMoney(totalIncome),
        },
        {
            key: 'net',
            icon: IconComponentsEnum.home,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: `${tIncome('netBalance')} (${netMarginPercent}%)`,
            value: formatMoney(netBalance),
        },
        {
            key: 'totalExpenses',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-700',
            label: `${tReports('totalExpenses')} (${expensePercent}%)`,
            value: formatMoney(totalExpenses),
        },
        {
            key: 'savings',
            icon: IconComponentsEnum.checkCircle,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: `${tIncome('totalSavings')} (20%)`,
            value: formatMoney(summary?.totalSavings ?? 0),
        },
        {
            key: 'benefits',
            icon: IconComponentsEnum.gift,
            iconBg: 'bg-accent-50',
            iconColor: 'text-accent-600',
            label: `${tIncome('totalBenefits')} (20%)`,
            value: formatMoney(summary?.totalBenefits ?? 0),
        },
        {
            key: 'savingsForCharges',
            icon: IconComponentsEnum.archive,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
            label: `${tIncome('totalSavingsForCharges')} (10%)`,
            value: formatMoney(summary?.totalSavingsForCharges ?? 0),
        },
        {
            key: 'previousMonthRest',
            icon: IconComponentsEnum.star,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: tIncome('previousMonthRest'),
            value: formatMoney(summary?.previousMonthRest ?? 0),
        },
    ];

    const [isExporting, setIsExporting] = useState(false);

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const { exportIncomeReportPdf } = await import('@/lib/export-income-report-pdf');
            exportIncomeReportPdf({
                fileStamp: isGlobal ? 'global' : `${year}-${String(month).padStart(2, '0')}`,
                periodLabel: currentPeriodLabel,
                summary,
                breakdown: breakdownData,
                isGlobal,
                labels: {
                    title: tReports('incomeTitle'),
                    period: currentPeriodLabel,
                    summaryTitle: tReports('financialBreakdown'),
                    trendTitle: tReports('financialBreakdown'),
                    totalIncome: tIncome('totalIncome'),
                    totalCharges: tReports('totalExpenses'),
                    netBalance: tIncome('netBalance'),
                    totalSavings: tIncome('totalSavings'),
                    totalBenefits: tIncome('totalBenefits'),
                    totalSavingsForCharges: tIncome('totalSavingsForCharges'),
                    previousMonthRest: tIncome('previousMonthRest'),
                    periodCol: tReports('period'),
                    incomeCol: tIncome('totalIncome'),
                    chargesCol: tReports('totalExpenses'),
                    savingsCol: tIncome('totalSavings'),
                    benefitsCol: tIncome('totalBenefits'),
                    netBalanceCol: tIncome('netBalance'),
                    totalRow: tReports('global'),
                    empty: tReports('summaryGlobal'),
                },
            });
        } finally {
            setIsExporting(false);
        }
    };

    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const label = new Date(2000, i, 1).toLocaleDateString(locale === 'ar' ? 'ar-TN' : locale === 'en' ? 'en-US' : 'fr-FR', {
            month: 'long',
        });
        return {
            value: String(m),
            label: label.charAt(0).toUpperCase() + label.slice(1),
        };
    });

    const currentYear = new Date().getFullYear();
    const yearOptions = [
        currentYear - 2,
        currentYear - 1,
        currentYear,
        currentYear + 1,
    ].map((y) => ({ value: String(y), label: String(y) }));

    const currentPeriodLabel = isGlobal
        ? tReports('global')
        : formatMonthLabel(year, month, locale);

    return (
        <Div className="mx-auto max-w-7xl space-y-6">
            {/* Top Toolbar: Global button + Month/Year selectors + Export Actions */}
            <Div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Global button and Month/Year dropdowns */}
                <Div className="flex flex-wrap items-center gap-3">
                    <Button
                        id="income-scope-global"
                        text={tReports('global')}
                        size={EButtonSize.small}
                        type={isGlobal ? EButtonType.primary : EButtonType.secondary}
                        onClick={() => onScopeChange(isGlobal ? 'month' : 'all')}
                        className={isGlobal ? 'font-semibold' : 'text-gray-700 border-gray-200'}
                    />

                    {!isGlobal ? (
                        <Div className="flex flex-wrap items-center gap-2">
                            <Div className="flex items-center gap-2">
                                <Label variant={EVariantLabel.caption} color="text-gray-500" className="font-medium hidden sm:inline">
                                    {tReports('monthSelector')} :
                                </Label>
                                <Div className="w-36">
                                    <Dropdown
                                        size={EInputSize.small}
                                        options={monthOptions}
                                        value={String(month)}
                                        onChange={(val) => onMonthChange(Number(val))}
                                    />
                                </Div>
                            </Div>

                            <Div className="w-24">
                                <Dropdown
                                    size={EInputSize.small}
                                    options={yearOptions}
                                    value={String(year)}
                                    onChange={(val) => onYearChange(Number(val))}
                                />
                            </Div>
                        </Div>
                    ) : (
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="italic font-medium">
                            {tReports('summaryGlobal')}
                        </Label>
                    )}
                </Div>

                {/* Right: Export & Print Actions */}
                <Div className="flex items-center gap-2">
                    <Button
                        id="export-income-pdf"
                        text={tReports('exportPdf')}
                        size={EButtonSize.small}
                        type={EButtonType.secondary}
                        icon={{
                            name: IconComponentsEnum.pdf,
                            size: ESize.xs,
                            color: 'text-primary-600',
                        }}
                        iconPosition="left"
                        onClick={handleExportPdf}
                        isLoading={isExporting}
                        disabled={isLoading}
                    />

                    <Button
                        id="print-income-report"
                        text={tReports('printReport')}
                        size={EButtonSize.small}
                        type={EButtonType.secondary}
                        icon={{
                            name: IconComponentsEnum.printer,
                            size: ESize.xs,
                            color: 'text-gray-600',
                        }}
                        iconPosition="left"
                        onClick={printReport}
                    />
                </Div>
            </Div>

            {/* Selected Period Badge */}
            <Div className="flex items-center justify-between">
                <Div className="flex items-center gap-2">
                    <Label variant={EVariantLabel.body} color="text-gray-800" className="font-semibold">
                        {isGlobal
                            ? tReports('summaryGlobal')
                            : tReports('summaryFor', { period: currentPeriodLabel })}
                    </Label>
                    <Badge
                        id="income-net-margin-badge"
                        type={netMarginPercent >= 0 ? EBadgeType.success : EBadgeType.error}
                        text={`${netMarginPercent}% ${tReports('netMargin')}`}
                        size={EBadgeSize.medium}
                    />
                </Div>
            </Div>

            {/* KPI Cards Grid */}
            <StatCardGrid
                cards={cards}
                isLoading={isLoading}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            />

            {/* Monthly Allocation Breakdown Panel */}
            <ChartPanel title={tReports('breakdownTitle')}>
                <Div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1.5">
                        <Div className="flex items-center justify-between">
                            <Label variant={EVariantLabel.caption} color="text-gray-600" className="font-medium">
                                {tReports('totalExpenses')}
                            </Label>
                            <span className="text-xs font-bold text-warning-700">{expensePercent}%</span>
                        </Div>
                        <ProgressBar value={expensePercent} showPercent={false} className="h-1.5" />
                        <span className="text-xs text-gray-500">{formatMoney(totalExpenses)}</span>
                    </Div>

                    <Div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1.5">
                        <Div className="flex items-center justify-between">
                            <Label variant={EVariantLabel.caption} color="text-gray-600" className="font-medium">
                                {tIncome('totalSavings')} (20%)
                            </Label>
                            <span className="text-xs font-bold text-success-700">{savingsPercent}%</span>
                        </Div>
                        <ProgressBar value={savingsPercent} showPercent={false} className="h-1.5" />
                        <span className="text-xs text-gray-500">{formatMoney(summary?.totalSavings ?? 0)}</span>
                    </Div>

                    <Div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1.5">
                        <Div className="flex items-center justify-between">
                            <Label variant={EVariantLabel.caption} color="text-gray-600" className="font-medium">
                                {tIncome('totalBenefits')} (20%)
                            </Label>
                            <span className="text-xs font-bold text-accent-700">{benefitsPercent}%</span>
                        </Div>
                        <ProgressBar value={benefitsPercent} showPercent={false} className="h-1.5" />
                        <span className="text-xs text-gray-500">{formatMoney(summary?.totalBenefits ?? 0)}</span>
                    </Div>

                    <Div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1.5">
                        <Div className="flex items-center justify-between">
                            <Label variant={EVariantLabel.caption} color="text-gray-600" className="font-medium">
                                {tReports('netMargin')}
                            </Label>
                            <span className={`text-xs font-bold ${netMarginPercent >= 0 ? 'text-primary-700' : 'text-danger-700'}`}>
                                {netMarginPercent}%
                            </span>
                        </Div>
                        <ProgressBar
                            value={Math.max(0, netMarginPercent)}
                            showPercent={false}
                            className="h-1.5"
                        />
                        <span className="text-xs text-gray-500">{formatMoney(netBalance)}</span>
                    </Div>
                </Div>
            </ChartPanel>

            {/* Charts Grid */}
            <Div className="grid gap-4 lg:grid-cols-2">
                <ChartPanel title={t('incomeTrendTitle')}>
                    <IncomeTrendChart
                        data={trendData}
                        title={t('incomeTrendTitle')}
                        periodLabel={t('chartPeriod')}
                        incomeLabel={t('chartIncome')}
                        netBalanceLabel={t('chartNetBalance')}
                    />
                </ChartPanel>

                <ChartPanel title={tReports('financialBreakdown')}>
                    <IncomeBreakdownChart
                        data={breakdownData}
                        title={tReports('financialBreakdown')}
                        periodLabel={t('chartPeriod')}
                        incomeLabel={tIncome('totalIncome')}
                        expensesLabel={tReports('totalExpenses')}
                        netBalanceLabel={tIncome('netBalance')}
                    />
                </ChartPanel>
            </Div>
        </Div>
    );
}
