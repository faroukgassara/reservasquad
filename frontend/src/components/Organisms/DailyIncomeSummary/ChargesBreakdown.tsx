'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps,
} from 'recharts';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { formatMoney, type IncomeLineRecord } from '@/lib/daily-income-api';
import colors from '@/theme/colors';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';

interface ICategoryRow {
    key: string;
    name: string;
    amount: number;
    count: number;
}

interface ITimeBucket {
    key: string;
    label: string;
    fullLabel: string;
    charges: number;
    investments: number;
}

const UNCATEGORIZED_KEY = '__uncategorized__';

const LIGHT_CHART_COLORS = {
    grid: colors.gray[100],
    tick: colors.gray[500],
    charges: colors.primary[500],
    investments: colors.success[400],
    cursor: colors.gray[50],
};

const DARK_CHART_COLORS = {
    grid: 'oklch(0.3389 0.0301 270.4)',
    tick: 'oklch(0.6486 0.0275 268.6)',
    charges: 'oklch(0.5822 0.0531 274.33)',
    investments: colors.success[500],
    cursor: 'oklch(0.3055 0.0189 268.06)',
};

const compactAmount = (value: number) =>
    new Intl.NumberFormat('fr-TN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const localeTag = (locale: string) => {
    if (locale === 'ar') return 'ar-TN';
    if (locale === 'en') return 'en-US';
    return 'fr-FR';
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const TOP_CATEGORIES = 6;

const SLICE_COLORS = [
    colors.primary[500],
    colors.accent[500],
    colors.warning[400],
    colors.primary[300],
    colors.success[500],
    colors.accent[200],
];
const OTHERS_COLOR = colors.gray[300];

const percentOf = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

const formatPercent = (value: number) => (value > 0 && value < 1 ? '<1%' : `${Math.round(value)}%`);

function RankedRow({
    row,
    color,
    total,
    max,
}: Readonly<{ row: ICategoryRow; color: string; total: number; max: number }>) {
    const t = useTranslations('admin.dailyIncome.summary');

    return (
        <Div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-2 sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
            <Div className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
                <Div className="flex min-w-0 flex-col">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-medium">
                        {row.name}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-400">
                        {t('operationsCount', { count: row.count })}
                    </Label>
                </Div>
            </Div>
            <Div className="hidden h-2 w-full overflow-hidden rounded-full bg-gray-50 sm:block">
                <Div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentOf(row.amount, max)}%`, backgroundColor: color }}
                />
            </Div>
            <Div className="flex items-baseline justify-end gap-2.5">
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="w-10 text-end tabular-nums">
                    {formatPercent(percentOf(row.amount, total))}
                </Label>
                <Label
                    variant={EVariantLabel.bodySmall}
                    color="text-gray-900"
                    className="w-28 text-end font-semibold! tabular-nums"
                >
                    {formatMoney(row.amount)}
                </Label>
            </Div>
        </Div>
    );
}

function CategoryBreakdown({
    categories,
    investments,
    chargesTotal,
}: Readonly<{ categories: ICategoryRow[]; investments: ICategoryRow; chargesTotal: number }>) {
    const t = useTranslations('admin.dailyIncome.summary');
    const [showAll, setShowAll] = useState(false);

    const top = categories.slice(0, TOP_CATEGORIES);
    const rest = categories.slice(TOP_CATEGORIES);
    const others: ICategoryRow = {
        key: '__others__',
        name: t('otherCategories', { count: rest.length }),
        amount: rest.reduce((sum, row) => sum + row.amount, 0),
        count: rest.reduce((sum, row) => sum + row.count, 0),
    };
    const max = Math.max(top[0]?.amount ?? 0, others.amount);

    const slices = [
        ...top.map((row, index) => ({ name: row.name, value: row.amount, color: SLICE_COLORS[index] })),
        ...(rest.length > 0 ? [{ name: others.name, value: others.amount, color: OTHERS_COLOR }] : []),
    ];

    return (
        <Div className="grid gap-6 lg:grid-cols-[13rem_1fr] lg:items-center">
            <Div className="relative mx-auto size-52">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={slices}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="68%"
                            outerRadius="100%"
                            paddingAngle={slices.length > 1 ? 2 : 0}
                            stroke="none"
                            isAnimationActive={false}
                        >
                            {slices.map((slice) => (
                                <Cell key={slice.name} fill={slice.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <Div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('chargesTotal')}
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-bold! tabular-nums">
                        {formatMoney(chargesTotal)}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-400">
                        {t('categoriesCount', { count: categories.length })}
                    </Label>
                </Div>
            </Div>

            <Div className="flex min-w-0 flex-col">
                <Div className="divide-y divide-gray-100">
                    {top.map((row, index) => (
                        <RankedRow key={row.key} row={row} color={SLICE_COLORS[index]} total={chargesTotal} max={max} />
                    ))}
                    {rest.length > 0 && !showAll ? (
                        <RankedRow row={others} color={OTHERS_COLOR} total={chargesTotal} max={max} />
                    ) : null}
                    {showAll
                        ? rest.map((row) => (
                              <RankedRow key={row.key} row={row} color={OTHERS_COLOR} total={chargesTotal} max={max} />
                          ))
                        : null}
                </Div>

                {rest.length > 0 ? (
                    <Div className="pt-2">
                        <Button
                            id="charges-breakdown-toggle-all"
                            type={EButtonType.tertiary}
                            size={EButtonSize.small}
                            text={showAll ? t('showLess') : t('showAll', { count: categories.length })}
                            onClick={() => setShowAll((value) => !value)}
                        />
                    </Div>
                ) : null}

                {investments.count > 0 ? (
                    <Div className="mt-3 rounded-xl bg-gray-25 px-3">
                        <RankedRow
                            row={investments}
                            color={colors.success[400]}
                            total={chargesTotal + investments.amount}
                            max={investments.amount}
                        />
                    </Div>
                ) : null}
            </Div>
        </Div>
    );
}

function SpendingOverTime({
    buckets,
    isGlobal,
}: Readonly<{ buckets: ITimeBucket[]; isGlobal: boolean }>) {
    const t = useTranslations('admin.dailyIncome');
    const tSummary = useTranslations('admin.dailyIncome.summary');
    const { resolvedTheme } = useTheme();
    const chartColors = resolvedTheme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;

    const { total, peak } = useMemo(() => {
        let sum = 0;
        let best: ITimeBucket | null = null;
        for (const bucket of buckets) {
            const bucketTotal = bucket.charges + bucket.investments;
            sum += bucketTotal;
            if (bucketTotal > 0 && (!best || bucketTotal > best.charges + best.investments)) best = bucket;
        }
        return { total: sum, peak: best };
    }, [buckets]);

    const renderTooltip = ({ active, payload }: TooltipContentProps) => {
        if (!active || !payload?.length) return null;
        const point = payload[0]?.payload as ITimeBucket | undefined;
        if (!point) return null;

        const rows = [
            { key: 'charges', label: t('charge'), value: point.charges, color: chartColors.charges },
            { key: 'investments', label: t('investment'), value: point.investments, color: chartColors.investments },
        ];

        return (
            <Div className="min-w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                <Label variant={EVariantLabel.caption} color="text-gray-900" className="mb-2 block border-b border-gray-100 pb-1.5 font-bold!">
                    {point.fullLabel}
                </Label>
                <Div className="flex flex-col gap-1.5">
                    {rows.map((row) => (
                        <Div key={row.key} className="flex items-center justify-between gap-4">
                            <Div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                                <Label variant={EVariantLabel.caption} color="text-gray-600">
                                    {row.label}
                                </Label>
                            </Div>
                            <Label variant={EVariantLabel.caption} color="text-gray-900" className="font-semibold! tabular-nums">
                                {formatMoney(row.value)}
                            </Label>
                        </Div>
                    ))}
                    <Div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-1.5">
                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                            {tSummary('total')}
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-900" className="font-bold! tabular-nums">
                            {formatMoney(point.charges + point.investments)}
                        </Label>
                    </Div>
                </Div>
            </Div>
        );
    };

    return (
        <Div className="flex min-w-0 flex-col border-t border-gray-100 pt-6">
            <Div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <Div className="flex flex-col gap-0.5">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold!">
                        {isGlobal ? tSummary('spendingByMonth') : tSummary('spendingByDay')}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {tSummary('totalOverPeriod', { amount: formatMoney(total) })}
                        {peak ? ` · ${tSummary('peak', { label: peak.fullLabel, amount: formatMoney(peak.charges + peak.investments) })}` : ''}
                    </Label>
                </Div>
                <Div className="flex items-center gap-4">
                    <Div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm" style={{ backgroundColor: chartColors.charges }} />
                        <Label variant={EVariantLabel.caption} color="text-gray-600" className="font-medium">
                            {t('charge')}
                        </Label>
                    </Div>
                    <Div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm" style={{ backgroundColor: chartColors.investments }} />
                        <Label variant={EVariantLabel.caption} color="text-gray-600" className="font-medium">
                            {t('investment')}
                        </Label>
                    </Div>
                </Div>
            </Div>

            <Div role="img" aria-label={isGlobal ? tSummary('spendingByMonth') : tSummary('spendingByDay')}>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={buckets} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barCategoryGap="22%">
                        <CartesianGrid vertical={false} stroke={chartColors.grid} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={isGlobal && buckets.length > 14 ? -40 : 0}
                            textAnchor={isGlobal && buckets.length > 14 ? 'end' : 'middle'}
                            height={isGlobal && buckets.length > 14 ? 48 : 24}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value: number) => compactAmount(value)}
                            width={48}
                        />
                        <Tooltip content={renderTooltip} cursor={{ fill: chartColors.cursor, radius: 6 }} />
                        <Bar dataKey="investments" stackId="spending" fill={chartColors.investments} maxBarSize={32} />
                        <Bar
                            dataKey="charges"
                            stackId="spending"
                            fill={chartColors.charges}
                            radius={[5, 5, 0, 0]}
                            maxBarSize={32}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Div>
        </Div>
    );
}

export default function ChargesBreakdown({
    lines,
    isLoading,
    isGlobal,
    year,
    month,
}: Readonly<{
    lines: IncomeLineRecord[];
    isLoading: boolean;
    isGlobal: boolean;
    year: number;
    month: number;
}>) {
    const t = useTranslations('admin.dailyIncome');
    const tSummary = useTranslations('admin.dailyIncome.summary');
    const locale = useLocale();

    const { categories, investments, chargesTotal, timeBuckets } = useMemo(() => {
        const tag = localeTag(locale);
        const dayFormatter = new Intl.DateTimeFormat(tag, { weekday: 'long', day: 'numeric', month: 'long' });
        const monthShortFormatter = new Intl.DateTimeFormat(tag, { month: 'short', year: '2-digit' });
        const monthLongFormatter = new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric' });

        const byCategory = new Map<string, ICategoryRow>();
        const investmentRow: ICategoryRow = { key: 'investments', name: t('investment'), amount: 0, count: 0 };
        const byTime = new Map<string, ITimeBucket>();

        if (!isGlobal) {
            const daysInMonth = new Date(year, month, 0).getDate();
            for (let day = 1; day <= daysInMonth; day += 1) {
                const key = String(day).padStart(2, '0');
                byTime.set(key, {
                    key,
                    label: String(day),
                    fullLabel: capitalize(dayFormatter.format(new Date(year, month - 1, day))),
                    charges: 0,
                    investments: 0,
                });
            }
        }

        for (const line of lines) {
            if (line.type !== 'CHARGE' && line.type !== 'INVESTMENT') continue;
            const amount = Number(line.amount) || 0;

            if (line.type === 'CHARGE') {
                const key = line.category?.id ?? UNCATEGORIZED_KEY;
                const row = byCategory.get(key) ?? {
                    key,
                    name: line.category?.name ?? tSummary('uncategorized'),
                    amount: 0,
                    count: 0,
                };
                row.amount += amount;
                row.count += 1;
                byCategory.set(key, row);
            } else {
                investmentRow.amount += amount;
                investmentRow.count += 1;
            }

            const timeKey = isGlobal ? line.date.slice(0, 7) : line.date.slice(8, 10);
            let bucket = byTime.get(timeKey);
            if (!bucket) {
                const monthDate = new Date(Number(line.date.slice(0, 4)), Number(line.date.slice(5, 7)) - 1, 1);
                bucket = {
                    key: timeKey,
                    label: monthShortFormatter.format(monthDate),
                    fullLabel: capitalize(monthLongFormatter.format(monthDate)),
                    charges: 0,
                    investments: 0,
                };
                byTime.set(timeKey, bucket);
            }
            if (line.type === 'CHARGE') bucket.charges += amount;
            else bucket.investments += amount;
        }

        const sortedCategories = [...byCategory.values()].sort((a, b) => b.amount - a.amount);

        return {
            categories: sortedCategories,
            investments: investmentRow,
            chargesTotal: sortedCategories.reduce((sum, row) => sum + row.amount, 0),
            timeBuckets: [...byTime.values()]
                .sort((a, b) => a.key.localeCompare(b.key))
                .map((bucket) => ({
                    ...bucket,
                    charges: Math.round(bucket.charges * 1000) / 1000,
                    investments: Math.round(bucket.investments * 1000) / 1000,
                })),
        };
    }, [isGlobal, lines, locale, month, t, tSummary, year]);

    const hasData = categories.length > 0 || investments.count > 0;

    return (
        <section className="flex flex-col rounded-2xl border border-gray-200 bg-white">
            <Div className="flex flex-col gap-0.5 border-b border-gray-100 px-5 py-4">
                <Label variant={EVariantLabel.h6} color="text-gray-900" className="font-bold!">
                    {tSummary('chargesDetailTitle')}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500">
                    {tSummary('chargesDetailSubtitle')}
                </Label>
            </Div>

            {isLoading ? <Div className="m-5 h-64 animate-pulse rounded-xl bg-gray-50" /> : null}

            {!isLoading && !hasData ? (
                <Div className="px-5 py-10 text-center">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                        {tSummary('noCharges')}
                    </Label>
                </Div>
            ) : null}

            {!isLoading && hasData ? (
                <Div className="flex flex-col gap-8 p-5">
                    <Div className="flex min-w-0 flex-col">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="pb-4 font-semibold!">
                            {tSummary('byCategory')}
                        </Label>
                        <CategoryBreakdown
                            categories={categories}
                            investments={investments}
                            chargesTotal={chargesTotal}
                        />
                    </Div>

                    <SpendingOverTime buckets={timeBuckets} isGlobal={isGlobal} />
                </Div>
            ) : null}
        </section>
    );
}
