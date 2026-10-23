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
import { Routes } from '@/lib/routes';
import {
    ChartLoader,
    ChartPanel,
    EmptyChartState,
    exportToCsv,
    formatMonthLabel,
    printReport,
    StatCardGrid,
    type IReportStatCard,
} from './ReportPanels';

const ReservationRevenueChart = dynamic(
    () => import('@/components/Organisms/Dashboard/DashboardCharts').then((m) => m.ReservationRevenueChart),
    { ssr: false, loading: () => <ChartLoader /> },
);

const ReservationCountChart = dynamic(
    () => import('@/components/Organisms/Dashboard/DashboardCharts').then((m) => m.ReservationCountChart),
    { ssr: false, loading: () => <ChartLoader /> },
);

function TopRoomsList({
    rooms,
    emptyLabel,
    roomLabel,
    monthLabel,
    totalLabel,
    shareLabel,
    searchTerm,
}: Readonly<{
    rooms: DashboardRoomBreakdown[];
    emptyLabel: string;
    roomLabel: string;
    monthLabel: string;
    totalLabel: string;
    shareLabel: string;
    searchTerm: string;
}>) {
    const totalAllRoomsRevenue = useMemo(
        () => rooms.reduce((acc, r) => acc + (r.totalRevenue || 0), 0) || 1,
        [rooms],
    );

    const filteredRooms = useMemo(() => {
        if (!searchTerm.trim()) return rooms;
        const lower = searchTerm.toLowerCase();
        return rooms.filter((r) => r.roomName.toLowerCase().includes(lower));
    }, [rooms, searchTerm]);

    if (filteredRooms.length === 0) return <EmptyChartState label={emptyLabel} />;

    return (
        <Div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <Div className="grid grid-cols-[minmax(0,1.2fr)_6.5rem_6.5rem_minmax(0,1fr)] items-center gap-x-4 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="font-medium">
                    {roomLabel}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="text-end font-medium">
                    {monthLabel}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="text-end font-medium">
                    {totalLabel}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="hidden sm:block font-medium">
                    {shareLabel}
                </Label>
            </Div>
            <Div className="divide-y divide-gray-100">
                {filteredRooms.map((room, index) => {
                    const sharePercent = Math.min(
                        100,
                        Math.max(0, Math.round((room.totalRevenue / totalAllRoomsRevenue) * 100)),
                    );
                    const isTop = index === 0 && room.totalRevenue > 0;

                    return (
                        <Div
                            key={room.roomId}
                            className="grid grid-cols-[minmax(0,1.2fr)_6.5rem_6.5rem_minmax(0,1fr)] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-gray-50/80"
                        >
                            <Div className="flex items-center gap-2 truncate">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-800" className="truncate font-medium">
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
                                className="text-end font-semibold tabular-nums"
                            >
                                {formatMoney(room.monthRevenue)}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-600" className="text-end tabular-nums">
                                {formatMoney(room.totalRevenue)}
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
    const hasTrend = (trend ?? []).some((point) => point.count > 0);

    // Insight metrics
    const monthRevenue = stats?.month.revenue ?? 0;
    const monthPaid = stats?.month.paidRevenue ?? 0;
    const collectionRate =
        monthRevenue > 0 ? Math.min(100, Math.round((monthPaid / monthRevenue) * 100)) : 100;
    const confirmedCount = stats?.month.confirmed ?? 0;
    const avgPerReservation =
        confirmedCount > 0 ? Math.round(monthRevenue / confirmedCount) : 0;

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
        {
            key: 'avgRevenue',
            icon: IconComponentsEnum.home,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: tReports('avgRevenuePerReservation'),
            value: formatMoney(avgPerReservation),
        },
        {
            key: 'confirmed',
            icon: IconComponentsEnum.userCheck,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: tReports('confirmedReservations'),
            value: String(stats?.month.confirmed ?? 0),
        },
        isGlobal
            ? {
                  key: 'cancelled',
                  icon: IconComponentsEnum.close,
                  iconBg: 'bg-danger-50',
                  iconColor: 'text-danger-600',
                  label: tReports('cancelledReservations'),
                  value: String(stats?.month.cancelled ?? 0),
              }
            : {
                  key: 'totalRevenue',
                  icon: IconComponentsEnum.layers,
                  iconBg: 'bg-accent-50',
                  iconColor: 'text-accent-600',
                  label: t('kpiTotalRevenue'),
                  value: formatMoney(stats?.totalRevenue ?? 0),
              },
    ];

    const [isExporting, setIsExporting] = useState(false);

    const roomBreakdown = useMemo(() => {
        if (!stats?.topRooms?.length) return [];
        const total = stats.topRooms.reduce((acc, r) => acc + (r.totalRevenue || 0), 0) || 1;
        return stats.topRooms.map((r) => ({
            name: r.roomName,
            monthRevenue: r.monthRevenue,
            totalRevenue: r.totalRevenue,
            share: Math.min(100, Math.round(((r.totalRevenue || 0) / total) * 100)),
        }));
    }, [stats]);

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

    const emptyState = (
        <EmptyChartState
            label={tCommon('empty')}
            actionLabel={t('quickNewReservation')}
            actionHref={Routes.Reservations.index}
        />
    );

    return (
        <Div className="mx-auto max-w-7xl space-y-6">
            {/* Top Toolbar: Global button + Month/Year selectors + Export Actions */}
            <Div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Global button and Month/Year dropdowns */}
                <Div className="flex flex-wrap items-center gap-3">
                    <Button
                        id="reservations-scope-global"
                        text={tReports('global')}
                        size={EButtonSize.small}
                        type={isGlobal ? EButtonType.primary : EButtonType.secondary}
                        onClick={() => onScopeChange(isGlobal ? 'month' : 'all')}
                        className={isGlobal ? 'font-semibold' : 'text-gray-700 border-gray-200'}
                    />

                    {!isGlobal ? (
                        <Div className="flex flex-wrap items-center gap-2">
                            <Div className="flex items-center gap-2">
                                <Label
                                    variant={EVariantLabel.caption}
                                    color="text-gray-500"
                                    className="font-medium hidden sm:inline"
                                >
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
                        <Label
                            variant={EVariantLabel.caption}
                            color="text-gray-500"
                            className="italic font-medium"
                        >
                            {tReports('summaryGlobal')}
                        </Label>
                    )}
                </Div>

                {/* Right: Export & Print Actions */}
                <Div className="flex items-center gap-2">
                    <Button
                        id="export-reservations-pdf"
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
                        disabled={isLoading || !hasTrend}
                    />
                    <Button
                        id="print-reservations-report"
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
            <StatCardGrid cards={cards} isLoading={isLoading} />

            {/* Charts Row */}
            <Div className="grid gap-4 lg:grid-cols-2">
                <ChartPanel title={t('reservationTrendTitle')}>
                    {hasTrend ? (
                        <ReservationRevenueChart
                            data={trendData}
                            title={t('reservationTrendTitle')}
                            periodLabel={t('chartPeriod')}
                            revenueLabel={t('chartRevenue')}
                            paidRevenueLabel={t('chartPaidRevenue')}
                        />
                    ) : (
                        emptyState
                    )}
                </ChartPanel>

                <ChartPanel title={t('trendTitle')}>
                    {hasTrend ? (
                        <ReservationCountChart
                            data={trendData}
                            title={t('trendTitle')}
                            periodLabel={t('chartPeriod')}
                            countLabel={t('chartReservations')}
                        />
                    ) : (
                        emptyState
                    )}
                </ChartPanel>
            </Div>

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
                    monthLabel={t('roomRevenueMonth')}
                    totalLabel={t('roomRevenueTotal')}
                    shareLabel={tReports('revenueShare')}
                    searchTerm={roomSearch}
                />
            </ChartPanel>
        </Div>
    );
}
