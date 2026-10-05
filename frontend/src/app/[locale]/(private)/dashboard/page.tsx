'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps,
} from 'recharts';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import { EVariantLabel, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { fetchDashboardStats, fetchReservationTrend, formatMoney, type DashboardRoomBreakdown } from '@/lib/reservation-api';
import { fetchDailyIncomeSummary, fetchIncomeTrend } from '@/lib/daily-income-api';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import colors from '@/theme/colors';
import type { ELabelColor } from '@/theme/labelColors';
import { useAuthorization } from '@/hooks/useAuthorization';

function formatMonthLabel(year: number, month: number): string {
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
    });
}

function ChartTooltip({ active, payload, label, formatter }: Readonly<TooltipContentProps>) {
    if (!active || !payload?.length) return null;
    return (
        <Div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-md">
            {label ? (
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="mb-1 block font-semibold">
                    {label}
                </Label>
            ) : null}
            <Div className="space-y-0.5">
                {payload.map((entry, index) => {
                    const formatted = formatter
                        ? formatter(entry.value, entry.name, entry, index, payload)
                        : entry.value;
                    return (
                        <Div key={String(entry.dataKey)} className="flex items-center gap-1.5">
                            <Div
                                className="size-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <Label variant={EVariantLabel.caption} color="text-gray-700">
                                {entry.name}: {Array.isArray(formatted) ? formatted[0] : formatted}
                            </Label>
                        </Div>
                    );
                })}
            </Div>
        </Div>
    );
}

function StatCard({
    icon,
    iconBg,
    iconColor,
    label,
    value,
}: Readonly<{
    icon: IconComponentsEnum;
    iconBg: string;
    iconColor: ELabelColor;
    label: string;
    value: string;
}>) {
    return (
        <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Div className="flex items-center gap-3">
                <Div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                    <Icon name={icon} size={ESize.sm} color={iconColor} />
                </Div>
                <Div className="min-w-0 flex flex-col">
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block truncate">
                        {label}
                    </Label>
                    <Label
                        variant={EVariantLabel.h5}
                        color="text-gray-900"
                        className="block truncate font-semibold tabular-nums"
                    >
                        {value}
                    </Label>
                </Div>
            </Div>
        </Div>
    );
}

function SectionHeader({
    icon,
    title,
    href,
    viewAllLabel,
}: Readonly<{ icon: IconComponentsEnum; title: string; href: string; viewAllLabel: string }>) {
    return (
        <Div className="flex items-center justify-between">
            <Div className="flex items-center gap-2.5">
                <Div className="flex size-8 items-center justify-center rounded-lg bg-primary-50">
                    <Icon name={icon} size={ESize.sm} color="text-primary-600" />
                </Div>
                <Label variant={EVariantLabel.h5} color="text-gray-900" className="font-semibold">
                    {title}
                </Label>
            </Div>
            <Link href={href} className="shrink-0">
                <Label
                    variant={EVariantLabel.caption}
                    color="text-primary-600"
                    className="font-medium hover:underline"
                >
                    {viewAllLabel}
                </Label>
            </Link>
        </Div>
    );
}

function ChartPanel({
    title,
    className = '',
    children,
}: Readonly<{ title: string; className?: string; children: ReactNode }>) {
    return (
        <Div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
            <Label variant={EVariantLabel.body} color="text-gray-900" className="mb-4 block">
                {title}
            </Label>
            {children}
        </Div>
    );
}

