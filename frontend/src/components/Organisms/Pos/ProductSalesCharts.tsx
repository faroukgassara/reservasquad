'use client';

import { useState } from 'react';
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
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import colors from '@/theme/colors';
import type { MonthlySalesTrendItem } from '@/lib/analytics-api';

const LIGHT_CHART_COLORS = {
    grid: colors.gray[100],
    tick: colors.gray[500],
    cursor: colors.primary[25],
    barPrimary: colors.primary[400],
    barPrimaryHover: colors.primary[500],
    lineUnits: colors.accent[500],
    lineRevenue: colors.primary[600],
};

const DARK_CHART_COLORS = {
    grid: 'oklch(0.3389 0.0301 270.4)',
    tick: 'oklch(0.6486 0.0275 268.6)',
    cursor: 'oklch(0.2855 0.0492 271.5)',
    barPrimary: 'oklch(0.5222 0.0821 273.5)',
    barPrimaryHover: 'oklch(0.6011 0.0691 274)',
    lineUnits: 'oklch(0.6156 0.2193 27.4)',
    lineRevenue: 'oklch(0.702 0.16 273.5)',
};

function useChartColors() {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;
}

const formatSessionTime = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function AnalyticsChartTooltip({
    active,
    payload,
    label,
    ordersLabel,
}: Readonly<TooltipContentProps & { ordersLabel?: string }>) {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload as MonthlySalesTrendItem | undefined;
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
            {item?.openedAt && item.closedAt ? (
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="mb-1.5 block tabular-nums">
                    {`${formatSessionTime(item.openedAt)} → ${formatSessionTime(item.closedAt)}`}
                </Label>
            ) : null}
            <Div className="space-y-1">
                {payload.map((entry) => {
                    const isRevenue = String(entry.dataKey) === 'totalRevenue';
                    const displayValue = isRevenue
                        ? formatMoney(Number(entry.value))
                        : `${entry.value} unités`;

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
                {ordersLabel && item ? (
                    <Div className="flex items-center gap-2">
                        <Div className="size-2 shrink-0 rounded-full bg-gray-400" />
                        <Label variant={EVariantLabel.caption} color="text-gray-600" className="dark:text-gray-300">
                            {ordersLabel}: <span className="font-semibold text-gray-900 dark:text-gray-100">{item.ordersCount}</span>
                        </Label>
                    </Div>
                ) : null}
            </Div>
        </Div>
    );
}

export type ChartMetricView = 'both' | 'revenue' | 'units';

export interface ProductSalesTrendChartProps {
    data: MonthlySalesTrendItem[];
    title: string;
    revenueLabel: string;
    unitsLabel: string;
    ordersLabel?: string;
    noDataLabel: string;
    metricView?: ChartMetricView;
    onMetricViewChange?: (view: ChartMetricView) => void;
}

export function ProductSalesTrendChart({
    data,
    title,
    revenueLabel,
    unitsLabel,
    ordersLabel,
    noDataLabel,
    metricView: controlledView,
    onMetricViewChange,
}: Readonly<ProductSalesTrendChartProps>) {
    const chartColors = useChartColors();
    const [internalView, setInternalView] = useState<ChartMetricView>('both');
    const view = controlledView ?? internalView;
    const setView = onMetricViewChange ?? setInternalView;

    if (!data.length) {
        return (
            <Div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/40">
                <Label variant={EVariantLabel.body} color="text-gray-400">
                    {noDataLabel}
                </Label>
            </Div>
        );
    }

    const showRevenue = view === 'both' || view === 'revenue';
    const showUnits = view === 'both' || view === 'units';

    return (
        <Div className="space-y-4">
            <Div className="flex flex-wrap items-center justify-between gap-3">
                <Label variant={EVariantLabel.h5} color="text-gray-900" className="font-semibold dark:text-gray-100">
                    {title}
                </Label>
                <Div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                    <button
                        type="button"
                        id="chart-view-both"
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            view === 'both'
                                ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                        onClick={() => setView('both')}
                    >
                        Combiné
                    </button>
                    <button
                        type="button"
                        id="chart-view-revenue"
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            view === 'revenue'
                                ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                        onClick={() => setView('revenue')}
                    >
                        {revenueLabel}
                    </button>
                    <button
                        type="button"
                        id="chart-view-units"
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            view === 'units'
                                ? 'bg-white text-primary-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                        onClick={() => setView('units')}
                    >
                        {unitsLabel}
                    </button>
                </Div>
            </Div>

            <Div role="img" aria-label={title}>
                <ResponsiveContainer width="100%" height={290}>
                    <ComposedChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 4 }}>
                        <CartesianGrid vertical={false} stroke={chartColors.grid} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={12}
                        />
                        {showRevenue && (
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 11, fill: chartColors.tick }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val: number) => `${val} DT`}
                                width={55}
                            />
                        )}
                        {showUnits && (
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 11, fill: chartColors.tick }}
                                axisLine={false}
                                tickLine={false}
                                width={35}
                            />
                        )}
                        <Tooltip
                            content={(props) => <AnalyticsChartTooltip {...props} ordersLabel={ordersLabel} />}
                            cursor={{ fill: chartColors.cursor }}
                        />
                        {showRevenue && (
                            <Bar
                                yAxisId="left"
                                dataKey="totalRevenue"
                                name={revenueLabel}
                                fill={chartColors.barPrimary}
                                radius={[6, 6, 0, 0]}
                                maxBarSize={36}
                            />
                        )}
                        {showUnits && (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="unitsSold"
                                name={unitsLabel}
                                stroke={chartColors.lineUnits}
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: chartColors.lineUnits, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </Div>
        </Div>
    );
}

export function SingleProductSalesChart({
    data,
    productName,
    revenueLabel,
    unitsLabel,
}: Readonly<{
    data: MonthlySalesTrendItem[];
    productName: string;
    revenueLabel: string;
    unitsLabel: string;
}>) {
    const chartColors = useChartColors();

    if (!data.length) {
        return (
            <Div className="py-6 text-center">
                <Label variant={EVariantLabel.caption} color="text-gray-400">
                    Aucune vente enregistrée pour ce produit sur cette période.
                </Label>
            </Div>
        );
    }

    return (
        <Div role="img" aria-label={`Tendance des ventes pour ${productName}`}>
            <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={data} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={chartColors.grid} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: chartColors.tick }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={12}
                    />
                    <YAxis
                        yAxisId="revenue"
                        tick={{ fontSize: 10, fill: chartColors.tick }}
                        axisLine={false}
                        tickLine={false}
                        width={45}
                    />
                    <YAxis
                        yAxisId="units"
                        orientation="right"
                        tick={{ fontSize: 10, fill: chartColors.tick }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                    />
                    <Tooltip content={AnalyticsChartTooltip} cursor={{ fill: chartColors.cursor }} />
                    <Bar
                        yAxisId="revenue"
                        dataKey="totalRevenue"
                        name={revenueLabel}
                        fill={chartColors.barPrimary}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                    />
                    <Line
                        yAxisId="units"
                        type="monotone"
                        dataKey="unitsSold"
                        name={unitsLabel}
                        stroke={chartColors.lineUnits}
                        strokeWidth={2}
                        dot={{ r: 3, fill: chartColors.lineUnits, strokeWidth: 0 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </Div>
    );
}
