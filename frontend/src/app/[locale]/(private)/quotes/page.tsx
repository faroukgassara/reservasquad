'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import { EBadgeSize, EBadgeType, EButtonSize, EButtonType, ESize, EToastType, IconComponentsEnum } from '@/Enum/Enum';
import { fetchQuotes, deleteQuote, convertQuoteToInvoice, formatMoney, type QuoteRecord, type QuoteStatus } from '@/lib/sales-api';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import Badge from '@/components/Primitives/Badge/Badge';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState = { type: 'delete'; quote: QuoteRecord } | null;

function quoteStatusColor(status: QuoteStatus): EBadgeType {
    switch (status) {
        case 'ACCEPTED':
        case 'CONVERTED':
            return EBadgeType.success;
        case 'SENT':
            return EBadgeType.primary;
        case 'REJECTED':
        case 'EXPIRED':
            return EBadgeType.error;
        default:
            return EBadgeType.warning;
    }
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR');
}

export default function QuotesAdminPage() {
    const t = useTranslations('sales.quotes');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const quoteStatusLabel = useCallback((status: QuoteStatus): string => {
        const map: Partial<Record<QuoteStatus, string>> = {
            DRAFT: tStatus('draft'),
            SENT: tStatus('sent'),
            ACCEPTED: tStatus('accepted'),
            REJECTED: tStatus('rejected'),
        };
        return map[status] ?? status;
    }, [tStatus]);

    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Dashboard);
    }, [isAdmin, router]);

    const { data, isLoading } = useQuery({
        queryKey: ['quotes', page, searchValue, sortBy, sortOrder],
        queryFn: () =>
            fetchQuotes({
                page,
                perPage: 10,
                search: searchValue || undefined,
                sortBy,
                sortOrder,
            }),
        enabled: isAdmin,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteQuote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    const convertMutation = useMutation({
        mutationFn: convertQuoteToInvoice,
        onSuccess: (invoice) => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            openToast(tCommon('success'), invoice.number, { type: EToastType.SUCCESS });
            router.push(Routes.Invoices.show(invoice.id));
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    const columns = useMemo(
        (): ITableColumn<QuoteRecord>[] => [
            {
                headerElement: {
                    value: 'number',
                    label: 'N°',
                    sortable: true,
                    render: (_: unknown, row: QuoteRecord) => (
                        <OrganismTable.Cell
                            mainText={row.number}
                            supportingText={row.customer?.name}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: tCommon('status'),
                    render: (_: unknown, row: QuoteRecord) => (
                        <Badge
                            id={`quote-status-${row.status}`}
                            text={quoteStatusLabel(row.status)}
                            type={quoteStatusColor(row.status)}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: t('total'),
                    sortable: true,
                    render: (_: unknown, row: QuoteRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.total)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'validUntil',
                    label: t('validUntil'),
                    render: (_: unknown, row: QuoteRecord) => (
                        <OrganismTable.Cell mainText={formatDate(row.validUntil)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'createdAt',
                    label: t('validUntil'),
                    sortable: true,
                    render: (_: unknown, row: QuoteRecord) => (
                        <OrganismTable.Cell mainText={formatDate(row.createdAt)} />
                    ),
                },
            },
        ],
        [t, tCommon, quoteStatusLabel],
    );

    const actions = useMemo(
        (): ITableAction<QuoteRecord>[] => [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.eye,
                onClick: (row) => router.push(Routes.Quotes.show(row.id)),
            },
            {
                label: t('convert'),
                iconName: IconComponentsEnum.filetext,
                onClick: (row) => convertMutation.mutate(row.id),
                isVisible: (row) => row.status !== 'CONVERTED' && !row.invoice,
            },
            {
                label: t('convert'),
                iconName: IconComponentsEnum.filetext,
                onClick: (row) => {
                    if (row.invoice) router.push(Routes.Invoices.show(row.invoice.id));
                },
                isVisible: (row) => !!row.invoice,
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    if (row.status === 'CONVERTED') {
                        openToast(tCommon('error'), tCommon('delete'), {
                            type: EToastType.ERROR,
                        });
                        return;
                    }
                    setModalState({ type: 'delete', quote: row });
                    openModal();
                },
            },
        ],
        [convertMutation, openModal, openToast, router, t, tCommon],
    );

    if (!isAdmin) return null;

    return (
        <>
            {modalPortal(
                modalState?.type === 'delete' ? (
                    <ConfirmationModal
                        title={tCommon('delete')}
                        description={tCommon('confirm')}
                        submitBtnText={tCommon('delete')}
                        cancelBtnText={tCommon('cancel')}
                        onSubmit={() => deleteMutation.mutate(modalState.quote.id)}
                        isLoading={deleteMutation.isPending}
                        icon={IconComponentsEnum.info}
                        iconBgColor="bg-danger-100"
                        iconColor="text-danger-600"
                    />
                ) : null,
            )}

            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <OrganismTable<QuoteRecord>
                        columns={columns}
                        rows={data?.data ?? []}
                        pageSize={10}
                        searchable
                        searchValue={searchValue}
                        onSearchChange={(v) => {
                            setSearchValue(v);
                            setPage(1);
                        }}
                        placeholder={tCommon('search')}
                        actions={actions}
                        isLoading={isLoading}
                        emptyMessage={t('empty')}
                        page={page}
                        totalRows={data?.meta?.total ?? 0}
                        onPageChange={setPage}
                        sortConfig={{ key: sortBy, direction: sortOrder }}
                        onSort={(key, direction) => {
                            setSortBy(key);
                            setSortOrder(direction);
                            setPage(1);
                        }}
                        primaryAction={
                            <Link href={Routes.Quotes.new}>
                                <Button
                                    id="quotes-add"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    iconPosition="left"
                                    icon={{
                                        name: IconComponentsEnum.plus,
                                        size: ESize.sm,
                                        color: 'text-white',
                                    }}
                                    text={t('add')}
                                />
                            </Link>
                        }
                    />
                }
            />
        </>
    );
}
