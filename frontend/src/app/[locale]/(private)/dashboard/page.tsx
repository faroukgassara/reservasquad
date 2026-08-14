'use client';

import { useMemo, type Key, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Sector,
    Tooltip,
    XAxis,
    YAxis,
    type PieSectorShapeProps,
    type TooltipContentProps,
} from 'recharts';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import { EVariantLabel, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { fetchDashboardStats, formatMoney, type DashboardRoomBreakdown } from '@/lib/reservation-api';
import { fetchDailyIncomeSummary, fetchIncomeTrend } from '@/lib/daily-income-api';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import colors from '@/theme/colors';
import type { ELabelColor } from '@/theme/labelColors';

function formatDayShort(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatMonthLabel(year: number, month: number): string {
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
    });
}

function ColoredSector(props: Readonly<PieSectorShapeProps>) {
    const { key, payload, ...rest } = props as PieSectorShapeProps & { key?: Key };
    const color = (payload as { color?: string } | undefined)?.color ?? rest.fill;
    return <Sector key={key} {...rest} fill={color} />;
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

function LegendRow({
    entries,
    formatValue = String,
}: Readonly<{
    entries: { key: string; name: string; value: number; color: string }[];
    formatValue?: (value: number) => string;
}>) {
    return (
        <Div className="mt-3 flex flex-wrap items-center justify-center gap-4">
            {entries.map((entry) => (
                <Div key={entry.key} className="flex items-center gap-1.5">
                    <Div className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                    <Label variant={EVariantLabel.caption} color="text-gray-600">
                        {entry.name} ({formatValue(entry.value)})
                    </Label>
                </Div>
            ))}
        </Div>
    );
}

function TopRoomsList({
    rooms,
    emptyLabel,
}: Readonly<{ rooms: DashboardRoomBreakdown[]; emptyLabel: string }>) {
    if (rooms.length === 0) return <EmptyChartState label={emptyLabel} />;
    const max = Math.max(...rooms.map((room) => room.count), 1);
    return (
        <Div className="space-y-3.5">
            {rooms.map((room) => (
                <Div key={room.roomId}>
                    <Div className="mb-1 flex items-center justify-between gap-2">
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-700"
                            className="truncate font-medium"
                        >
                            {room.roomName}
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="shrink-0 tabular-nums">
                            {room.count} · {formatMoney(room.revenue)}
                        </Label>
                    </Div>
                    <Div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <Div
                            className="h-full rounded-full bg-primary-500"
                            style={{ width: `${Math.max((room.count / max) * 100, 6)}%` }}
                        />
                    </Div>
                </Div>
            ))}
        </Div>
    );
}

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const tRes = useTranslations('admin.reservations');
    const tStatus = useTranslations('status');
    const tIncome = useTranslations('admin.dailyIncome');
    const tCommon = useTranslations('common');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: fetchDashboardStats,
    });

    const { data: incomeSummary } = useQuery({
        queryKey: ['daily-income-summary', year, month],
        queryFn: () => fetchDailyIncomeSummary({ year, month }),
    });

    const { data: incomeTrend } = useQuery({
        queryKey: ['daily-income-trend', 6],
        queryFn: () => fetchIncomeTrend({ months: 6 }),
    });

    const dailyTrendData = useMemo(
        () =>
            (data?.dailyTrend ?? []).map((point) => ({
                ...point,
                label: formatDayShort(point.date),
            })),
        [data?.dailyTrend],
    );

    const statusData = useMemo(
        () => [
            {
                key: 'confirmed',
                name: tStatus('confirmed'),
                value: data?.month.confirmed ?? 0,
                color: colors.success[500],
            },
            {
                key: 'cancelled',
                name: tStatus('cancelled'),
                value: data?.month.cancelled ?? 0,
                color: colors.warning[500],
            },
        ],
        [data?.month.confirmed, data?.month.cancelled, tStatus],
    );

    const paymentData = useMemo(
        () => [
            { key: 'paid', name: tRes('paid'), value: data?.month.paid ?? 0, color: colors.success[500] },
            { key: 'unpaid', name: tRes('unpaid'), value: data?.month.unpaid ?? 0, color: colors.warning[500] },
        ],
        [data?.month.paid, data?.month.unpaid, tRes],
    );

    const hasReservationsThisMonth = (data?.month.total ?? 0) > 0;

    const incomeTrendData = useMemo(
        () =>
            (incomeTrend ?? []).map((point) => ({
                label: formatMonthLabel(point.year, point.month),
                income: point.totalIncome,
                netBalance: point.netBalance,
            })),
        [incomeTrend],
    );

    const incomeBreakdownData = useMemo(() => {
        if (!incomeSummary) return [];
        return [
            {
                key: 'charges',
                name: tIncome('totalCharges'),
                value: incomeSummary.totalCharges,
                color: colors.warning[500],
            },
            {
                key: 'investments',
                name: tIncome('totalInvestments'),
                value: incomeSummary.totalInvestments,
                color: colors.primary[400],
            },
            {
                key: 'net',
                name: tIncome('netBalance'),
                value: Math.max(incomeSummary.netBalance, 0),
                color: colors.success[500],
            },
        ].filter((entry) => entry.value > 0);
    }, [incomeSummary, tIncome]);

    const hasIncomeThisMonth = (incomeSummary?.totalIncome ?? 0) > 0;

    const reservationCards: {
        key: string;
        icon: IconComponentsEnum;
        iconBg: string;
        iconColor: ELabelColor;
        label: string;
        value: string;
    }[] = [
        {
            key: 'today',
            icon: IconComponentsEnum.clock,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: t('kpiToday'),
            value: String(data?.todayReservations ?? 0),
        },
        {
            key: 'month',
            icon: IconComponentsEnum.calendar,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: t('kpiMonthTotal'),
            value: String(data?.month.total ?? 0),
        },
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
            value: String(data?.month.paid ?? 0),
        },
    ];

    const incomeCards = [
        { key: 'income', icon: IconComponentsEnum.layers, label: tIncome('totalIncome'), value: incomeSummary?.totalIncome ?? 0 },
        { key: 'charges', icon: IconComponentsEnum.alert, label: tIncome('totalCharges'), value: incomeSummary?.totalCharges ?? 0 },
        { key: 'investments', icon: IconComponentsEnum.star, label: tIncome('totalInvestments'), value: incomeSummary?.totalInvestments ?? 0 },
        { key: 'savings', icon: IconComponentsEnum.checkCircle, label: tIncome('totalSavings'), value: incomeSummary?.totalSavings ?? 0 },
        { key: 'net', icon: IconComponentsEnum.home, label: tIncome('netBalance'), value: incomeSummary?.netBalance ?? 0 },
    ];

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

                        <Div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {reservationCards.map((card) => {
                                const cardNode = (
                                    <StatCard
                                        icon={card.icon}
                                        iconBg={card.iconBg}
                                        iconColor={card.iconColor}
                                        label={isLoading ? '—' : card.label}
                                        value={isLoading ? '—' : card.value}
                                    />
                                );
                                if (card.key === 'today') {
                                    return (
                                        <Link key={card.key} href={Routes.Today} className="block">
                                            {cardNode}
                                        </Link>
                                    );
                                }
                                return (
                                    <Div key={card.key}>{cardNode}</Div>
                                );
                            })}
                        </Div>

                        <Div className="grid gap-4 lg:grid-cols-3">
                            <ChartPanel title={t('trendTitle')} className="lg:col-span-2">
                                <ResponsiveContainer width="100%" height={260}>
                                    <ComposedChart data={dailyTrendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
                            </ChartPanel>

                            <ChartPanel title={t('statusTitle')}>
                                {hasReservationsThisMonth ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={55}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    strokeWidth={0}
                                                    shape={ColoredSector}
                                                />
                                                <Tooltip content={ChartTooltip} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <LegendRow entries={statusData} />
                                    </>
                                ) : (
                                    <EmptyChartState label={tCommon('empty')} />
                                )}
                            </ChartPanel>
                        </Div>

                        <Div className="grid gap-4 lg:grid-cols-2">
                            <ChartPanel title={t('paymentTitle')}>
                                {hasReservationsThisMonth ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={paymentData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={55}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    strokeWidth={0}
                                                    shape={ColoredSector}
                                                />
                                                <Tooltip content={ChartTooltip} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <LegendRow entries={paymentData} />
                                    </>
                                ) : (
                                    <EmptyChartState label={tCommon('empty')} />
                                )}
                            </ChartPanel>

                            <ChartPanel title={t('topRoomsTitle')}>
                                <TopRoomsList rooms={data?.topRooms ?? []} emptyLabel={t('noRooms')} />
                            </ChartPanel>
                        </Div>
                    </Div>

                    <Div className="space-y-4">
                        <SectionHeader
                            icon={IconComponentsEnum.layers}
                            title={t('incomeSection')}
                            href={Routes.DailyIncome.index}
                            viewAllLabel={t('viewAll')}
                        />

                        <Div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {incomeCards.map((card) => (
                                <StatCard
                                    key={card.key}
                                    icon={card.icon}
                                    iconBg="bg-primary-50"
                                    iconColor="text-primary-600"
                                    label={card.label}
                                    value={formatMoney(card.value)}
                                />
                            ))}
                        </Div>

                        <Div className="grid gap-4 lg:grid-cols-3">
                            <ChartPanel title={t('incomeTrendTitle')} className="lg:col-span-2">
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

                            <ChartPanel title={t('incomeBreakdownTitle')}>
                                {hasIncomeThisMonth && incomeBreakdownData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={incomeBreakdownData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={55}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    strokeWidth={0}
                                                    shape={ColoredSector}
                                                />
                                                <Tooltip
                                                    content={ChartTooltip}
                                                    formatter={(value) => formatMoney(value as number)}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <LegendRow entries={incomeBreakdownData} formatValue={formatMoney} />
                                    </>
                                ) : (
                                    <EmptyChartState label={tCommon('empty')} />
                                )}
                            </ChartPanel>
                        </Div>
                    </Div>
                </Div>
            }
        />
    );
}
