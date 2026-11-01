'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
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
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Badge from '@/components/Primitives/Badge/Badge';
import { EBadgeSize, EBadgeType, EVariantLabel } from '@/Enum/Enum';
import { formatMoney, type DashboardMonthDayPoint } from '@/lib/reservation-api';
import colors from '@/theme/colors';
import { formatMonthLabel } from './ReportPanels';

interface ReservationDailyMonthChartProps {
    year: number;
    month: number;
    days?: DashboardMonthDayPoint[];
    isLoading?: boolean;
}

const LIGHT_THEME_COLORS = {
    grid: colors.gray[100],
    tick: colors.gray[500],
    revenueBar: '#4F46E5', // indigo-600
    paidLine: '#10B981', // emerald-500
};

const DARK_THEME_COLORS = {
    grid: 'oklch(0.3389 0.0301 270.4)',
    tick: 'oklch(0.6486 0.0275 268.6)',
    revenueBar: '#6366F1', // indigo-500
    paidLine: '#34D399', // emerald-400
};

export default function ReservationDailyMonthChart({
    year,
    month,
    days,
    isLoading = false,
}: Readonly<ReservationDailyMonthChartProps>) {
    const tReports = useTranslations('reports');
    const tDashboard = useTranslations('dashboard');
    const locale = useLocale();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const chartColors = isDark ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

    const periodLabel = useMemo(
        () => formatMonthLabel(year, month, locale),
        [year, month, locale],
    );

    const fullDateFormatter = useMemo(() => {
        const localeTag = locale === 'ar' ? 'ar-TN' : locale === 'en' ? 'en-US' : 'fr-FR';
        return new Intl.DateTimeFormat(localeTag, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, [locale]);

    const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

    const chartData = useMemo(() => {
        const sourceDays = days && days.length > 0 ? days : [];
        const dayMap = new Map<number, DashboardMonthDayPoint>();
        for (const d of sourceDays) {
            dayMap.set(d.day, d);
        }

        return Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const existing = dayMap.get(dayNum);
            const dateObj = new Date(year, month - 1, dayNum);
            const formattedDate = fullDateFormatter.format(dateObj);
            const capitalizedDate =
                formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

            return {
                day: dayNum,
                dayFormatted: String(dayNum).padStart(2, '0'),
                fullDateLabel: capitalizedDate,
                count: existing?.count ?? 0,
                revenue: existing?.revenue ?? 0,
                paidRevenue: existing?.paidRevenue ?? 0,
                unpaidRevenue: Math.max(0, (existing?.revenue ?? 0) - (existing?.paidRevenue ?? 0)),
            };
        });
    }, [days, daysInMonth, year, month, fullDateFormatter]);

    const { totalRevenue, totalPaid, totalCount, peakDay } = useMemo(() => {
        let rev = 0;
        let paid = 0;
        let count = 0;
        let peak = { day: 1, revenue: 0 };

        for (const d of chartData) {
            rev += d.revenue;
            paid += d.paidRevenue;
            count += d.count;
            if (d.revenue > peak.revenue) {
                peak = { day: d.day, revenue: d.revenue };
            }
        }

        return {
            totalRevenue: Math.round(rev * 100) / 100,
            totalPaid: Math.round(paid * 100) / 100,
            totalCount: count,
            peakDay: peak,
        };
    }, [chartData]);

    const CustomTooltip = ({ active, payload }: TooltipContentProps) => {
        if (!active || !payload?.length) return null;
        const dataPoint = payload[0]?.payload as (typeof chartData)[number] | undefined;
        if (!dataPoint) return null;

        return (
            <Div className="min-w-60 rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <Label
                    variant={EVariantLabel.caption}
                    color="text-gray-900"
                    className="mb-2 block border-b border-gray-100 pb-1.5 font-bold dark:border-gray-700 dark:text-gray-100"
                >
                    {dataPoint.fullDateLabel}
                </Label>
                <Div className="space-y-1.5 text-xs">
                    <Div className="flex items-center justify-between gap-4">
                        <Div className="flex items-center gap-1.5">
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: chartColors.revenueBar }}
                            />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {tDashboard('chartRevenue')}
                            </span>
                        </Div>
                        <span className="font-bold tabular-nums text-gray-900 dark:text-white">
                            {formatMoney(dataPoint.revenue)}
                        </span>
                    </Div>

                    <Div className="flex items-center justify-between gap-4">
                        <Div className="flex items-center gap-1.5">
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: chartColors.paidLine }}
                            />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {tDashboard('chartPaidRevenue')}
                            </span>
                        </Div>
                        <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatMoney(dataPoint.paidRevenue)}
                        </span>
                    </Div>

                    {dataPoint.unpaidRevenue > 0 && (
                        <Div className="flex items-center justify-between gap-4">
                            <Div className="flex items-center gap-1.5">
                                <span className="size-2.5 shrink-0 rounded-full bg-amber-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {tDashboard('kpiUnpaidMonth')}
                                </span>
                            </Div>
                            <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                {formatMoney(dataPoint.unpaidRevenue)}
                            </span>
                        </Div>
                    )}

                    <Div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-1.5 dark:border-gray-700">
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                            {tDashboard('chartReservations')}
                        </span>
                        <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                            {dataPoint.count}
                        </span>
                    </Div>
                </Div>
            </Div>
        );
    };

    if (isLoading) {
        return (
            <Div className="h-80 w-full animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900" />
        );
    }

    return (
        <Div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            {/* Header: Title, Subtitle, Highlights & Legend */}
            <Div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Div>
                    <Div className="flex flex-wrap items-center gap-2">
                        <Label
                            variant={EVariantLabel.h4}
                            color="text-gray-900"
                            className="font-bold tracking-tight dark:text-gray-100"
                        >
                            {tReports('dailyChartTitle', { period: periodLabel })}
                        </Label>
                        {totalCount > 0 && (
                            <Badge
                                id="daily-chart-reservations-count"
                                text={`${totalCount} ${tDashboard('chartReservations').toLowerCase()}`}
                                type={EBadgeType.primary}
                                size={EBadgeSize.small}
                            />
                        )}
                        {peakDay.revenue > 0 && (
                            <Badge
                                id="daily-chart-peak-day"
                                text={`Pic : Jour ${peakDay.day} (${formatMoney(peakDay.revenue)})`}
                                type={EBadgeType.success}
                                size={EBadgeSize.small}
                            />
                        )}
                    </Div>
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="mt-1 block">
                        {tReports('dailyChartSubtitle')}
                    </Label>
                </Div>

                {/* Legend indicators */}
                <Div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                    <Div className="flex items-center gap-1.5">
                        <span
                            className="size-3 rounded-xs"
                            style={{ backgroundColor: chartColors.revenueBar }}
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                            {tDashboard('chartRevenue')}
                        </span>
                    </Div>
                    <Div className="flex items-center gap-1.5">
                        <span
                            className="h-1 w-3.5 rounded-full"
                            style={{ backgroundColor: chartColors.paidLine }}
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                            {tDashboard('chartPaidRevenue')}
                        </span>
                    </Div>
                </Div>
            </Div>

            {/* Chart Area */}
            <Div role="img" aria-label={`Graphique des recettes journalières de ${periodLabel}`}>
                <ResponsiveContainer width="100%" height={340}>
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 12, right: 12, left: -6, bottom: 4 }}
                    >
                        <CartesianGrid
                            vertical={false}
                            stroke={chartColors.grid}
                            strokeDasharray="3 3"
                        />
                        <XAxis
                            dataKey="dayFormatted"
                            tick={{ fontSize: 11, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val: number) => formatMoney(val)}
                            width={75}
                        />
                        <Tooltip content={CustomTooltip} />
                        <Bar
                            dataKey="revenue"
                            name={tDashboard('chartRevenue')}
                            fill={chartColors.revenueBar}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                        />
                        <Line
                            type="monotone"
                            dataKey="paidRevenue"
                            name={tDashboard('chartPaidRevenue')}
                            stroke={chartColors.paidLine}
                            strokeWidth={2.5}
                            dot={{
                                r: 2.5,
                                fill: chartColors.paidLine,
                                strokeWidth: 1,
                                stroke: isDark ? '#1F2937' : '#FFFFFF',
                            }}
                            activeDot={{ r: 5, fill: chartColors.paidLine }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </Div>

            {/* Hidden accessibility table for screen readers */}
            <table className="sr-only">
                <caption>{tReports('dailyChartTitle', { period: periodLabel })}</caption>
                <thead>
                    <tr>
                        <th scope="col">{tReports('period')}</th>
                        <th scope="col">{tDashboard('chartRevenue')}</th>
                        <th scope="col">{tDashboard('chartPaidRevenue')}</th>
                        <th scope="col">{tDashboard('chartReservations')}</th>
                    </tr>
                </thead>
                <tbody>
                    {chartData.map((d) => (
                        <tr key={d.day}>
                            <td>{d.fullDateLabel}</td>
                            <td>{d.revenue}</td>
                            <td>{d.paidRevenue}</td>
                            <td>{d.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Div>
    );
}
