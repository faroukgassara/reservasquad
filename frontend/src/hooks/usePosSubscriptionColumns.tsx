'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Badge from '@/components/Primitives/Badge/Badge';
import { formatMoney } from '@/lib/daily-income-api';
import {
    formatPosDate,
    formatSubscriptionNumber,
    personName,
    subscriptionDisplayStatus,
    toAmount,
    type Subscription,
} from '@/lib/pos-api';
import { SUBSCRIPTION_STATUS_BADGE } from '@/lib/pos-documents';
import { EBadgeSize } from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

export function usePosSubscriptionColumns({ withClient }: { withClient: boolean }) {
    const t = useTranslations('pos.subscriptions');
    return useMemo((): ITableColumn<Subscription>[] => {
        const clientColumn: ITableColumn<Subscription>[] = withClient
            ? [
                  {
                      headerElement: {
                          value: 'client',
                          label: t('client'),
                          mobile: 'secondary',
                          render: (_: unknown, row: Subscription) => (
                              <OrganismTable.Cell
                                  mainText={personName(row.client)}
                                  supportingText={row.client.phone ?? undefined}
                              />
                          ),
                      },
                  },
              ]
            : [];
        return [
            {
                headerElement: {
                    value: 'number',
                    label: t('number'),
                    mobile: 'primary',
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell mainText={formatSubscriptionNumber(row.number)} />
                    ),
                },
            },
            ...clientColumn,
            {
                headerElement: {
                    value: 'productName',
                    label: t('product'),
                    render: (_: unknown, row: Subscription) => <OrganismTable.Cell mainText={row.productName} />,
                },
            },
            {
                headerElement: {
                    value: 'period',
                    label: t('period'),
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell
                            mainText={t('periodValue', {
                                start: formatPosDate(row.startDate),
                                end: formatPosDate(row.endDate),
                            })}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: t('total'),
                    mobile: 'primary',
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell mainText={formatMoney(toAmount(row.total))} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('status'),
                    render: (_: unknown, row: Subscription) => {
                        const status = subscriptionDisplayStatus(row);
                        return (
                            <Badge
                                id={`subscription-status-${row.id}`}
                                text={t(`status${status}`)}
                                type={SUBSCRIPTION_STATUS_BADGE[status]}
                                size={EBadgeSize.small}
                            />
                        );
                    },
                },
            },
        ];
    }, [t, withClient]);
}
