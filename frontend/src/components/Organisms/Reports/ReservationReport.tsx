'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import {
    formatMoney,
    type DashboardRoomBreakdown,
    type DashboardStats,
    type ReservationMonthlyTrendPoint,
} from '@/lib/reservation-api';
import { Routes } from '@/lib/routes';
import {
    ChartLoader,
    ChartPanel,
    EmptyChartState,
    formatMonthLabel,
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
}: Readonly<{
    rooms: DashboardRoomBreakdown[];
    emptyLabel: string;
    roomLabel: string;
    monthLabel: string;
    totalLabel: string;
}>) {
    if (rooms.length === 0) return <EmptyChartState label={emptyLabel} />;

    return (
        <Div className="overflow-hidden rounded-xl border border-gray-100">
            <Div className="grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem] items-center gap-x-4 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="font-medium">
                    {roomLabel}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="text-end font-medium">
                    {monthLabel}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="text-end font-medium">
                    {totalLabel}
                </Label>
            </Div>
            <Div className="divide-y divide-gray-100">
                {rooms.map((room) => (
                    <Div
                        key={room.roomId}
                        className="grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-gray-50/80"
                    >
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-800" className="truncate font-medium">
                            {room.roomName}
                        </Label>
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
                    </Div>
                ))}
            </Div>
        </Div>
    );
}

interface IReservationReport {
    stats?: DashboardStats;
    trend?: ReservationMonthlyTrendPoint[];
    isLoading: boolean;
}

export default function ReservationReport({ stats, trend, isLoading }: IReservationReport) {
    const t = useTranslations('dashboard');
    const tCommon = useTranslations('common');

    const trendData = useMemo(
        () =>
            (trend ?? []).map((point) => ({
                label: formatMonthLabel(point.year, point.month),
                count: point.count,
                revenue: point.revenue,
                paidRevenue: point.paidRevenue,
            })),
        [trend],
    );
    const hasTrend = (trend ?? []).some((point) => point.count > 0);

    const cards: IReportStatCard[] = [
        {
            key: 'revenue',
            icon: IconComponentsEnum.star,
            iconBg: 'bg-accent-50',
            iconColor: 'text-accent-600',
            label: t('kpiRevenueMonth'),
            value: formatMoney(stats?.month.revenue ?? 0),
        },
        {
            key: 'paid',
            icon: IconComponentsEnum.checkCircle,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: t('kpiPaidMonth'),
            value: formatMoney(stats?.month.paidRevenue ?? 0),
        },
        {
            key: 'unpaidMonth',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-700',
            label: t('kpiUnpaidMonth'),
            value: formatMoney(stats?.month.unpaidRevenue ?? 0),
        },
        {
            key: 'totalRevenue',
            icon: IconComponentsEnum.layers,
            iconBg: 'bg-accent-50',
            iconColor: 'text-accent-600',
            label: t('kpiTotalRevenue'),
            value: formatMoney(stats?.totalRevenue ?? 0),
        },
        {
            key: 'totalPaid',
            icon: IconComponentsEnum.check,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: t('kpiTotalPaid'),
            value: formatMoney(stats?.totalPaid ?? 0),
        },
        {
            key: 'totalUnpaid',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-700',
            label: t('kpiTotalUnpaid'),
            value: formatMoney(stats?.totalUnpaid ?? 0),
        },
    ];

    const emptyState = (
        <EmptyChartState
            label={tCommon('empty')}
            actionLabel={t('quickNewReservation')}
            actionHref={Routes.Reservations.index}
        />
    );

    return (
        <Div className="mx-auto max-w-7xl space-y-6">
            <StatCardGrid cards={cards} isLoading={isLoading} />

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

            <ChartPanel title={t('topRoomsTitle')}>
                <TopRoomsList
                    rooms={stats?.topRooms ?? []}
                    emptyLabel={t('noRoomsConfigured')}
                    roomLabel={t('roomRevenueRoom')}
                    monthLabel={t('roomRevenueMonth')}
                    totalLabel={t('roomRevenueTotal')}
                />
            </ChartPanel>
        </Div>
    );
}
