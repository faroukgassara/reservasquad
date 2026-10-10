'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Badge from '@/components/Primitives/Badge/Badge';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import { fetchProfessorRanking, type ProfessorRankingRow } from '@/lib/professor-api';
import { formatMoney } from '@/lib/reservation-api';
import { Routes } from '@/lib/routes';
import { EBadgeSize, EBadgeType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import type {
    ITableColumn,
    ITableSortConfig,
    TTableSortDirection,
} from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

const RANKING_PERIODS = ['month', 'quarter', 'year', 'all'] as const;
type RankingPeriod = (typeof RANKING_PERIODS)[number];

type RankedRow = ProfessorRankingRow & { name: string; rank: number };

function periodRange(period: RankingPeriod): { from?: string; to?: string } {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    switch (period) {
        case 'month':
            return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: nextMonth.toISOString() };
        case 'quarter':
            return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(), to: nextMonth.toISOString() };
        case 'year':
            return {
                from: new Date(now.getFullYear(), 0, 1).toISOString(),
                to: new Date(now.getFullYear() + 1, 0, 1).toISOString(),
            };
        default:
            return {};
    }
}

function topBy(rows: RankedRow[], key: 'revenue' | 'hours' | 'unpaid'): RankedRow | undefined {
    return rows.reduce<RankedRow | undefined>(
        (best, row) => (row[key] > 0 && (!best || row[key] > best[key]) ? row : best),
        undefined,
    );
}

const OrganismProfessorRanking = () => {
    const t = useTranslations('admin.professors.ranking');
    const locale = useLocale();
    const router = useRouter();
    const [period, setPeriod] = useState<RankingPeriod>('month');
    const [sortConfig, setSortConfig] = useState<ITableSortConfig>({ key: 'revenue', direction: 'desc' });

    const range = useMemo(() => periodRange(period), [period]);
    const { data, isLoading } = useQuery({
        queryKey: ['professor-ranking', period],
        queryFn: () => fetchProfessorRanking(range),
    });

    const rows = useMemo<RankedRow[]>(
        () =>
            (data?.rows ?? []).map((row, index) => ({
                ...row,
                name: `${row.firstName} ${row.lastName}`,
                rank: index + 1,
            })),
        [data],
    );

    const numberFormat = useMemo(
        () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
        [locale],
    );

    const periodOptions = useMemo(
        () => RANKING_PERIODS.map((value) => ({ value, label: t(`periods.${value}`) })),
        [t],
    );

    const cards = useMemo(() => {
        const topRevenue = topBy(rows, 'revenue');
        const topHours = topBy(rows, 'hours');
        const topUnpaid = topBy(rows, 'unpaid');
        return [
            {
                id: 'revenue',
                icon: IconComponentsEnum.star,
                iconBg: 'bg-primary-25',
                iconColor: 'text-primary-500' as const,
                label: t('topRevenue'),
                value: topRevenue?.name ?? '—',
                amount: topRevenue ? formatMoney(topRevenue.revenue) : undefined,
            },
            {
                id: 'hours',
                icon: IconComponentsEnum.clock,
                iconBg: 'bg-success-50',
                iconColor: 'text-success-700' as const,
                label: t('mostHours'),
                value: topHours?.name ?? '—',
                amount: topHours ? t('hoursValue', { hours: numberFormat.format(topHours.hours) }) : undefined,
            },
            {
                id: 'unpaid',
                icon: IconComponentsEnum.alert,
                iconBg: 'bg-warning-50',
                iconColor: 'text-warning-700' as const,
                label: t('mostUnpaid'),
                value: topUnpaid?.name ?? '—',
                amount: topUnpaid ? formatMoney(topUnpaid.unpaid) : undefined,
            },
        ];
    }, [numberFormat, rows, t]);

    const columns = useMemo(
        (): ITableColumn<RankedRow>[] => [
            {
                headerElement: {
                    value: 'name',
                    label: t('teacher'),
                    mobile: 'primary',
                    sortable: true,
                    render: (_: unknown, row: RankedRow) => (
                        <OrganismTable.Cell
                            mainText={`${row.rank}. ${row.name}`}
                            supportingText={row.specialty ?? undefined}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'revenue',
                    label: t('revenue'),
                    mobile: 'secondary',
                    sortable: true,
                    render: (_: unknown, row: RankedRow) => (
                        <OrganismTable.Cell
                            mainText={formatMoney(row.revenue)}
                            supportingText={t('paidValue', { amount: formatMoney(row.paid) })}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'hours',
                    label: t('hours'),
                    mobile: 'secondary',
                    sortable: true,
                    render: (_: unknown, row: RankedRow) => (
                        <OrganismTable.Cell mainText={t('hoursValue', { hours: numberFormat.format(row.hours) })} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'sessions',
                    label: t('sessions'),
                    mobile: 'secondary',
                    sortable: true,
                    render: (_: unknown, row: RankedRow) => (
                        <OrganismTable.Cell
                            mainText={String(row.sessions)}
                            supportingText={
                                row.cancelled > 0 ? t('cancelledValue', { count: row.cancelled }) : undefined
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'unpaid',
                    label: t('unpaid'),
                    mobile: 'secondary',
                    sortable: true,
                    render: (_: unknown, row: RankedRow) => (
                        <Badge
                            id={`ranking-unpaid-${row.professorId}`}
                            text={row.unpaid > 0 ? formatMoney(row.unpaid) : t('allPaid')}
                            type={row.unpaid > 0 ? EBadgeType.warning : EBadgeType.success}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'avgPaymentDelayDays',
                    label: t('avgDelay'),
                    mobile: 'secondary',
                    sortable: true,
                    render: (_: unknown, row: RankedRow) => (
                        <OrganismTable.Cell
                            mainText={
                                row.avgPaymentDelayDays == null
                                    ? '—'
                                    : t('daysValue', { days: numberFormat.format(row.avgPaymentDelayDays) })
                            }
                        />
                    ),
                },
            },
        ],
        [numberFormat, t],
    );

    return (
        <Div className="flex flex-col gap-4">
            <Div className="flex flex-wrap items-end justify-between gap-3">
                <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                    {t('hint')}
                </Label>
                <Dropdown
                    label={t('period')}
                    options={periodOptions}
                    value={period}
                    onChange={(value) => {
                        if (typeof value === 'string' && (RANKING_PERIODS as readonly string[]).includes(value)) {
                            setPeriod(value as RankingPeriod);
                        }
                    }}
                    containerClassName="w-full sm:w-56"
                />
            </Div>

            <Div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {cards.map((card) => (
                    <StatCard
                        key={card.id}
                        icon={card.icon}
                        iconBg={card.iconBg}
                        iconColor={card.iconColor}
                        label={card.label}
                        value={isLoading ? '—' : card.value}
                        action={
                            !isLoading && card.amount ? (
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="font-semibold tabular-nums">
                                    {card.amount}
                                </Label>
                            ) : undefined
                        }
                    />
                ))}
            </Div>

            <OrganismTable<RankedRow>
                columns={columns}
                rows={rows}
                pageSize={50}
                sortConfig={sortConfig}
                onSort={(key: string, direction: TTableSortDirection) => setSortConfig({ key, direction })}
                onClickRow={(row) => router.push(Routes.Professors.show(row.professorId))}
                isLoading={isLoading}
                emptyMessage={t('empty')}
            />
        </Div>
    );
};

export default OrganismProfessorRanking;
