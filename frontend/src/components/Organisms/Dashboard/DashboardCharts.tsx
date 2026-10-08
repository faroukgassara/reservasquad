'use client';

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
import { EVariantLabel } from '@/Enum/Enum';
import { formatMoney } from '@/lib/reservation-api';
import colors from '@/theme/colors';

export interface ReservationTrendPoint {
    label: string;
    count: number;
    revenue: number;
    paidRevenue: number;
}

export interface IncomeTrendPoint {
    label: string;
    income: number;
    netBalance: number;
}

// recharts consumes colors as SVG attributes, which cannot resolve var(--ds-*),
// so chart colors are picked per theme as literals.
const LIGHT_CHART_COLORS = {
    grid: colors.gray[100],
    tick: colors.gray[500],
    cursor: colors.primary[25],
    barPrimary: colors.primary[300],
    barPrimaryStrong: colors.primary[400],
    lineAccent: colors.accent[500],
};

const DARK_CHART_COLORS = {
    grid: 'oklch(0.3389 0.0301 270.4)',
    tick: 'oklch(0.6486 0.0275 268.6)',
    cursor: 'oklch(0.2855 0.0492 271.5)',
    barPrimary: 'oklch(0.5222 0.0821 273.5)',
    barPrimaryStrong: 'oklch(0.6011 0.0691 274)',
    lineAccent: 'oklch(0.6156 0.2193 27.4)',
};

function useChartColors() {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;
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

function ChartDataTable({
    caption,
    columns,
    rows,
}: Readonly<{ caption: string; columns: string[]; rows: string[][] }>) {
    return (
        <table className="sr-only">
            <caption>{caption}</caption>
            <thead>
                <tr>
                    {columns.map((column) => (
                        <th key={column} scope="col">
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                        {row.map((cell, cellIndex) =>
                            cellIndex === 0 ? (
                                <th key={`cell-${rowIndex}-${cellIndex}`} scope="row">
                                    {cell}
                                </th>
                            ) : (
                                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                            ),
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function ReservationRevenueChart({
    data,
    title,
    periodLabel,
    revenueLabel,
    paidRevenueLabel,
}: Readonly<{
    data: ReservationTrendPoint[];
    title: string;
    periodLabel: string;
    revenueLabel: string;
    paidRevenueLabel: string;
}>) {
    const chartColors = useChartColors();

    return (
        <Div>
            <Div role="img" aria-label={title}>
                <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart
                        data={data}
                        margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} stroke={chartColors.grid} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                        />
                        <Tooltip
                            content={ChartTooltip}
                            cursor={{ fill: chartColors.cursor }}
                            formatter={(value) => formatMoney(value as number)}
                        />
                        <Bar
                            dataKey="revenue"
                            name={revenueLabel}
                            fill={chartColors.barPrimary}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={32}
                        />
                        <Line
                            type="monotone"
                            dataKey="paidRevenue"
                            name={paidRevenueLabel}
                            stroke={chartColors.lineAccent}
                            strokeWidth={2}
                            dot={{ r: 3, fill: chartColors.lineAccent, strokeWidth: 0 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </Div>
            <ChartDataTable
                caption={title}
                columns={[periodLabel, revenueLabel, paidRevenueLabel]}
                rows={data.map((point) => [
                    point.label,
                    formatMoney(point.revenue),
                    formatMoney(point.paidRevenue),
                ])}
            />
        </Div>
    );
}

export function ReservationCountChart({
    data,
    title,
    periodLabel,
    countLabel,
}: Readonly<{
    data: ReservationTrendPoint[];
    title: string;
    periodLabel: string;
    countLabel: string;
}>) {
    const chartColors = useChartColors();

    return (
        <Div>
            <Div role="img" aria-label={title}>
                <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart
                        data={data}
                        margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} stroke={chartColors.grid} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                        />
                        <Tooltip content={ChartTooltip} cursor={{ fill: chartColors.cursor }} />
                        <Bar
                            dataKey="count"
                            name={countLabel}
                            fill={chartColors.barPrimaryStrong}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </Div>
            <ChartDataTable
                caption={title}
                columns={[periodLabel, countLabel]}
                rows={data.map((point) => [point.label, String(point.count)])}
            />
        </Div>
    );
}

export function IncomeTrendChart({
    data,
    title,
    periodLabel,
    incomeLabel,
    netBalanceLabel,
}: Readonly<{
    data: IncomeTrendPoint[];
    title: string;
    periodLabel: string;
    incomeLabel: string;
    netBalanceLabel: string;
}>) {
    const chartColors = useChartColors();

    return (
        <Div>
            <Div role="img" aria-label={title}>
                <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke={chartColors.grid} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: chartColors.tick }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                        />
                        <Tooltip
                            content={ChartTooltip}
                            cursor={{ fill: chartColors.cursor }}
                            formatter={(value) => formatMoney(value as number)}
                        />
                        <Bar
                            dataKey="income"
                            name={incomeLabel}
                            fill={chartColors.barPrimary}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={32}
                        />
                        <Line
                            type="monotone"
                            dataKey="netBalance"
                            name={netBalanceLabel}
                            stroke={chartColors.lineAccent}
                            strokeWidth={2}
                            dot={{ r: 3, fill: chartColors.lineAccent, strokeWidth: 0 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </Div>
            <ChartDataTable
                caption={title}
                columns={[periodLabel, incomeLabel, netBalanceLabel]}
                rows={data.map((point) => [
                    point.label,
                    formatMoney(point.income),
                    formatMoney(point.netBalance),
                ])}
            />
        </Div>
    );
}
