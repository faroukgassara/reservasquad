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
import {
    formatMoney,
    type DashboardRoomBreakdown,
    type DashboardStats,
    type ReservationMonthlyTrendPoint,
    type ReservationStatsScope,
} from '@/lib/reservation-api';
import type { MonthlySalesTrendItem } from '@/lib/analytics-api';
import {
    ChartLoader,
    ChartPanel,
    EmptyChartState,
    exportToCsv,
    formatMonthLabel,
    StatCardGrid,
    type IReportStatCard,
} from './ReportPanels';

const ReservationDailyMonthChart = dynamic(
    () => import('./ReservationDailyMonthChart'),
    { ssr: false, loading: () => <ChartLoader /> },
);

const AnnualComparisonView = dynamic(
    () => import('@/components/Organisms/Pos/AnnualComparisonView'),
    { ssr: false, loading: () => <ChartLoader /> },
);

function TopRoomsList({
    rooms,
    emptyLabel,
    roomLabel,
    periodLabel,
    shareLabel,
    searchTerm,
    isGlobal = false,
}: Readonly<{
    rooms: DashboardRoomBreakdown[];
    emptyLabel: string;
    roomLabel: string;
    periodLabel: string;
    shareLabel: string;
    searchTerm: string;
    isGlobal?: boolean;
}>) {
    const sortedRooms = useMemo(() => {
        const copy = [...rooms];
        return copy.sort((a, b) =>
            isGlobal
                ? b.totalRevenue - a.totalRevenue || a.roomName.localeCompare(b.roomName)
                : b.monthRevenue - a.monthRevenue || a.roomName.localeCompare(b.roomName),
        );
    }, [rooms, isGlobal]);

    const totalRelevantRevenue = useMemo(
        () =>
            sortedRooms.reduce(
                (acc, r) => acc + (isGlobal ? r.totalRevenue : r.monthRevenue || 0),
                0,
            ) || 1,
        [sortedRooms, isGlobal],
    );

    const filteredRooms = useMemo(() => {
        if (!searchTerm.trim()) return sortedRooms;
        const lower = searchTerm.toLowerCase();
        return sortedRooms.filter((r) => r.roomName.toLowerCase().includes(lower));
    }, [sortedRooms, searchTerm]);

    if (filteredRooms.length === 0) return <EmptyChartState label={emptyLabel} />;

    return (
        <Div className="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
            <Div className="grid grid-cols-[minmax(0,1.2fr)_8rem_minmax(0,1fr)] items-center gap-x-4 border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/50">
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="font-medium">
                    {roomLabel}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="text-end font-medium">
                    {periodLabel}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="hidden sm:block font-medium">
                    {shareLabel}
                </Label>
            </Div>
            <Div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRooms.map((room, index) => {
                    const revenueValue = isGlobal ? room.totalRevenue : room.monthRevenue;
                    const sharePercent = totalRelevantRevenue > 0
                        ? Math.min(100, Math.max(0, Math.round((revenueValue / totalRelevantRevenue) * 100)))
                        : 0;
                    const isTop = index === 0 && revenueValue > 0;

                    return (
                        <Div
                            key={room.roomId}
                            className="grid grid-cols-[minmax(0,1.2fr)_8rem_minmax(0,1fr)] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                        >
                            <Div className="flex items-center gap-2 truncate">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-800" className="truncate font-medium dark:text-gray-200">
                                    {room.roomName}
                                </Label>
                                {isTop && (
                                    <Badge
                                        id={`top-room-badge-${room.roomId}`}
                                        type={EBadgeType.success}
                                        text="Top"
                                        size={EBadgeSize.small}
                                        className="shrink-0"
                                    />
                                )}
                            </Div>
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color="text-primary-700"
                                className="text-end font-semibold tabular-nums dark:text-primary-400"
                            >
                                {formatMoney(revenueValue)}
                            </Label>
                            <Div className="hidden sm:block">
                                <ProgressBar value={sharePercent} showPercent className="text-xs" />
                            </Div>
                        </Div>
                    );
                })}
            </Div>
        </Div>
    );
}

interface IReservationReport {
    stats?: DashboardStats;
    trend?: ReservationMonthlyTrendPoint[];
    isLoading: boolean;
    year: number;
    month: number;
    scope: ReservationStatsScope;
    onYearChange: (year: number) => void;
    onMonthChange: (month: number) => void;
    onScopeChange: (scope: ReservationStatsScope) => void;
}

