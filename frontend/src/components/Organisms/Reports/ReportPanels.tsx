'use client';

import type { ReactNode } from 'react';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import { Link } from '@/i18n/navigation';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import type { ELabelColor } from '@/theme/labelColors';

export interface IReportStatCard {
    key: string;
    icon: IconComponentsEnum;
    iconBg: string;
    iconColor: ELabelColor;
    label: string;
    value: string;
}

export function formatMonthLabel(year: number, month: number, locale = 'fr'): string {
    const localeMap: Record<string, string> = {
        fr: 'fr-FR',
        en: 'en-US',
        ar: 'ar-TN',
    };
    return new Date(year, month - 1, 1).toLocaleDateString(localeMap[locale] || 'fr-FR', {
        month: 'short',
        year: 'numeric',
    });
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [
            headers.join(';'),
            ...rows.map((row) =>
                row
                    .map((cell) => {
                        const str = String(cell ?? '').replace(/"/g, '""');
                        return `"${str}"`;
                    })
                    .join(';'),
            ),
        ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function printReport() {
    if (typeof window !== 'undefined') {
        window.print();
    }
}

export function ChartLoader() {
    return <Div aria-hidden="true" className="h-56 w-full animate-pulse rounded-xl bg-gray-100" />;
}

export function ChartPanel({
    title,
    action,
    className = '',
    children,
}: Readonly<{ title: string; action?: ReactNode; className?: string; children: ReactNode }>) {
    return (
        <Div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
            <Div className="mb-4 flex items-center justify-between gap-2">
                <Label variant={EVariantLabel.body} color="text-gray-900" className="block font-semibold">
                    {title}
                </Label>
                {action}
            </Div>
            {children}
        </Div>
    );
}

export function EmptyChartState({
    label,
    actionLabel,
    actionHref,
}: Readonly<{ label: string; actionLabel?: string; actionHref?: string }>) {
    return (
        <Div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
            <Div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
                <Icon name={IconComponentsEnum.layers} size={ESize.sm} color="text-gray-400" />
            </Div>
            <Label variant={EVariantLabel.caption} color="text-gray-400">
                {label}
            </Label>
            {actionLabel && actionHref ? (
                <Link href={actionHref}>
                    <Label variant={EVariantLabel.caption} color="text-primary-600" className="font-medium hover:underline">
                        {actionLabel}
                    </Label>
                </Link>
            ) : null}
        </Div>
    );
}

export function StatCardGrid({
    cards,
    isLoading,
    className = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
}: Readonly<{ cards: IReportStatCard[]; isLoading: boolean; className?: string }>) {
    return (
        <Div className={className}>
            {cards.map((card) => (
                <Div key={card.key}>
                    <StatCard
                        icon={card.icon}
                        iconBg={card.iconBg}
                        iconColor={card.iconColor}
                        label={card.label}
                        value={card.value}
                        isLoading={isLoading}
                    />
                </Div>
            ))}
        </Div>
    );
}