function EmptyChartState({ label }: Readonly<{ label: string }>) {
    return (
        <Div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
            <Div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
                <Icon name={IconComponentsEnum.layers} size={ESize.sm} color="text-gray-400" />
            </Div>
            <Label variant={EVariantLabel.caption} color="text-gray-400">
                {label}
            </Label>
        </Div>
    );
}

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
                <Label
                    variant={EVariantLabel.caption}
                    color="text-gray-500"
                    className="text-right font-medium"
                >
                    {monthLabel}
                </Label>
                <Label
                    variant={EVariantLabel.caption}
                    color="text-gray-500"
                    className="text-right font-medium"
                >
                    {totalLabel}
                </Label>
            </Div>
            <Div className="divide-y divide-gray-100">
                {rooms.map((room) => (
                    <Div
                        key={room.roomId}
                        className="grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-gray-50/80"
                    >
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-800"
                            className="truncate font-medium"
                        >
                            {room.roomName}
                        </Label>
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-primary-700"
                            className="text-right font-semibold tabular-nums"
                        >
                            {formatMoney(room.monthRevenue)}
                        </Label>
                        <Label
                            variant={EVariantLabel.caption}
                            color="text-gray-600"
                            className="text-right tabular-nums"
                        >
                            {formatMoney(room.totalRevenue)}
                        </Label>
                    </Div>
                ))}
            </Div>
        </Div>
    );
}

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const tIncome = useTranslations('admin.dailyIncome');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Today);
    }, [isAdmin, router]);

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: fetchDashboardStats,
        enabled: isAdmin,
    });

    const { data: incomeSummary, isLoading: incomeSummaryLoading } = useQuery({
        queryKey: ['daily-income-summary', year, month],
        queryFn: () => fetchDailyIncomeSummary({ year, month }),
        enabled: isAdmin,
    });

    const { data: incomeTrend } = useQuery({
        queryKey: ['daily-income-trend', 6],
        queryFn: () => fetchIncomeTrend({ months: 6 }),
        enabled: isAdmin,
    });

    const { data: reservationTrend } = useQuery({
        queryKey: ['reservation-trend', 6],
        queryFn: () => fetchReservationTrend({ months: 6 }),
        enabled: isAdmin,
    });

    const reservationTrendData = useMemo(
        () =>
            (reservationTrend ?? []).map((point) => ({
                label: formatMonthLabel(point.year, point.month),
                count: point.count,
                revenue: point.revenue,
                paidRevenue: point.paidRevenue,
            })),
        [reservationTrend],
    );

    const hasReservationTrend = (reservationTrend ?? []).some((point) => point.count > 0);

    const incomeTrendData = useMemo(
        () =>
            (incomeTrend ?? []).map((point) => ({
                label: formatMonthLabel(point.year, point.month),
                income: point.totalIncome,
                netBalance: point.netBalance,
            })),
        [incomeTrend],
    );

    const reservationCards: {
        key: string;
        icon: IconComponentsEnum;
        iconBg: string;
        iconColor: ELabelColor;
        label: string;
        value: string;
    }[] = [
        {
            key: 'revenue',
            icon: IconComponentsEnum.star,
            iconBg: 'bg-accent-50',
            iconColor: 'text-accent-600',
            label: t('kpiRevenueMonth'),
            value: formatMoney(data?.month.revenue ?? 0),
        },
        {
            key: 'paid',
            icon: IconComponentsEnum.checkCircle,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-600',
            label: t('kpiPaidMonth'),
            value: formatMoney(data?.month.paidRevenue ?? 0),
        },
        {
            key: 'unpaidMonth',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-600',
            label: t('kpiUnpaidMonth'),
            value: formatMoney(data?.month.unpaidRevenue ?? 0),
        },
        {
            key: 'totalRevenue',
            icon: IconComponentsEnum.layers,
            iconBg: 'bg-accent-50',
            iconColor: 'text-accent-600',
            label: t('kpiTotalRevenue'),
            value: formatMoney(data?.totalRevenue ?? 0),
        },
        {
            key: 'totalPaid',
            icon: IconComponentsEnum.check,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-600',
            label: t('kpiTotalPaid'),
            value: formatMoney(data?.totalPaid ?? 0),
        },
        {
            key: 'totalUnpaid',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-600',
            label: t('kpiTotalUnpaid'),
            value: formatMoney(data?.totalUnpaid ?? 0),
        },
    ];

    const incomeCards: {
        key: string;
        icon: IconComponentsEnum;
        iconBg: string;
        iconColor: ELabelColor;
        label: string;
        value: string;
    }[] = [
        {
            key: 'income',
            icon: IconComponentsEnum.layers,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-600',
            label: tIncome('totalIncome'),
            value: formatMoney(incomeSummary?.totalIncome ?? 0),
        },
        {
            key: 'charges',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-600',
            label: tIncome('totalCharges'),
            value: formatMoney(incomeSummary?.totalCharges ?? 0),
        },
        {
            key: 'investments',
            icon: IconComponentsEnum.star,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: tIncome('totalInvestments'),
            value: formatMoney(incomeSummary?.totalInvestments ?? 0),
        },
        {
            key: 'savings',
            icon: IconComponentsEnum.checkCircle,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-600',
            label: tIncome('totalSavings'),
            value: formatMoney(incomeSummary?.totalSavings ?? 0),
        },
        {
            key: 'benefits',
            icon: IconComponentsEnum.gift,
            iconBg: 'bg-accent-50',
            iconColor: 'text-accent-600',
            label: tIncome('totalBenefits'),
            value: formatMoney(incomeSummary?.totalBenefits ?? 0),
        },
        {
            key: 'savingsForCharges',
            icon: IconComponentsEnum.archive,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
            label: tIncome('totalSavingsForCharges'),
            value: formatMoney(incomeSummary?.totalSavingsForCharges ?? 0),
        },
        {
            key: 'net',
            icon: IconComponentsEnum.home,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: tIncome('netBalance'),
            value: formatMoney(incomeSummary?.netBalance ?? 0),
        },
    ];

    if (!isAdmin) return null;

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            mainSection={
                <Div className="mx-auto max-w-7xl space-y-8">
                    <Div className="flex flex-col">
                        <Label variant={EVariantLabel.h3} color="text-gray-900">
                            {t('welcome')}
                        </Label>
                        <Label variant={EVariantLabel.bodyLarge} color="text-gray-600" className="mt-2">
                            {t('welcomeBody')}
                        </Label>
                    </Div>

                    <Div className="space-y-4">
                        <SectionHeader
                            icon={IconComponentsEnum.calendar}
                            title={t('reservationsSection')}
                            href={Routes.Reservations.index}
                            viewAllLabel={t('viewAll')}
                        />

                        <Div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {reservationCards.map((card) => (
                                <Div key={card.key}>
                                    <StatCard
                                        icon={card.icon}
                                        iconBg={card.iconBg}
                                        iconColor={card.iconColor}
                                        label={isLoading ? '—' : card.label}
                                        value={isLoading ? '—' : card.value}
                                    />
                                </Div>
                            ))}
                        </Div>

                        <ChartPanel title={t('reservationTrendTitle')}>
                            {hasReservationTrend ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <ComposedChart
                                        data={reservationTrendData}
                                        margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                                    >
                                        <CartesianGrid vertical={false} stroke={colors.gray[100]} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 12, fill: colors.gray[500] }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12, fill: colors.gray[500] }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={40}
                                        />
                                        <Tooltip
                                            content={ChartTooltip}
                                            cursor={{ fill: colors.primary[25] }}
                                            formatter={(value) => formatMoney(value as number)}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            name={t('chartRevenue')}
                                            fill={colors.primary[300]}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={32}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="paidRevenue"
                                            name={t('chartPaidRevenue')}
                                            stroke={colors.accent[500]}
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: colors.accent[500], strokeWidth: 0 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChartState label={tCommon('empty')} />
                            )}
                        </ChartPanel>

                        <ChartPanel title={t('trendTitle')}>
                            {hasReservationTrend ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <ComposedChart
                                        data={reservationTrendData}
                                        margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                                    >
                                        <CartesianGrid vertical={false} stroke={colors.gray[100]} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 12, fill: colors.gray[500] }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 12, fill: colors.gray[500] }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={30}
                                        />
                                        <Tooltip content={ChartTooltip} cursor={{ fill: colors.primary[25] }} />
                                        <Bar
                                            dataKey="count"
                                            name={t('chartReservations')}
                                            fill={colors.primary[400]}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={28}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChartState label={tCommon('empty')} />
                            )}
                        </ChartPanel>

                        <ChartPanel title={t('topRoomsTitle')}>
                            <TopRoomsList
                                rooms={data?.topRooms ?? []}
                                emptyLabel={t('noRoomsConfigured')}
                                roomLabel={t('roomRevenueRoom')}
                                monthLabel={t('roomRevenueMonth')}
                                totalLabel={t('roomRevenueTotal')}
                            />
                        </ChartPanel>
                    </Div>

                    <Div className="space-y-4">
                        <SectionHeader
                            icon={IconComponentsEnum.layers}
                            title={t('incomeSection')}
                            href={Routes.DailyIncome.index}
                            viewAllLabel={t('viewAll')}
                        />

                        <Div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {incomeCards.map((card) => (
                                <Div key={card.key}>
                                    <StatCard
                                        icon={card.icon}
                                        iconBg={card.iconBg}
                                        iconColor={card.iconColor}
                                        label={incomeSummaryLoading ? '—' : card.label}
                                        value={incomeSummaryLoading ? '—' : card.value}
                                    />
                                </Div>
                            ))}
                        </Div>

                        <ChartPanel title={t('incomeTrendTitle')}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <ComposedChart data={incomeTrendData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                                        <CartesianGrid vertical={false} stroke={colors.gray[100]} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 12, fill: colors.gray[500] }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12, fill: colors.gray[500] }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={40}
                                        />
                                        <Tooltip
                                            content={ChartTooltip}
                                            cursor={{ fill: colors.primary[25] }}
                                            formatter={(value) => formatMoney(value as number)}
                                        />
                                        <Bar
                                            dataKey="income"
                                            name={t('chartIncome')}
                                            fill={colors.primary[300]}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={32}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="netBalance"
                                            name={t('chartNetBalance')}
                                            stroke={colors.accent[500]}
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: colors.accent[500], strokeWidth: 0 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                        </ChartPanel>
                    </Div>
                </Div>
            }
        />
    );
}