export default function ReservationReport({
    stats,
    trend,
    isLoading,
    year,
    month,
    scope,
    onYearChange,
    onMonthChange,
    onScopeChange,
}: IReservationReport) {
    const t = useTranslations('dashboard');
    const tReports = useTranslations('reports');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const [roomSearch, setRoomSearch] = useState('');

    const isGlobal = scope === 'all';

    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const label = new Date(2000, i, 1).toLocaleDateString(
            locale === 'ar' ? 'ar-TN' : locale === 'en' ? 'en-US' : 'fr-FR',
            { month: 'long' },
        );
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

    const trendData = useMemo(
        () =>
            (trend ?? []).map((point) => ({
                label: formatMonthLabel(point.year, point.month, locale),
                count: point.count,
                revenue: point.revenue,
                paidRevenue: point.paidRevenue,
            })),
        [trend, locale],
    );

    const annualTrendData: MonthlySalesTrendItem[] = useMemo(() => {
        return (trend ?? []).map((point) => {
            const monthStr = String(point.month).padStart(2, '0');
            return {
                month: `${point.year}-${monthStr}`,
                label: `${point.year}-${monthStr}`,
                totalRevenue: point.revenue,
                unitsSold: point.count,
                ordersCount: point.count,
            };
        });
    }, [trend]);

    const hasTrend = (trend ?? []).some((point) => point.count > 0);

    // Insight metrics
    const monthRevenue = stats?.month.revenue ?? 0;
    const monthPaid = stats?.month.paidRevenue ?? 0;
    const collectionRate =
        monthRevenue > 0 ? Math.min(100, Math.round((monthPaid / monthRevenue) * 100)) : 100;

    const cards: IReportStatCard[] = [
        {
            key: 'revenue',
            icon: IconComponentsEnum.star,
            iconBg: 'bg-accent-50',
            iconColor: 'text-accent-600',
            label: isGlobal ? t('kpiTotalRevenue') : t('kpiRevenueMonth'),
            value: formatMoney(monthRevenue),
        },
        {
            key: 'paid',
            icon: IconComponentsEnum.checkCircle,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: `${isGlobal ? t('kpiTotalPaid') : t('kpiPaidMonth')} (${collectionRate}%)`,
            value: formatMoney(monthPaid),
        },
        {
            key: 'unpaidMonth',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-700',
            label: isGlobal ? t('kpiTotalUnpaid') : t('kpiUnpaidMonth'),
            value: formatMoney(stats?.month.unpaidRevenue ?? 0),
        },
    ];

    const [isExporting, setIsExporting] = useState(false);

    const roomBreakdown = useMemo(() => {
        if (!stats?.topRooms?.length) return [];
        const total = stats.topRooms.reduce(
            (acc, r) => acc + (isGlobal ? (r.totalRevenue || 0) : (r.monthRevenue || 0)),
            0,
        ) || 1;
        return stats.topRooms.map((r) => {
            const rev = isGlobal ? r.totalRevenue : r.monthRevenue;
            return {
                name: r.roomName,
                monthRevenue: r.monthRevenue,
                totalRevenue: r.totalRevenue,
                share: Math.min(100, Math.round(((rev || 0) / total) * 100)),
            };
        });
    }, [stats, isGlobal]);

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const { exportReservationReportPdf } = await import('@/lib/export-reservation-report-pdf');
            exportReservationReportPdf({
                fileStamp: isGlobal ? 'global' : `${year}-${String(month).padStart(2, '0')}`,
                periodLabel: currentPeriodLabel,
                stats,
                isGlobal,
                trend: trendData.map((d) => ({
                    label: d.label,
                    count: d.count,
                    revenue: d.revenue,
                    paidRevenue: d.paidRevenue,
                    unpaidRevenue: Math.max(0, d.revenue - d.paidRevenue),
                })),
                rooms: roomBreakdown,
                labels: {
                    title: tReports('reservationsTitle'),
                    period: currentPeriodLabel,
                    summaryTitle: tReports('reservationsSubtitle'),
                    trendTitle: t('trendTitle'),
                    roomsTitle: t('topRoomsTitle'),
                    revenueMonth: t('kpiRevenueMonth'),
                    paidMonth: t('kpiPaidMonth'),
                    unpaidMonth: t('kpiUnpaidMonth'),
                    collectionRate: tReports('collectionRate'),
                    avgPerReservation: tReports('avgRevenuePerReservation'),
                    totalRevenue: t('kpiTotalRevenue'),
                    totalPaid: t('kpiTotalPaid'),
                    monthCol: tReports('period'),
                    countCol: t('chartReservations'),
                    revenueCol: t('chartRevenue'),
                    paidCol: t('chartPaidRevenue'),
                    unpaidCol: t('kpiUnpaidMonth'),
                    roomCol: t('roomRevenueRoom'),
                    shareCol: tReports('revenueShare'),
                    monthRevenueCol: t('roomRevenueMonth'),
                    totalRevenueCol: t('roomRevenueTotal'),
                    totalRow: tReports('global'),
                    empty: tCommon('empty'),
                },
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Div className="mx-auto max-w-7xl space-y-6">
            {/* Top Toolbar: Segmented Toggle (Monthly / Global) + Year/Month dropdowns with labels + Export PDF */}
            <Div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Monthly vs Global segmented pill + Year & Month selectors */}
                <Div className="flex flex-wrap items-center gap-4">
                    <Div className="inline-flex rounded-xl bg-slate-200/70 p-1 dark:bg-gray-800">
                        <button
                            type="button"
                            id="scope-monthly-btn"
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                                !isGlobal
                                    ? 'bg-white text-primary-950 shadow-xs dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                            onClick={() => onScopeChange('month')}
                        >
                            {tReports('monthly')}
                        </button>
                        <button
                            type="button"
                            id="scope-global-btn"
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                                isGlobal
                                    ? 'bg-white text-primary-950 shadow-xs dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                            onClick={() => onScopeChange('all')}
                        >
                            {tReports('globalAllTime')}
                        </button>
                    </Div>

                    {!isGlobal && (
                        <Div className="flex flex-wrap items-center gap-3">
                            <Div className="flex flex-col gap-1">
                                <Label
                                    variant={EVariantLabel.caption}
                                    color="text-gray-600"
                                    className="text-xs font-medium"
                                >
                                    {tReports('year')}
                                </Label>
                                <Div className="w-24 sm:w-28">
                                    <Dropdown
                                        size={EInputSize.small}
                                        options={yearOptions}
                                        value={String(year)}
                                        onChange={(val) => onYearChange(Number(val))}
                                    />
                                </Div>
                            </Div>

                            <Div className="flex flex-col gap-1">
                                <Label
                                    variant={EVariantLabel.caption}
                                    color="text-gray-600"
                                    className="text-xs font-medium"
                                >
                                    {tReports('month')}
                                </Label>
                                <Div className="w-32 sm:w-36">
                                    <Dropdown
                                        size={EInputSize.small}
                                        options={monthOptions}
                                        value={String(month)}
                                        onChange={(val) => onMonthChange(Number(val))}
                                    />
                                </Div>
                            </Div>
                        </Div>
                    )}
                </Div>

                {/* Right: Export PDF Action */}
                <Div className="flex items-center gap-2">
                    <Button
                        id="export-reservations-pdf"
                        text={tReports('exportPdf')}
                        size={EButtonSize.small}
                        type={EButtonType.secondary}
                        onClick={handleExportPdf}
                        isLoading={isExporting}
                        disabled={isLoading || !hasTrend}
                    />
                </Div>
            </Div>

            {/* Selected Period Heading & Collection Rate Badge */}
            <Div className="flex items-center justify-between">
                <Div className="flex items-center gap-2">
                    <Label variant={EVariantLabel.body} color="text-gray-800" className="font-semibold">
                        {isGlobal
                            ? tReports('summaryGlobal')
                            : tReports('summaryFor', { period: currentPeriodLabel })}
                    </Label>
                    <Badge
                        id="reservations-collection-badge"
                        type={collectionRate >= 80 ? EBadgeType.success : collectionRate >= 50 ? EBadgeType.warning : EBadgeType.error}
                        text={`${collectionRate}% ${tReports('collectionRate')}`}
                        size={EBadgeSize.medium}
                    />
                </Div>
            </Div>

            {/* KPI Cards */}
            <StatCardGrid cards={cards} isLoading={isLoading} className="grid grid-cols-1 gap-3 sm:grid-cols-3" />

            {/* Dynamic Chart Section: Daily Month Breakdown when Month selected, or Annual YoY Comparison when Global */}
            {isGlobal ? (
                <AnnualComparisonView
                    data={annualTrendData}
                    isLoading={isLoading}
                    categoryName={tReports('reservationsTitle')}
                    showMetricSelector={false}
                />
            ) : (
                <ReservationDailyMonthChart
                    year={year}
                    month={month}
                    days={stats?.dailyBreakdown}
                    isLoading={isLoading}
                />
            )}

            {/* Room Leaderboard Table */}
            <ChartPanel
                title={t('topRoomsTitle')}
                action={
                    <input
                        type="text"
                        placeholder={tReports('filterByRoom')}
                        value={roomSearch}
                        onChange={(e) => setRoomSearch(e.target.value)}
                        className="h-8 rounded-lg border border-gray-200 px-3 text-xs text-gray-800 focus:border-primary-500 focus:outline-none"
                    />
                }
            >
                <TopRoomsList
                    rooms={stats?.topRooms ?? []}
                    emptyLabel={t('noRoomsConfigured')}
                    roomLabel={t('roomRevenueRoom')}
                    periodLabel={isGlobal ? tReports('global') : currentPeriodLabel}
                    shareLabel={tReports('revenueShare')}
                    searchTerm={roomSearch}
                    isGlobal={isGlobal}
                />
            </ChartPanel>
        </Div>
    );
}
