'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import { EBadgeSize, EBadgeType, EVariantLabel } from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';
import { formatMoney } from '@/lib/daily-income-api';
import {
    fetchPortalReservations,
    formatPortalDate,
    formatPortalTimeRange,
    type PortalReservation,
    type PortalReservationScope,
} from '@/lib/portal-api';

const PER_PAGE = 10;

export default function PortalHistoryPage() {
    const t = useTranslations('portal');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const [scope, setScope] = useState<PortalReservationScope>('upcoming');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['portal-reservations', scope, page],
        queryFn: () => fetchPortalReservations({ scope, page, perPage: PER_PAGE }),
    });

    const columns = useMemo(
        (): ITableColumn<PortalReservation>[] => [
            {
                headerElement: {
                    value: 'startAt',
                    label: t('history.date'),
                    mobile: 'primary',
                    render: (_: unknown, row: PortalReservation) => (
                        <OrganismTable.Cell
                            mainText={formatPortalDate(row.startAt, locale)}
                            supportingText={formatPortalTimeRange(row.startAt, row.endAt, locale)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'room',
                    label: t('history.room'),
                    mobile: 'secondary',
                    render: (_: unknown, row: PortalReservation) => (
                        <OrganismTable.Cell mainText={row.room.name} supportingText={row.title ?? undefined} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'price',
                    label: t('history.price'),
                    mobile: 'secondary',
                    render: (_: unknown, row: PortalReservation) => (
                        <OrganismTable.Cell mainText={formatMoney(row.price)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('history.status'),
                    mobile: 'primary',
                    render: (_: unknown, row: PortalReservation) => {
                        if (row.status === 'CANCELLED') {
                            return (
                                <Badge
                                    id={`portal-history-status-${row.id}`}
                                    text={t('status.cancelled')}
                                    type={EBadgeType.error}
                                    size={EBadgeSize.small}
                                />
                            );
                        }
                        return (
                            <Badge
                                id={`portal-history-paid-${row.id}`}
                                text={row.isPaid ? t('status.paid') : t('status.unpaid')}
                                type={row.isPaid ? EBadgeType.success : EBadgeType.warning}
                                size={EBadgeSize.small}
                            />
                        );
                    },
                },
            },
        ],
        [t, locale],
    );

    return (
        <Div className="space-y-6">
            <Div className="flex flex-col gap-1">
                <Label variant={EVariantLabel.h3} color="text-gray-900">
                    {t('history.title')}
                </Label>
                <Label variant={EVariantLabel.body} color="text-gray-500">
                    {t('history.subtitle')}
                </Label>
            </Div>

            <Tabs
                variant="pills"
                options={[
                    { value: 'upcoming', label: t('history.upcoming') },
                    { value: 'past', label: t('history.past') },
                    { value: 'all', label: t('history.all') },
                ]}
                value={scope}
                onChange={(value) => {
                    if (value === 'upcoming' || value === 'past' || value === 'all') {
                        setScope(value);
                        setPage(1);
                    }
                }}
                className="w-full sm:w-auto"
            />

            <OrganismTable<PortalReservation>
                columns={columns}
                rows={data?.data ?? []}
                pageSize={PER_PAGE}
                searchable={false}
                isLoading={isLoading}
                emptyMessage={tCommon('empty')}
                page={page}
                totalRows={data?.meta.total ?? 0}
                onPageChange={setPage}
            />
        </Div>
    );
}
