'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import ProgressBar from '@/components/Primitives/ProgressBar/ProgressBar';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import PosThumbnail from './PosThumbnail';
import { ProductSalesTrendChart, SingleProductSalesChart } from './ProductSalesCharts';
import AnnualComparisonView from './AnnualComparisonView';
import {
    fetchProductAnalytics,
    getTimeframePresetRange,
    type AnalyticsTimeframePreset,
    type ProductLeaderboardItem,
} from '@/lib/analytics-api';
import { fetchPosCategories } from '@/lib/pos-api';
import { formatMoney } from '@/lib/daily-income-api';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

export default function OrganismProductAnalytics() {
    const t = useTranslations('pos.analytics');
    const [preset, setPreset] = useState<AnalyticsTimeframePreset>('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [appliedCustom, setAppliedCustom] = useState<{ start?: string; end?: string }>({});
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
    const [leaderboardTab, setLeaderboardTab] = useState<'quantity' | 'revenue'>('revenue');

    const { data: categories = [] } = useQuery({
        queryKey: ['pos-categories'],
        queryFn: fetchPosCategories,
    });

    const categoryOptions = [
        { value: 'ALL', label: t('allCategories') },
        ...categories.map((c) => ({ value: c.id, label: c.name })),
    ];

    // Compute effective dates for query
    const effectiveDates =
        preset === 'custom'
            ? { startDate: appliedCustom.start, endDate: appliedCustom.end }
            : getTimeframePresetRange(preset);

    const queryKey = [
        'product-sales-analytics',
        effectiveDates.startDate,
        effectiveDates.endDate,
        selectedProductId,
        selectedCategoryId,
        preset,
    ];

    const { data, isLoading, isError, error } = useQuery({
        queryKey,
        queryFn: () =>
            fetchProductAnalytics({
                startDate: effectiveDates.startDate,
                endDate: effectiveDates.endDate,
                productId: selectedProductId || undefined,
                categoryId: selectedCategoryId === 'ALL' ? undefined : selectedCategoryId,
                interval: preset === '30d' ? 'day' : undefined,
            }),
    });

    const handlePresetChange = (newPreset: AnalyticsTimeframePreset) => {
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

    const leaderboardItems =
        leaderboardTab === 'quantity'
            ? data?.topSellingByQuantity ?? []
            : data?.topSellingByRevenue ?? [];

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
            <span className="flex size-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                #{rank}
            </span>
        );
    };

    return (
        <Div className="space-y-6">
            {/* Filter Bar */}
            <Div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                <Div className="flex flex-wrap items-center justify-between gap-3">
                    <Div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                        <button
                            type="button"
                            id="preset-all"
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${preset === 'all'
                                    ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            onClick={() => handlePresetChange('all')}
                        >
                            {t('presetAll')}
                        </button>
                        <button
                            type="button"
                            id="preset-ytd"
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${preset === 'ytd'
                                    ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            onClick={() => handlePresetChange('ytd')}
                        >
                            {t('presetYtd')}
                        </button>
                        <button
                            type="button"
                            id="preset-30d"
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${preset === '30d'
                                    ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            onClick={() => handlePresetChange('30d')}
                        >
                            {t('preset30d')}
                        </button>
                        <button
                            type="button"
                            id="preset-custom"
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${preset === 'custom'
                                    ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            onClick={() => handlePresetChange('custom')}
                        >
                            {t('customRange')}
                        </button>
                        <button
                            type="button"
                            id="preset-compare"
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${preset === 'compare'
                                    ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            onClick={() => handlePresetChange('compare')}
                        >
                            {t('presetCompare')}
                        </button>
                    </Div>

                    {/* Category Filter Dropdown */}
                    <Div className="w-full sm:w-60">
                        <Dropdown
                            leftIcon={IconComponentsEnum.filter}
                            options={categoryOptions}
                            value={selectedCategoryId}
                            onChange={(value) => {
                                if (typeof value === 'string') {
                                    setSelectedCategoryId(value);
                                }
                            }}
                            className={selectedCategoryId !== 'ALL' ? 'border-primary-300 bg-primary-50/20' : ''}
                            containerClassName="w-full"
                        />
                    </Div>
                </Div>

                {/* Custom Date Range Picker Inputs using primitive DatePickerField */}
                {preset === 'custom' && (
                    <Div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <Div className="w-48 sm:w-56">
                            <DatePickerField
                                id="analytics-custom-start"
                                label={t('startDate')}
                                value={customStart}
                                max={customEnd || undefined}
                                onChange={(val) => setCustomStart(val)}
                            />
                        </Div>
                        <Div className="w-48 sm:w-56">
                            <DatePickerField
                                id="analytics-custom-end"
                                label={t('endDate')}
                                value={customEnd}
                                min={customStart || undefined}
                                onChange={(val) => setCustomEnd(val)}
                            />
                        </Div>
                        <Button
                            id="analytics-apply-dates"
                            text={t('apply')}
                            size={EButtonSize.medium}
                            type={EButtonType.primary}
                            onClick={handleApplyCustomDates}
                        />
                    </Div>
                )}
            </Div>

            {/* Error banner */}
            {isError && (
                <Div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-800 dark:border-danger-900 dark:bg-danger-950/60 dark:text-danger-200">
                    {error instanceof Error ? error.message : 'Error loading analytics'}
                </Div>
            )}

            {/* Content: Annual Comparison View or Standard Timeframe Views */}
            {preset === 'compare' ? (
                <AnnualComparisonView
                    data={data?.monthlyTrends ?? []}
                    isLoading={isLoading}
                    categoryName={
                        selectedCategoryId === 'ALL'
                            ? undefined
                            : categories.find((c) => c.id === selectedCategoryId)?.name
                    }
                />
            ) : (
                <>
                    {/* KPI Stat Cards */}
                    <Div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={IconComponentsEnum.layers}
                    iconBg="bg-primary-50 dark:bg-primary-950/60"
                    iconColor="text-primary-600"
                    label={selectedProductId || selectedCategoryId !== 'ALL' ? t('totalRevenue') : t('collectedRevenue')}
                    value={data ? formatMoney(data.summary.totalRevenue) : '—'}
                    isLoading={isLoading}
                />
                <StatCard
                    icon={IconComponentsEnum.shoppingCart}
                    iconBg="bg-success-50 dark:bg-success-950/60"
                    iconColor="text-success-700"
                    label={t('totalUnitsSold')}
                    value={data ? `${data.summary.totalUnitsSold} unités` : '—'}
                    isLoading={isLoading}
                />
                <StatCard
                    icon={IconComponentsEnum.filetext}
                    iconBg="bg-warning-50 dark:bg-warning-950/60"
                    iconColor="text-warning-600"
                    label={t('totalOrders')}
                    value={data ? String(data.summary.totalOrdersCount) : '—'}
                    isLoading={isLoading}
                />
                <StatCard
                    icon={IconComponentsEnum.lock}
                    iconBg="bg-accent-50 dark:bg-accent-950/60"
                    iconColor="text-accent-600"
                    label={t('closedSessions')}
                    value={data ? String(data.summary.sessionsCount) : '—'}
                    isLoading={isLoading}
                />
            </Div>

            {/* Product Breakdown Banner (if a specific product is filtered) */}
            {data?.productBreakdown && (
                <Div className="overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50/70 via-white to-white p-5 shadow-xs dark:border-primary-900/60 dark:from-primary-950/30 dark:via-gray-900 dark:to-gray-900">
                    <Div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <Div className="flex items-center gap-4">
                            <PosThumbnail
                                imageUrl={data.productBreakdown.product.imageUrl}
                                alt={data.productBreakdown.product.name}
                                className="size-14 rounded-2xl border border-primary-200 shadow-sm"
                            />
                            <Div className="space-y-1">
                                <Div className="flex items-center gap-2">
                                    <Label variant={EVariantLabel.h4} color="text-gray-900" className="font-bold dark:text-gray-100">
                                        {data.productBreakdown.product.name}
                                    </Label>
                                    {data.productBreakdown.product.categoryName && (
                                        <Badge
                                            id="breakdown-category-badge"
                                            text={data.productBreakdown.product.categoryName}
                                            type={EBadgeType.primary}
                                            size={EBadgeSize.tiny}
                                        />
                                    )}
                                </Div>
                                <Label variant={EVariantLabel.caption} color="text-gray-500">
                                    {t('breakdownSubtitle')} · Prix actuel : {formatMoney(data.productBreakdown.product.price)} · En stock : {data.productBreakdown.product.stockQty}
                                </Label>
                            </Div>
                        </Div>

                        <Div className="flex items-center gap-4">
                            <Div className="text-right">
                                <span className="block text-xl font-extrabold text-primary-700 dark:text-primary-300">
                                    {formatMoney(data.productBreakdown.totalRevenue)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {data.productBreakdown.totalUnitsSold} unités en {data.productBreakdown.ordersCount} cmd
                                </span>
                            </Div>
                            <Button
                                id="clear-product-breakdown"
                                text={t('clearFilter')}
                                size={EButtonSize.small}
                                type={EButtonType.secondary}
                                onClick={() => setSelectedProductId(null)}
                            />
                        </Div>
                    </Div>

                    <Div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                        <SingleProductSalesChart
                            data={data.productBreakdown.monthlyTrends}
                            productName={data.productBreakdown.product.name}
                            revenueLabel={t('revenue')}
                            unitsLabel={t('unitsSold')}
                        />
                    </Div>
                </Div>
            )}

            {/* Monthly Sales Trends Chart */}
            <Div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <ProductSalesTrendChart
                    data={data?.monthlyTrends ?? []}
                    title={data?.timeframe.granularity === 'session' ? t('salesTrendSessions') : t('salesTrend')}
                    revenueLabel={t('revenue')}
                    unitsLabel={t('unitsSold')}
                    ordersLabel={t('totalOrders')}
                    noDataLabel={t('noData')}
                />
            </Div>

            {/* Top-Selling Products Leaderboard Card/Table */}
            <Div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <Div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Div>
                        <Label variant={EVariantLabel.h5} color="text-gray-900" className="font-semibold dark:text-gray-100">
                            {t('topSellingProducts')}
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                            {leaderboardTab === 'revenue' ? t('byRevenue') : t('byUnits')}
                        </Label>
                    </Div>

                    {/* Toggle Leaderboard Order */}
                    <Div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                        <button
                            type="button"
                            id="leaderboard-tab-revenue"
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${leaderboardTab === 'revenue'
                                    ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            onClick={() => setLeaderboardTab('revenue')}
                        >
                            {t('byRevenue')}
                        </button>
                        <button
                            type="button"
                            id="leaderboard-tab-quantity"
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${leaderboardTab === 'quantity'
                                    ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            onClick={() => setLeaderboardTab('quantity')}
                        >
                            {t('byUnits')}
                        </button>
                    </Div>
                </Div>

                {/* Table */}
                <Div className="mt-5 overflow-x-auto">
                    {isLoading ? (
                        <Div className="flex justify-center py-12">
                            <Spinner size={ESize.lg} color="text-primary-500" />
                        </Div>
                    ) : leaderboardItems.length === 0 ? (
                        <Div className="py-12 text-center text-sm text-gray-500">
                            {t('noData')}
                        </Div>
                    ) : (
                        <table className="w-full min-w-[620px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:text-gray-500">
                                    <th className="py-3 pr-2 text-center w-12">{t('rank')}</th>
                                    <th className="py-3 px-3">{t('product')}</th>
                                    <th className="py-3 px-3">{t('price')}</th>
                                    <th className="py-3 px-3 text-right">{t('unitsSold')}</th>
                                    <th className="py-3 px-3 text-right">{t('revenue')}</th>
                                    <th className="py-3 px-3 w-40">{t('percentOfCatalog')}</th>
                                    <th className="py-3 pl-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {leaderboardItems.map((item: ProductLeaderboardItem) => {
                                    const isSelected = selectedProductId === item.productId;
                                    return (
                                        <tr
                                            key={item.productId}
                                            className={`transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50 ${isSelected ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''
                                                }`}
                                        >
                                            <td className="py-3.5 pr-2 text-center">
                                                <Div className="flex justify-center">
                                                    {getRankBadge(item.rank)}
                                                </Div>
                                            </td>
                                            <td className="py-3.5 px-3">
                                                <Div className="flex items-center gap-3">
                                                    <PosThumbnail
                                                        imageUrl={item.imageUrl}
                                                        alt={item.productName}
                                                        className="size-9 rounded-xl"
                                                    />
                                                    <Div className="min-w-0">
                                                        <span className="block truncate font-semibold text-gray-900 dark:text-gray-100">
                                                            {item.productName}
                                                        </span>
                                                        {item.categoryName ? (
                                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                                {item.categoryName}
                                                            </span>
                                                        ) : null}
                                                    </Div>
                                                </Div>
                                            </td>
                                            <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300">
                                                {formatMoney(item.price)}
                                            </td>
                                            <td className="py-3.5 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                                {item.unitsSold}
                                            </td>
                                            <td className="py-3.5 px-3 text-right font-bold text-gray-900 dark:text-gray-100">
                                                {formatMoney(item.totalRevenue)}
                                            </td>
                                            <td className="py-3.5 px-3">
                                                <Div className="flex items-center gap-2">
                                                    <ProgressBar
                                                        value={item.percentageOfTotalSales}
                                                        showPercent={false}
                                                        className="flex-1"
                                                    />
                                                    <span className="w-10 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                                                        {item.percentageOfTotalSales}%
                                                    </span>
                                                </Div>
                                            </td>
                                            <td className="py-3.5 pl-3 text-right">
                                                <Button
                                                    id={`inspect-product-${item.productId}`}
                                                    text={isSelected ? t('selected') : t('detail')}
                                                    size={EButtonSize.small}
                                                    type={isSelected ? EButtonType.primary : EButtonType.secondary}
                                                    className="rounded-lg px-2.5 py-1 text-xs"
                                                    onClick={() =>
                                                        setSelectedProductId(
                                                            isSelected ? null : item.productId,
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </Div>
            </Div>
                </>
            )}
        </Div>
    );
}
