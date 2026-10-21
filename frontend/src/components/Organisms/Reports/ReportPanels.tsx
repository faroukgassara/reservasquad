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

export function formatMonthLabel(year: number, month: number): string {
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
    });
}

export function ChartLoader() {
    return <Div aria-hidden="true" className="h-56 w-full animate-pulse rounded-xl bg-gray-100" />;
}

export function ChartPanel({
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
