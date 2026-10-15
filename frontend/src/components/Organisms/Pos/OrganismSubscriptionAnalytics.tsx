'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import ProgressBar from '@/components/Primitives/ProgressBar/ProgressBar';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
    fetchPosProducts,
    fetchSubscriptionAnalytics,
    type SubscriptionTrendItem,
} from '@/lib/pos-api';
import { formatMoney } from '@/lib/daily-income-api';
import { Routes } from '@/lib/routes';
import colors from '@/theme/colors';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

export type SubscriptionTimeframePreset = '30d' | '90d' | 'ytd' | 'all' | 'custom';
type ChartViewMode = 'both' | 'revenue' | 'volume';

function formatIsoDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getPresetRange(preset: SubscriptionTimeframePreset): { startDate?: string; endDate?: string } {
    const now = new Date();
    const endStr = formatIsoDate(now);

    if (preset === '30d') {
        const past = new Date(now);
        past.setDate(past.getDate() - 30);
        return { startDate: formatIsoDate(past), endDate: endStr };
    }
    if (preset === '90d') {
        const past = new Date(now);
        past.setDate(past.getDate() - 90);
        return { startDate: formatIsoDate(past), endDate: endStr };
    }
    if (preset === 'ytd') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { startDate: formatIsoDate(yearStart), endDate: endStr };
    }
    return {};
}

const LIGHT_CHART_COLORS = {
    grid: colors.gray[100],
    tick: colors.gray[500],
    cursor: colors.primary[25],
    barPrimary: colors.primary[400],
    barHover: colors.primary[500],
    lineVolume: colors.accent[500],
    lineRenewals: colors.success[500],
};

const DARK_CHART_COLORS = {
    grid: 'oklch(0.3389 0.0301 270.4)',
    tick: 'oklch(0.6486 0.0275 268.6)',
    cursor: 'oklch(0.2855 0.0492 271.5)',
    barPrimary: 'oklch(0.5222 0.0821 273.5)',
    barHover: 'oklch(0.6011 0.0691 274)',
    lineVolume: 'oklch(0.6156 0.2193 27.4)',
    lineRenewals: 'oklch(0.6804 0.1652 154.88)',
};

function useChartColors() {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;
}

function SubscriptionChartTooltip({ active, payload, label }: Readonly<TooltipContentProps>) {
    if (!active || !payload?.length) return null;
    return (
        <Div className="rounded-xl border border-gray-200/80 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {label ? (
                <Label
                    variant={EVariantLabel.caption}
                    color="text-gray-900"
                    className="mb-1.5 block font-bold dark:text-gray-100"
                >
                    {label}
                </Label>
            ) : null}
            <Div className="space-y-1">
                {payload.map((entry) => {
                    const isRevenue = String(entry.dataKey) === 'revenue';
                    const displayValue = isRevenue
                        ? formatMoney(Number(entry.value))
                        : `${entry.value} abonnements`;

                    return (
                        <Div key={String(entry.dataKey)} className="flex items-center gap-2">
                            <Div
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <Label variant={EVariantLabel.caption} color="text-gray-600" className="dark:text-gray-300">
                                {entry.name}: <span className="font-semibold text-gray-900 dark:text-gray-100">{displayValue}</span>
                            </Label>
                        </Div>
                    );
                })}
            </Div>
        </Div>
    );
}

