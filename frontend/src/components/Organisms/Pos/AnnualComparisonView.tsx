'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps,
} from 'recharts';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Badge from '@/components/Primitives/Badge/Badge';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { EBadgeSize, EBadgeType, ESize, EVariantLabel } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import colors from '@/theme/colors';
import type { MonthlySalesTrendItem } from '@/lib/analytics-api';

export type ComparisonMetric = 'revenue' | 'units' | 'orders';
export type ComparisonChartType = 'lines' | 'bars';
export type ComparisonViewMode = 'table' | 'cards';

interface AnnualComparisonViewProps {
    data: MonthlySalesTrendItem[];
    isLoading?: boolean;
    categoryName?: string;
}



const PALETTE = [
    { color: '#64748B', bg: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400' },
    { color: '#2563EB', bg: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400' },
    { color: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
    { color: '#D97706', bg: 'bg-amber-600', text: 'text-amber-600 dark:text-amber-400' },
    { color: '#7C3AED', bg: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400' },
    { color: '#E11D48', bg: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400' },
];

function getYearStyle(index: number, total: number) {
    if (total <= 1) {
        return { color: '#E11D48', bg: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400' };
    }
    // If multiple years, assign from palette with latest year having prominent rose
    if (index === total - 1) {
        return { color: '#E11D48', bg: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400' };
    }
    if (index === total - 2) {
        return { color: '#2563EB', bg: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400' };
    }
    const idx = index % PALETTE.length;
    return PALETTE[idx];
}

function round1(v: number): number {
    return Math.round(v * 10) / 10;
}

export default function AnnualComparisonView({
    data,
    isLoading = false,
    categoryName,
}: Readonly<AnnualComparisonViewProps>) {
    const t = useTranslations('pos.analytics');
    const locale = useLocale();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const { monthNamesFull, monthNamesShort } = useMemo(() => {
        const fullFormatter = new Intl.DateTimeFormat(locale, { month: 'long' });
        const shortFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
        const full: string[] = [];
        const short: string[] = [];
        for (let m = 0; m < 12; m++) {
            const d = new Date(2024, m, 15);
            const f = fullFormatter.format(d);
            const s = shortFormatter.format(d);
            full.push(f.charAt(0).toUpperCase() + f.slice(1));
            short.push(s.charAt(0).toUpperCase() + s.slice(1));
        }
        return { monthNamesFull: full, monthNamesShort: short };
    }, [locale]);

    const [metric, setMetric] = useState<ComparisonMetric>('revenue');
    const [chartType, setChartType] = useState<ComparisonChartType>('lines');
    const [viewMode, setViewMode] = useState<ComparisonViewMode>('table');

    // 1. Dynamic Year Detection
    const { years, dataByYearMonth } = useMemo(() => {
        const yearSet = new Set<number>();
        const map = new Map<number, Map<number, MonthlySalesTrendItem>>();

        for (const item of data) {
            const [yearStr, monthStr] = item.month.split('-');
            const year = Number(yearStr);
            const monthIdx = Number(monthStr) - 1; // 0-11

            if (!Number.isNaN(year) && monthIdx >= 0 && monthIdx < 12) {
                yearSet.add(year);
                if (!map.has(year)) {
                    map.set(year, new Map());
                }
                map.get(year)!.set(monthIdx, item);
            }
        }

        const sortedYears = Array.from(yearSet).sort((a, b) => a - b);
        return { years: sortedYears, dataByYearMonth: map };
    }, [data]);

    const latestYear = years.length > 0 ? years[years.length - 1] : new Date().getFullYear();
    const prevYear = years.length >= 2 ? years[years.length - 2] : null;

    // Helper to get raw value
    const getMetricValue = (
        year: number,
        monthIdx: number,
        selectedMetric: ComparisonMetric,
    ): number | null => {
        const item = dataByYearMonth.get(year)?.get(monthIdx);
        if (!item) return null;
        if (selectedMetric === 'revenue') return item.totalRevenue;
        if (selectedMetric === 'units') return item.unitsSold;
        return item.ordersCount;
    };

    // Formatter
    const formatValue = (val: number | null, selectedMetric: ComparisonMetric): string => {
        if (val === null || val === undefined) return '—';
        if (selectedMetric === 'revenue') return formatMoney(val);
        if (selectedMetric === 'units') return `${Math.round(val * 10) / 10} ${t('unitAbbr')}`;
        return `${val} ${t('ordersAbbr')}`;
    };

    // 2. Chart Dataset preparation
    const chartData = useMemo(() => {
        return monthNamesShort.map((shortName, monthIdx) => {
            const row: Record<string, string | number | undefined> = {
                month: shortName,
                monthFull: monthNamesFull[monthIdx],
            };

            for (const yr of years) {
                const val = getMetricValue(yr, monthIdx, metric);
                if (val !== null) {
                    row[String(yr)] = val;
                }
            }
            return row;
        });
    }, [years, dataByYearMonth, metric, monthNamesShort, monthNamesFull]);

    // 3. High-level KPI calculation
    const summaryStats = useMemo(() => {
        let latestTotal = 0;
        let prevTotal = 0;
        let latestMonthsCount = 0;
        let bestMonth = { name: '—', val: 0 };
        let highestGrowth = { name: '—', pct: -Infinity };

        for (let m = 0; m < 12; m++) {
            const latVal = getMetricValue(latestYear, m, metric);
            const prvVal = prevYear ? getMetricValue(prevYear, m, metric) : null;

            if (latVal !== null) {
                latestTotal += latVal;
                latestMonthsCount += 1;
                if (latVal > bestMonth.val) {
                    bestMonth = { name: monthNamesFull[m], val: latVal };
                }
            }

            if (prvVal !== null) {
                prevTotal += prvVal;
            }

            if (latVal !== null && prvVal !== null && prvVal > 0) {
                const growth = ((latVal - prvVal) / prvVal) * 100;
                if (growth > highestGrowth.pct) {
                    highestGrowth = { name: monthNamesFull[m], pct: growth };
                }
            }
        }

        const yoyTotalPct =
            prevTotal > 0
                ? round1(((latestTotal - prevTotal) / prevTotal) * 100)
                : null;
        const latestAvg = latestMonthsCount > 0 ? latestTotal / latestMonthsCount : 0;

        return {
            latestTotal,
            prevTotal,
            yoyTotalPct,
            latestAvg,
            bestMonth,
            highestGrowth: highestGrowth.pct !== -Infinity ? highestGrowth : null,
        };
    }, [years, latestYear, prevYear, metric, dataByYearMonth, monthNamesFull]);

    // Custom Tooltip for Chart
    const CustomComparisonTooltip = ({ active, payload, label }: TooltipContentProps) => {
        if (!active || !payload?.length) return null;

        const monthRow = chartData.find((r) => r.month === label);
        const fullTitle = monthRow ? String(monthRow.monthFull) : String(label);

        return (
            <Div className="min-w-56 rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <Label
                    variant={EVariantLabel.caption}
                    color="text-gray-900"
                    className="mb-2 block border-b border-gray-100 pb-1.5 font-bold dark:border-gray-700 dark:text-gray-100"
                >
                    {fullTitle}
                </Label>
                <Div className="space-y-1.5">
                    {payload.map((entry) => {
                        const yr = String(entry.dataKey);
                        const val = Number(entry.value);

                        return (
                            <Div key={yr} className="flex items-center justify-between gap-4 text-xs">
                                <Div className="flex items-center gap-2">
                                    <span
                                        className="size-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {yr}
                                    </span>
                                </Div>
                                <span className="font-bold tabular-nums text-gray-900 dark:text-white">
                                    {formatValue(val, metric)}
                                </span>
                            </Div>
                        );
                    })}
                </Div>
            </Div>
        );
    };

    if (isLoading) {
        return (
            <Div className="flex justify-center py-20">
                <Spinner size={ESize.lg} color="text-primary-500" />
            </Div>
        );
    }

    if (years.length === 0) {
        return (
            <Div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/40">
                <Label variant={EVariantLabel.body} color="text-gray-400">
                    {t('noDataAvailable')}
                </Label>
            </Div>
        );
    }

    return (
        <Div className="space-y-6">
            {/* 1. Header with Title, Category Badge & Controls */}
            <Div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                <Div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <Div>
                        <Div className="flex flex-wrap items-center gap-2">
                            <Label
                                variant={EVariantLabel.h4}
                                color="text-gray-900"
                                className="font-bold tracking-tight dark:text-gray-100"
                            >
                                {t('annualComparisonTitle')}
                            </Label>
                            {categoryName && (
                                <Badge
                                    id="comparison-cat-badge"
                                    text={categoryName}
                                    type={EBadgeType.primary}
                                    size={EBadgeSize.small}
                                />
                            )}
                        </Div>
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="mt-0.5">
                            {t('annualComparisonSubtitle')} ({years.join(' · ')})
                        </Label>
                    </Div>

                    {/* Metric Selector & Chart Type Controls */}
                    <Div className="flex flex-wrap items-center gap-2.5">
                        {/* Metric segmented pill */}
                        <Div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                            <button
                                type="button"
                                id="metric-revenue-btn"
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                    metric === 'revenue'
                                        ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                                onClick={() => setMetric('revenue')}
                            >
                                {t('metricRevenue')}
                            </button>
                            <button
                                type="button"
                                id="metric-units-btn"
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                    metric === 'units'
                                        ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                                onClick={() => setMetric('units')}
                            >
                                {t('metricUnits')}
                            </button>
                            <button
                                type="button"
                                id="metric-orders-btn"
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                    metric === 'orders'
                                        ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                                onClick={() => setMetric('orders')}
                            >
                                {t('metricOrders')}
                            </button>
                        </Div>

                        {/* Chart style toggle (Lines vs Bars) */}
                        <Div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                            <button
                                type="button"
                                id="chart-type-lines"
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                    chartType === 'lines'
                                        ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                                onClick={() => setChartType('lines')}
                            >
                                {t('chartTypeLines')}
                            </button>
                            <button
                                type="button"
                                id="chart-type-bars"
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                    chartType === 'bars'
                                        ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                                onClick={() => setChartType('bars')}
                            >
                                {t('chartTypeBars')}
                            </button>
                        </Div>

                        {/* View Mode toggle (Table vs Cards) */}
                        <Div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                            <button
                                type="button"
                                id="view-mode-table"
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('table')}
                            >
                                {t('tableView')}
                            </button>
                            <button
                                type="button"
                                id="view-mode-cards"
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                    viewMode === 'cards'
                                        ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('cards')}
                            >
                                {t('cardsView')}
                            </button>
                        </Div>
                    </Div>
                </Div>
            </Div>

            {/* 2. Top Summary KPI Cards */}
            <Div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Latest Year */}
                <Div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
                    <Div className="flex items-center justify-between">
                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                            {t('annualTotal')} ({latestYear})
                        </Label>
                        {summaryStats.yoyTotalPct !== null && (
                            <span
                                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                                    summaryStats.yoyTotalPct >= 0
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                            >
                                {summaryStats.yoyTotalPct >= 0 ? '↑' : '↓'}{' '}
                                {summaryStats.yoyTotalPct > 0 ? '+' : ''}
                                {summaryStats.yoyTotalPct}%
                            </span>
                        )}
                    </Div>
                    <Label
                        variant={EVariantLabel.h3}
                        color="text-gray-900"
                        className="mt-2 block font-extrabold tracking-tight dark:text-white"
                    >
                        {formatValue(summaryStats.latestTotal, metric)}
                    </Label>
                    {prevYear && (
                        <Label variant={EVariantLabel.caption} color="text-gray-400" className="mt-1 block">
                            vs {formatValue(summaryStats.prevTotal, metric)} ({prevYear})
                        </Label>
                    )}
                </Div>

                {/* Monthly Average */}
                <Div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('monthlyAverage')} ({latestYear})
                    </Label>
                    <Label
                        variant={EVariantLabel.h3}
                        color="text-gray-900"
                        className="mt-2 block font-extrabold tracking-tight dark:text-white"
                    >
                        {formatValue(summaryStats.latestAvg, metric)}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-400" className="mt-1 block">
                        Calculée sur les mois actifs
                    </Label>
                </Div>

                {/* Best Month */}
                <Div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('bestMonth')} ({latestYear})
                    </Label>
                    <Label
                        variant={EVariantLabel.h3}
                        color="text-gray-900"
                        className="mt-2 block truncate font-extrabold tracking-tight dark:text-white"
                    >
                        {summaryStats.bestMonth.name}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-400" className="mt-1 block">
                        Record : {formatValue(summaryStats.bestMonth.val, metric)}
                    </Label>
                </Div>

                {/* Highest YoY Growth */}
                <Div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('highestGrowth')} YoY
                    </Label>
                    <Label
                        variant={EVariantLabel.h3}
                        color="text-gray-900"
                        className="mt-2 block truncate font-extrabold tracking-tight dark:text-white"
                    >
                        {summaryStats.highestGrowth ? summaryStats.highestGrowth.name : '—'}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-success-600" className="mt-1 block font-semibold dark:text-emerald-400">
                        {summaryStats.highestGrowth
                            ? `+${round1(summaryStats.highestGrowth.pct)}% vs ${prevYear}`
                            : 'Comparatif indisponible'}
                    </Label>
                </Div>
            </Div>

            {/* 3. Top Trend Chart: 12 Calendar Months with distinct Colored Series per Year */}
            <Div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <Div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <Div>
                        <Label variant={EVariantLabel.h5} color="text-gray-900" className="font-semibold dark:text-gray-100">
                            Comparaison mensuelle ({years.join(' vs ')})
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-400">
                            Évolution du {metric === 'revenue' ? "chiffre d'affaires" : metric === 'units' ? 'volume' : 'nombre de commandes'} de Janvier à Décembre
                        </Label>
                    </Div>

                    {/* Legend badges */}
                    <Div className="flex flex-wrap items-center gap-3">
                        {years.map((yr, idx) => {
                            const style = getYearStyle(idx, years.length);
                            return (
                                <Div key={yr} className="flex items-center gap-1.5 text-xs font-semibold">
                                    <span
                                        className="size-3 rounded-full"
                                        style={{ backgroundColor: style.color }}
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{yr}</span>
                                </Div>
                            );
                        })}
                    </Div>
                </Div>

                <Div role="img" aria-label="Graphique comparatif des ventes mensuelles">
                    <ResponsiveContainer width="100%" height={320}>
                        {chartType === 'lines' ? (
                            <LineChart data={chartData} margin={{ top: 12, right: 16, left: -6, bottom: 4 }}>
                                <CartesianGrid
                                    vertical={false}
                                    stroke={isDark ? 'oklch(0.3389 0.0301 270.4)' : colors.gray[100]}
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12, fill: isDark ? 'oklch(0.6486 0.0275 268.6)' : colors.gray[500] }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: isDark ? 'oklch(0.6486 0.0275 268.6)' : colors.gray[500] }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val: number) =>
                                        metric === 'revenue'
                                            ? `${val >= 1000 ? `${round1(val / 1000)}k` : val} DT`
                                            : `${val}`
                                    }
                                    width={55}
                                />
                                <Tooltip content={CustomComparisonTooltip} />
                                {years.map((yr, idx) => {
                                    const style = getYearStyle(idx, years.length);
                                    const isLatest = idx === years.length - 1;

                                    return (
                                        <Line
                                            key={yr}
                                            type="monotone"
                                            dataKey={String(yr)}
                                            name={String(yr)}
                                            stroke={style.color}
                                            strokeWidth={isLatest ? 3 : 2}
                                            strokeDasharray={!isLatest && years.length > 2 ? '4 4' : undefined}
                                            dot={{
                                                r: isLatest ? 3.5 : 2.5,
                                                fill: style.color,
                                                strokeWidth: 0,
                                            }}
                                            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                                            connectNulls
                                        />
                                    );
                                })}
                            </LineChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 12, right: 16, left: -6, bottom: 4 }}>
                                <CartesianGrid
                                    vertical={false}
                                    stroke={isDark ? 'oklch(0.3389 0.0301 270.4)' : colors.gray[100]}
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12, fill: isDark ? 'oklch(0.6486 0.0275 268.6)' : colors.gray[500] }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: isDark ? 'oklch(0.6486 0.0275 268.6)' : colors.gray[500] }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val: number) =>
                                        metric === 'revenue'
                                            ? `${val >= 1000 ? `${round1(val / 1000)}k` : val} DT`
                                            : `${val}`
                                    }
                                    width={55}
                                />
                                <Tooltip content={CustomComparisonTooltip} />
                                {years.map((yr, idx) => {
                                    const style = getYearStyle(idx, years.length);
                                    return (
                                        <Bar
                                            key={yr}
                                            dataKey={String(yr)}
                                            name={String(yr)}
                                            fill={style.color}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={28}
                                        />
                                    );
                                })}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </Div>
            </Div>

            {/* 4. Data View: Table or Monthly Cards Grid */}
            {viewMode === 'table' ? (
                <Div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs dark:border-gray-800 dark:bg-gray-900">
                    <Div className="border-b border-gray-100 p-5 dark:border-gray-800">
                        <Label variant={EVariantLabel.h5} color="text-gray-900" className="font-semibold dark:text-gray-100">
                            Tableau comparatif mensuel
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                            {prevYear
                                ? `Comparaison détaillée et croissance annuelle (${latestYear} vs ${prevYear})`
                                : `Détail par mois pour l'année ${latestYear}`}
                        </Label>
                    </Div>

                    <Div className="overflow-x-auto">
                        <table className="w-full text-start text-xs sm:text-sm">
                            <thead className="border-b border-gray-100 bg-gray-50/70 text-gray-600 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
                                <tr>
                                    <th className="px-5 py-3 text-start font-semibold">{t('month')}</th>
                                    {years.map((yr, idx) => {
                                        const isLatest = idx === years.length - 1;
                                        const style = getYearStyle(idx, years.length);

                                        return (
                                            <th key={yr} className="px-5 py-3 text-end font-semibold">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span
                                                        className="size-2 rounded-full"
                                                        style={{ backgroundColor: style.color }}
                                                    />
                                                    <span className={isLatest ? 'font-bold text-gray-900 dark:text-white' : ''}>
                                                        {yr}
                                                    </span>
                                                </span>
                                            </th>
                                        );
                                    })}
                                    {prevYear && (
                                        <th className="px-5 py-3 text-end font-semibold">
                                            {t('yoyGrowth')} ({latestYear}/{prevYear})
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700 dark:divide-gray-800 dark:text-gray-300">
                                {monthNamesFull.map((mName, mIdx) => {
                                    const latestVal = getMetricValue(latestYear, mIdx, metric);
                                    const prevVal = prevYear ? getMetricValue(prevYear, mIdx, metric) : null;

                                    let growthPct: number | null = null;
                                    if (latestVal !== null && prevVal !== null) {
                                        if (prevVal > 0) {
                                            growthPct = round1(((latestVal - prevVal) / prevVal) * 100);
                                        } else if (latestVal > 0) {
                                            growthPct = 100;
                                        } else {
                                            growthPct = 0;
                                        }
                                    }

                                    const isBestMonth =
                                        latestVal !== null &&
                                        summaryStats.bestMonth.val > 0 &&
                                        latestVal === summaryStats.bestMonth.val;

                                    return (
                                        <tr
                                            key={mName}
                                            className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                                        >
                                            <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                                                <Div className="flex items-center gap-2">
                                                    <span>{mName}</span>
                                                    {isBestMonth && (
                                                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-2xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                                            ★ {t('recordBadge')}
                                                        </span>
                                                    )}
                                                </Div>
                                            </td>

                                            {years.map((yr, idx) => {
                                                const val = getMetricValue(yr, mIdx, metric);
                                                const isLatest = idx === years.length - 1;

                                                return (
                                                    <td
                                                        key={yr}
                                                        className={`px-5 py-3.5 text-end tabular-nums ${
                                                            isLatest
                                                                ? 'font-bold text-gray-900 dark:text-white'
                                                                : 'text-gray-600 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {formatValue(val, metric)}
                                                    </td>
                                                );
                                            })}

                                            {prevYear && (
                                                <td className="px-5 py-3.5 text-end">
                                                    {growthPct !== null ? (
                                                        <span
                                                            className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                                growthPct > 0
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : growthPct < 0
                                                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}
                                                        >
                                                            {growthPct > 0 ? '↑ +' : growthPct < 0 ? '↓ ' : ''}
                                                            {growthPct}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="border-t-2 border-gray-200 bg-gray-50/80 font-bold dark:border-gray-700 dark:bg-gray-800/60">
                                <tr>
                                    <td className="px-5 py-4 text-gray-900 dark:text-white">
                                        {t('annualTotal')}
                                    </td>
                                    {years.map((yr, idx) => {
                                        let yrTotal = 0;
                                        for (let m = 0; m < 12; m++) {
                                            yrTotal += getMetricValue(yr, m, metric) ?? 0;
                                        }
                                        const isLatest = idx === years.length - 1;

                                        return (
                                            <td
                                                key={yr}
                                                className={`px-5 py-4 text-end tabular-nums ${
                                                    isLatest
                                                        ? 'text-base font-extrabold text-primary-950 dark:text-primary-300'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {formatValue(yrTotal, metric)}
                                            </td>
                                        );
                                    })}
                                    {prevYear && (
                                        <td className="px-5 py-4 text-end">
                                            {summaryStats.yoyTotalPct !== null ? (
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
                                                        summaryStats.yoyTotalPct >= 0
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                                    }`}
                                                >
                                                    {summaryStats.yoyTotalPct >= 0 ? '↑ +' : '↓ '}
                                                    {summaryStats.yoyTotalPct}%
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            </tfoot>
                        </table>
                    </Div>
                </Div>
            ) : (
                /* Cards Grid View */
                <Div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {monthNamesFull.map((mName, mIdx) => {
                        const latestVal = getMetricValue(latestYear, mIdx, metric);
                        const prevVal = prevYear ? getMetricValue(prevYear, mIdx, metric) : null;

                        let growthPct: number | null = null;
                        if (latestVal !== null && prevVal !== null) {
                            if (prevVal > 0) {
                                growthPct = round1(((latestVal - prevVal) / prevVal) * 100);
                            } else if (latestVal > 0) {
                                growthPct = 100;
                            } else {
                                growthPct = 0;
                            }
                        }

                        return (
                            <Div
                                key={mName}
                                className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs transition-all hover:border-gray-200 hover:shadow-xs dark:border-gray-800 dark:bg-gray-900"
                            >
                                <Div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                                    <Label variant={EVariantLabel.body} color="text-gray-900" className="font-bold dark:text-white">
                                        {mName}
                                    </Label>
                                    {growthPct !== null ? (
                                        <span
                                            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-2xs font-bold ${
                                                growthPct > 0
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : growthPct < 0
                                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}
                                        >
                                            {growthPct > 0 ? '↑ +' : growthPct < 0 ? '↓ ' : ''}
                                            {growthPct}%
                                        </span>
                                    ) : (
                                        <span className="text-2xs text-gray-400">—</span>
                                    )}
                                </Div>

                                <Div className="mt-3 space-y-2">
                                    {years.map((yr, idx) => {
                                        const val = getMetricValue(yr, mIdx, metric);
                                        const isLatest = idx === years.length - 1;
                                        const style = getYearStyle(idx, years.length);

                                        return (
                                            <Div
                                                key={yr}
                                                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                                                    isLatest
                                                        ? 'bg-primary-50/50 font-bold dark:bg-primary-950/30'
                                                        : 'bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:text-gray-300'
                                                }`}
                                            >
                                                <Div className="flex items-center gap-1.5">
                                                    <span
                                                        className="size-2 rounded-full"
                                                        style={{ backgroundColor: style.color }}
                                                    />
                                                    <span className={isLatest ? 'text-primary-950 dark:text-white' : ''}>
                                                        {yr}
                                                    </span>
                                                </Div>
                                                <span className="tabular-nums">
                                                    {formatValue(val, metric)}
                                                </span>
                                            </Div>
                                        );
                                    })}
                                </Div>
                            </Div>
                        );
                    })}
                </Div>
            )}
        </Div>
    );
}
