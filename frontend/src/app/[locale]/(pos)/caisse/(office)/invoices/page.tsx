'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismPosBillingTabs from '@/components/Organisms/Pos/OrganismPosBillingTabs';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Label from '@/components/Primitives/Label/Label';
import { formatMoney } from '@/lib/daily-income-api';
import {
    fetchInvoices,
    formatPosDate,
    personName,
    toAmount,
    todayInput,
    type Invoice,
    type InvoicePaymentState,
    type InvoiceStatus,
    type InvoiceType,
} from '@/lib/pos-api';
import { INVOICE_STATUS_BADGE, PAYMENT_STATE_BADGE } from '@/lib/pos-documents';
import { Routes } from '@/lib/routes';
import { EBadgeSize, EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

const PER_PAGE = 20;
const INVOICE_STATUSES: InvoiceStatus[] = ['DRAFT', 'POSTED', 'CANCELLED'];
const PAYMENT_STATES: InvoicePaymentState[] = ['NOT_PAID', 'PARTIAL', 'PAID'];

export default function PosInvoicesPage() {
    const t = useTranslations('pos.invoices');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [type, setType] = useState<'all' | InvoiceType>('all');
    const [status, setStatus] = useState<'all' | InvoiceStatus>('all');
    const [paymentState, setPaymentState] = useState<'all' | InvoicePaymentState>('all');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const hasActiveFilters = type !== 'all' || status !== 'all' || paymentState !== 'all';

    const { data, isLoading } = useQuery({
        queryKey: ['invoices', page, search, type, status, paymentState],
        queryFn: () =>
            fetchInvoices({
                page,
                perPage: PER_PAGE,
                search: search || undefined,
                type: type === 'all' ? undefined : type,
                status: status === 'all' ? undefined : status,
                paymentState: paymentState === 'all' ? undefined : paymentState,
            }),
    });

    const columns = useMemo((): ITableColumn<Invoice>[] => {
        const today = todayInput();
        return [
            {
                headerElement: {
                    value: 'number',
                    label: t('number'),
                    mobile: 'primary',
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell
                            mainText={row.displayNumber === '/' ? t('draftNumber') : row.displayNumber}
                            supportingText={row.type === 'CREDIT_NOTE' ? t('typeCREDIT_NOTE') : undefined}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'client',
                    label: t('client'),
                    mobile: 'secondary',
                    render: (_: unknown, row: Invoice) => <OrganismTable.Cell mainText={personName(row.client)} />,
                },
            },
            {
                headerElement: {
                    value: 'invoiceDate',
                    label: t('date'),
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell mainText={formatPosDate(row.invoiceDate)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'dueDate',
                    label: t('dueDate'),
                    render: (_: unknown, row: Invoice) => {
                        if (!row.dueDate) return <OrganismTable.Cell mainText="—" />;
                        const overdue =
                            row.status === 'POSTED' && row.paymentState !== 'PAID' && row.dueDate.slice(0, 10) < today;
                        return (
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color={overdue ? 'text-danger-600' : 'text-gray-900'}
                                className={overdue ? 'font-semibold' : ''}
                            >
                                {formatPosDate(row.dueDate)}
                            </Label>
                        );
                    },
                },
            },
            {
                headerElement: {
                    value: 'untaxed',
                    label: t('untaxed'),
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell mainText={formatMoney(toAmount(row.untaxed))} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: t('total'),
                    mobile: 'primary',
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell
                            mainText={formatMoney(toAmount(row.total))}
                            supportingText={
                                row.status === 'POSTED' && row.amountDue > 0
                                    ? t('amountDueShort', { value: formatMoney(row.amountDue) })
                                    : undefined
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'paymentState',
                    label: t('paymentState'),
                    render: (_: unknown, row: Invoice) =>
                        row.status === 'POSTED' ? (
                            <Badge
                                id={`invoice-payment-${row.id}`}
                                text={t(`payment${row.paymentState}`)}
                                type={PAYMENT_STATE_BADGE[row.paymentState]}
                                size={EBadgeSize.small}
                            />
                        ) : (
                            <OrganismTable.Cell mainText="—" />
                        ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('status'),
                    render: (_: unknown, row: Invoice) => (
                        <Badge
                            id={`invoice-status-${row.id}`}
                            text={t(`status${row.status}`)}
                            type={INVOICE_STATUS_BADGE[row.status]}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ];
    }, [t]);

    const resetPage = () => setPage(1);

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            rightActions={
                <Button
                    id="invoice-new"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                    text={t('new')}
                    onClick={() => router.push(Routes.Pos.invoice('new'))}
                />
            }
            mainSection={
                <Div className="space-y-3">
                    <Div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                        <Div className="flex items-center gap-2">
                            <OrganismPosBillingTabs active="invoices" />
                            <Button
                                id="invoice-filters-toggle"
                                type={hasActiveFilters ? EButtonType.primary : EButtonType.secondary}
                                size={EButtonSize.medium}
                                iconPosition="only"
                                icon={{
                                    name: IconComponentsEnum.filter,
                                    size: ESize.sm,
                                    color: hasActiveFilters ? 'text-white' : 'text-primary-500',
                                }}
                                onClick={() => setFiltersOpen((open) => !open)}
                                aria-label={tCommon('filter')}
                                aria-expanded={filtersOpen}
                                aria-controls="invoice-filters"
                                className="shrink-0 sm:hidden"
                            />
                        </Div>
                        <Div
                            id="invoice-filters"
                            className={twMerge(
                                'flex-1 flex-col gap-2 sm:flex sm:flex-row sm:justify-end',
                                filtersOpen ? 'flex' : 'hidden',
                            )}
                        >
                        <Dropdown
                            options={[
                                { value: 'all', label: t('allTypes') },
                                { value: 'INVOICE', label: t('typeINVOICE') },
                                { value: 'CREDIT_NOTE', label: t('typeCREDIT_NOTE') },
                            ]}
                            value={type}
                            onChange={(value) => {
                                setType(value as 'all' | InvoiceType);
                                resetPage();
                            }}
                            containerClassName="w-full sm:w-44"
                        />
                        <Dropdown
                            options={[
                                { value: 'all', label: t('allStatuses') },
                                ...INVOICE_STATUSES.map((value) => ({ value, label: t(`status${value}`) })),
                            ]}
                            value={status}
                            onChange={(value) => {
                                setStatus(value as 'all' | InvoiceStatus);
                                resetPage();
                            }}
                            containerClassName="w-full sm:w-44"
                        />
                        <Dropdown
                            leftIcon="filter"
                            options={[
                                { value: 'all', label: t('allPaymentStates') },
                                ...PAYMENT_STATES.map((value) => ({ value, label: t(`payment${value}`) })),
                            ]}
                            value={paymentState}
                            onChange={(value) => {
                                setPaymentState(value as 'all' | InvoicePaymentState);
                                resetPage();
                            }}
                            containerClassName="w-full sm:w-52"
                        />
                        </Div>
                    </Div>
                    <OrganismTable<Invoice>
                        columns={columns}
                        rows={data?.data ?? []}
                        pageSize={PER_PAGE}
                        searchable
                        searchValue={search}
                        onSearchChange={(value) => {
                            setSearch(value);
                            resetPage();
                        }}
                        placeholder={t('searchPlaceholder')}
                        isLoading={isLoading}
                        emptyMessage={t('empty')}
                        page={page}
                        totalRows={data?.meta?.total ?? 0}
                        onPageChange={setPage}
                        onClickRow={(row) => router.push(Routes.Pos.invoice(row.id))}
                    />
                </Div>
            }
        />
    );
}