export default function OrganismSubscriptionAnalytics() {
    const t = useTranslations('pos.subscriptions');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const chartColors = useChartColors();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    const [preset, setPreset] = useState<SubscriptionTimeframePreset>('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [appliedCustom, setAppliedCustom] = useState<{ start?: string; end?: string }>({});
    const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
    const [chartMode, setChartMode] = useState<ChartViewMode>('both');

    // Fetch subscription products for plan filter dropdown
    const { data: productsData } = useQuery({
        queryKey: ['pos-subscription-products'],
        queryFn: () => fetchPosProducts({ subscription: true, perPage: 100 }),
        enabled: isAdmin,
    });

    const productOptions = [
        { value: 'ALL', label: t('allPlans') },
        ...(productsData?.data ?? []).map((p) => ({
            value: p.id,
            label: p.name,
        })),
    ];

    const effectiveDates =
        preset === 'custom'
            ? { startDate: appliedCustom.start, endDate: appliedCustom.end }
            : getPresetRange(preset);

    const interval = preset === '30d' ? 'day' : 'month';

    const { data, isLoading, isError, error } = useQuery({
        queryKey: [
            'subscription-analytics',
            effectiveDates.startDate,
            effectiveDates.endDate,
            selectedProductId,
            interval,
        ],
        queryFn: () =>
            fetchSubscriptionAnalytics({
                startDate: effectiveDates.startDate,
                endDate: effectiveDates.endDate,
                productId: selectedProductId === 'ALL' ? undefined : selectedProductId,
                interval,
            }),
        enabled: isAdmin,
    });

    if (!isAdmin) {
        return null;
    }

    const handlePresetChange = (newPreset: SubscriptionTimeframePreset) => {
        setPreset(newPreset);
        if (newPreset !== 'custom') {
            setAppliedCustom({});
        }
    };

    const handleApplyCustomDates = () => {
        if (!customStart && !customEnd) return;
        setAppliedCustom({
            start: customStart || undefined,
            end: customEnd || undefined,
        });
    };

    const summary = data?.summary;
    const trends = data?.trends ?? [];
    const planBreakdown = data?.planBreakdown ?? [];
    const topSubscribers = data?.topSubscribers ?? [];

    const getRankBadge = (rank: number) => {
        if (rank === 1) {
            return (
                <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 shadow-2xs dark:bg-amber-950/60 dark:text-amber-300">
                    🥇
                </span>
            );
        }
        if (rank === 2) {
            return (
                <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 shadow-2xs dark:bg-slate-800 dark:text-slate-300">
                    🥈
                </span>
            );
        }
        if (rank === 3) {
            return (
                <span className="flex size-7 items-center justify-center rounded-full bg-amber-50 font-bold text-amber-700 shadow-2xs dark:bg-amber-900/40 dark:text-amber-400">
                    🥉
                </span>
            );
        }
        return (
            <span className="flex size-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                #{rank}
            </span>
        );
    };

    return (
        <Div className="space-y-6">
            {/* Filter Bar */}
            <Div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                <Div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Timeframe Presets */}
                    <Div className="flex flex-wrap items-center gap-1.5">
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="mr-1 font-medium">
                            {t('period')}:
                        </Label>
                        {(
                            [
                                { key: '30d', label: t('timeframe30d') },
                                { key: '90d', label: t('timeframe90d') },
                                { key: 'ytd', label: t('timeframeYtd') },
                                { key: 'all', label: t('timeframeAll') },
                                { key: 'custom', label: t('timeframeCustom') },
                            ] as const
                        ).map(({ key, label }) => {
                            const isActive = preset === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    id={`subscription-preset-${key}`}
                                    onClick={() => handlePresetChange(key)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-primary-600 text-white shadow-xs dark:bg-primary-500'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </Div>

                    {/* Plan Filter Dropdown */}
                    <Div className="w-full sm:w-64">
                        <Dropdown
                            leftIcon="filter"
                            options={productOptions}
                            value={selectedProductId}
                            onChange={(val) => setSelectedProductId(val as string)}
                            containerClassName="w-full"
                        />
                    </Div>
                </Div>

                {/* Custom Date Pickers */}
                {preset === 'custom' && (
                    <Div className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                        <Div className="w-44">
                            <DatePickerField
                                id="sub-analytics-start"
                                label={t('startDate')}
                                value={customStart}
                                onChange={(val) => setCustomStart(val ? String(val) : '')}
                            />
                        </Div>
                        <Div className="w-44">
                            <DatePickerField
                                id="sub-analytics-end"
                                label={t('endDate')}
                                value={customEnd}
                                onChange={(val) => setCustomEnd(val ? String(val) : '')}
                            />
                        </Div>
                        <Button
                            id="apply-custom-dates-btn"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            text={tCommon('apply')}
                            onClick={handleApplyCustomDates}
                        />
                    </Div>
                )}
            </Div>

            {/* Loading & Error States */}
            {isLoading && (
                <Div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <Spinner size={ESize.lg} color="text-primary-600" />
                </Div>
            )}

            {isError && (
                <Div className="rounded-2xl border border-danger-200 bg-danger-50/50 p-6 text-center dark:border-danger-900/60 dark:bg-danger-950/20">
                    <Label variant={EVariantLabel.body} color="text-danger-700" className="dark:text-danger-400">
                        {error instanceof Error ? error.message : t('emptyAnalytics')}
                    </Label>
                </Div>
            )}

            {summary && !isLoading && (
                <>
                    {/* Executive KPI StatCards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
                        <StatCard
                            icon={IconComponentsEnum.layers}
                            iconBg="bg-primary-50"
                            iconColor="text-primary-600"
                            label={t('totalRevenue')}
                            value={formatMoney(summary.totalRevenue)}
                            action={<span className="text-xs font-medium text-gray-400">{t('totalPaid')}</span>}
                        />
                        <StatCard
                            icon={IconComponentsEnum.checkCircle}
                            iconBg="bg-success-50"
                            iconColor="text-success-600"
                            label={t('activeCount')}
                            value={String(summary.activeSubscriptions)}
                        />
                        <StatCard
                            icon={IconComponentsEnum.alert}
                            iconBg="bg-warning-50"
                            iconColor="text-warning-600"
                            label={t('expiringCount')}
                            value={String(summary.expiringSubscriptions)}
                        />
                        <StatCard
                            icon={IconComponentsEnum.rotate}
                            iconBg="bg-accent-50"
                            iconColor="text-accent-500"
                            label={t('renewalRate')}
                            value={`${summary.renewalRate}%`}
                            action={<span className="text-xs font-medium text-gray-400">{summary.renewalsCount} {t('renewals').toLowerCase()}</span>}
                        />
                        <StatCard
                            icon={IconComponentsEnum.shoppingCart}
                            iconBg="bg-primary-50"
                            iconColor="text-primary-500"
                            label={t('averageValue')}
                            value={formatMoney(summary.averageValue)}
                        />
                    </div>

                    {/* Trends Chart */}
                    <Div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <Div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <Div>
                                <Label variant={EVariantLabel.h5} color="text-gray-900" className="font-bold dark:text-gray-100">
                                    {t('trendsTitle')}
                                </Label>
                                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block mt-0.5">
                                    {interval === 'day' ? 'Données journalières' : 'Données mensuelles'} · {summary.totalSubscriptions} souscriptions
                                </Label>
                            </Div>

                            {/* View Switcher */}
                            <Div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                                <button
                                    type="button"
                                    id="chart-mode-both"
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                        chartMode === 'both'
                                            ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                    onClick={() => setChartMode('both')}
                                >
                                    Combiné
                                </button>
                                <button
                                    type="button"
                                    id="chart-mode-revenue"
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                        chartMode === 'revenue'
                                            ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                    onClick={() => setChartMode('revenue')}
                                >
                                    {t('revenue')}
                                </button>
                                <button
                                    type="button"
                                    id="chart-mode-volume"
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                        chartMode === 'volume'
                                            ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                    onClick={() => setChartMode('volume')}
                                >
                                    Volume
                                </button>
                            </Div>
                        </Div>

                        {trends.length === 0 ? (
                            <Div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/40">
                                <Label variant={EVariantLabel.body} color="text-gray-400">
                                    {t('emptyAnalytics')}
                                </Label>
                            </Div>
                        ) : (
                            <Div role="img" aria-label={t('trendsTitle')} className="w-full">
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={trends} margin={{ top: 10, right: 16, left: -8, bottom: 4 }}>
                                        <CartesianGrid vertical={false} stroke={chartColors.grid} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 11, fill: chartColors.tick }}
                                            axisLine={false}
                                            tickLine={false}
                                            minTickGap={12}
                                        />
                                        {(chartMode === 'both' || chartMode === 'revenue') && (
                                            <YAxis
                                                yAxisId="revenue"
                                                tick={{ fontSize: 11, fill: chartColors.tick }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(val: number) => `${val} DT`}
                                                width={60}
                                            />
                                        )}
                                        {(chartMode === 'both' || chartMode === 'volume') && (
                                            <YAxis
                                                yAxisId="volume"
                                                orientation="right"
                                                tick={{ fontSize: 11, fill: chartColors.tick }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={35}
                                            />
                                        )}
                                        <Tooltip content={SubscriptionChartTooltip} cursor={{ fill: chartColors.cursor }} />
                                        {(chartMode === 'both' || chartMode === 'revenue') && (
                                            <Bar
                                                yAxisId="revenue"
                                                dataKey="revenue"
                                                name={t('revenue')}
                                                fill={chartColors.barPrimary}
                                                radius={[6, 6, 0, 0]}
                                                maxBarSize={36}
                                            />
                                        )}
                                        {(chartMode === 'both' || chartMode === 'volume') && (
                                            <Line
                                                yAxisId="volume"
                                                type="monotone"
                                                dataKey="totalCount"
                                                name="Total abonnements"
                                                stroke={chartColors.lineVolume}
                                                strokeWidth={2.5}
                                                dot={{ r: 4, fill: chartColors.lineVolume, strokeWidth: 0 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        )}
                                        {(chartMode === 'both' || chartMode === 'volume') && (
                                            <Line
                                                yAxisId="volume"
                                                type="monotone"
                                                dataKey="renewalsCount"
                                                name={t('renewals')}
                                                stroke={chartColors.lineRenewals}
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                                dot={{ r: 3, fill: chartColors.lineRenewals, strokeWidth: 0 }}
                                            />
                                        )}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </Div>
                        )}
                    </Div>

                    {/* Plans Distribution & Status Breakdown Grid */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Plans Breakdown */}
                        <Div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                            <Div className="mb-4 flex items-center justify-between">
                                <Label variant={EVariantLabel.h5} color="text-gray-900" className="font-bold dark:text-gray-100">
                                    {t('plansTitle')}
                                </Label>
                                <span className="text-xs font-semibold text-gray-500">
                                    {planBreakdown.length} formule(s)
                                </span>
                            </Div>

                            {planBreakdown.length === 0 ? (
                                <Div className="py-8 text-center">
                                    <Label variant={EVariantLabel.body} color="text-gray-400">
                                        {t('empty')}
                                    </Label>
                                </Div>
                            ) : (
                                <Div className="space-y-4">
                                    {planBreakdown.map((plan) => (
                                        <Div
                                            key={plan.productId || plan.productName}
                                            className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40"
                                        >
                                            <Div className="flex items-center justify-between gap-2">
                                                <Div className="min-w-0">
                                                    <span className="block truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        {plan.productName}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {plan.duration} {plan.unit} · {plan.subscriptionsCount} vente(s)
                                                    </span>
                                                </Div>
                                                <Div className="text-right shrink-0">
                                                    <span className="block text-sm font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                                                        {formatMoney(plan.revenue)}
                                                    </span>
                                                    <Badge
                                                        id={`plan-active-badge-${plan.productId || plan.productName}`}
                                                        size={EBadgeSize.small}
                                                        type={plan.activeCount > 0 ? EBadgeType.success : EBadgeType.primary}
                                                        text={`${plan.activeCount} ${t('statusACTIVE').toLowerCase()}`}
                                                    />
                                                </Div>
                                            </Div>
                                            <Div className="mt-2.5">
                                                <ProgressBar value={plan.percentageOfRevenue} className="w-full" />
                                            </Div>
                                        </Div>
                                    ))}
                                </Div>
                            )}
                        </Div>

                        {/* Top Subscribers Leaderboard */}
                        <Div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                            <Div className="mb-4 flex items-center justify-between">
                                <Label variant={EVariantLabel.h5} color="text-gray-900" className="font-bold dark:text-gray-100">
                                    {t('leaderboardTitle')}
                                </Label>
                                <span className="text-xs font-semibold text-gray-500">
                                    Top {topSubscribers.length}
                                </span>
                            </Div>

                            {topSubscribers.length === 0 ? (
                                <Div className="py-8 text-center">
                                    <Label variant={EVariantLabel.body} color="text-gray-400">
                                        {t('empty')}
                                    </Label>
                                </Div>
                            ) : (
                                <Div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {topSubscribers.map((subscriber, index) => (
                                        <Div
                                            key={subscriber.clientId}
                                            onClick={() => router.push(Routes.Pos.client(subscriber.clientId))}
                                            className="group flex items-center justify-between gap-3 py-3 px-1 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40 rounded-xl cursor-pointer"
                                        >
                                            <Div className="flex items-center gap-3 min-w-0">
                                                {getRankBadge(index + 1)}
                                                <Div className="min-w-0">
                                                    <span className="block truncate text-sm font-bold text-gray-900 group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400 transition-colors">
                                                        {subscriber.clientName}
                                                    </span>
                                                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                                                        {subscriber.clientPhone || subscriber.clientEmail || t('client')}
                                                    </span>
                                                </Div>
                                            </Div>

                                            <Div className="text-right shrink-0">
                                                <span className="block text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                                                    {formatMoney(subscriber.totalSpent)}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {subscriber.subscriptionsCount} {t('title').toLowerCase()}
                                                </span>
                                            </Div>
                                        </Div>
                                    ))}
                                </Div>
                            )}
                        </Div>
                    </div>
                </>
            )}
        </Div>
    );
}
