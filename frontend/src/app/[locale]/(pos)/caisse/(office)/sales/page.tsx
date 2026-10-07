'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismPosBillingTabs from '@/components/Organisms/Pos/OrganismPosBillingTabs';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import { formatMoney } from '@/lib/daily-income-api';
import {
    fetchSaleOrders,
    formatPosDate,
    formatSaleNumber,
    personName,
    toAmount,
    type SaleOrder,
    type SaleOrderStatus,
} from '@/lib/pos-api';
import { SALE_STATUS_BADGE } from '@/lib/pos-documents';
import { Routes } from '@/lib/routes';
import { EBadgeSize, EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

const PER_PAGE = 20;
const SALE_STATUSES: SaleOrderStatus[] = ['DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED'];

type StatusFilter = 'all' | SaleOrderStatus;

export default function PosSalesPage() {
    const t = useTranslations('pos.sales');
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<StatusFilter>('all');

    const { data, isLoading } = useQuery({
        queryKey: ['sale-orders', page, search, status],
        queryFn: () =>
            fetchSaleOrders({
                page,
                perPage: PER_PAGE,
                search: search || undefined,
                status: status === 'all' ? undefined : status,
            }),
    });

    const columns = useMemo(
        (): ITableColumn<SaleOrder>[] => [
            {
                headerElement: {
                    value: 'number',
                    label: t('number'),
                    mobile: 'primary',
                    render: (_: unknown, row: SaleOrder) => (
                        <OrganismTable.Cell mainText={formatSaleNumber(row.number)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'orderDate',
                    label: t('date'),
                    render: (_: unknown, row: SaleOrder) => (
                        <OrganismTable.Cell mainText={formatPosDate(row.orderDate)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'client',
                    label: t('client'),
                    mobile: 'secondary',
                    render: (_: unknown, row: SaleOrder) => <OrganismTable.Cell mainText={personName(row.client)} />,
                },
            },
            {
                headerElement: {
                    value: 'salesperson',
                    label: t('salesperson'),
                    render: (_: unknown, row: SaleOrder) => (
                        <OrganismTable.Cell mainText={personName(row.salesperson)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: t('total'),
                    mobile: 'primary',
                    render: (_: unknown, row: SaleOrder) => {
                        const due = toAmount(row.total) - toAmount(row.amountPaid);
                        return (
                            <OrganismTable.Cell
                                mainText={formatMoney(toAmount(row.total))}
                                supportingText={
                                    row.status === 'CONFIRMED' && toAmount(row.amountPaid) > 0 && due > 0
                                        ? t('remaining', { value: formatMoney(due) })
                                        : undefined
                                }
                            />
                        );
                    },
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('status'),
                    render: (_: unknown, row: SaleOrder) => (
                        <Badge
                            id={`sale-status-${row.id}`}
                            text={t(`status${row.status}`)}
                            type={SALE_STATUS_BADGE[row.status]}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [t],
    );

    const statusOptions = [
        { value: 'all', label: t('allStatuses') },
        ...SALE_STATUSES.map((value) => ({ value, label: t(`status${value}`) })),
    ];

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            rightActions={
                <Button
                    id="sale-new"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                    text={t('new')}
                    onClick={() => router.push(Routes.Pos.sale('new'))}
                />
            }
            mainSection={
                <Div className="space-y-3">
                    <Div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <OrganismPosBillingTabs active="quotations" />
                        <Dropdown
                            leftIcon="filter"
                            options={statusOptions}
                            value={status}
                            onChange={(value) => {
                                setStatus(value as StatusFilter);
                                setPage(1);
                            }}
                            containerClassName="w-full sm:w-56"
                        />
                    </Div>
                    <OrganismTable<SaleOrder>
                        columns={columns}
                        rows={data?.data ?? []}
                        pageSize={PER_PAGE}
                        searchable
                        searchValue={search}
                        onSearchChange={(value) => {
                            setSearch(value);
                            setPage(1);
                        }}
                        placeholder={t('searchPlaceholder')}
                        isLoading={isLoading}
                        emptyMessage={t('empty')}
                        page={page}
                        totalRows={data?.meta?.total ?? 0}
                        onPageChange={setPage}
                        onClickRow={(row) => router.push(Routes.Pos.sale(row.id))}
                    />
                </Div>
            }
        />
    );
}
