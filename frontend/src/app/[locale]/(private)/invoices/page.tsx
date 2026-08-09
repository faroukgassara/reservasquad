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
import { fetchInvoices, deleteInvoice, formatMoney, type InvoiceRecord, type InvoiceStatus } from '@/lib/sales-api';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import Badge from '@/components/Primitives/Badge/Badge';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState = { type: 'delete'; invoice: InvoiceRecord } | null;

function invoiceStatusColor(status: InvoiceStatus): EBadgeType {
    switch (status) {
        case 'PAID':
            return EBadgeType.success;
        case 'POSTED':
            return EBadgeType.primary;
        case 'CANCELLED':
            return EBadgeType.error;
        default:
            return EBadgeType.warning;
    }
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR');
}

export default function InvoicesAdminPage() {
    const t = useTranslations('sales.invoices');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const invoiceStatusLabel = useCallback((status: InvoiceStatus): string => {
        const map: Record<InvoiceStatus, string> = {
            DRAFT: tStatus('draft'),
            POSTED: tStatus('validated'),
            PAID: tStatus('paid'),
            CANCELLED: tStatus('cancelled'),
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
        queryKey: ['invoices', page, searchValue, sortBy, sortOrder],
        queryFn: () =>
            fetchInvoices({
                page,
                perPage: 10,
                search: searchValue || undefined,
                sortBy,
                sortOrder,
            }),
        enabled: isAdmin,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    const columns = useMemo(
        (): ITableColumn<InvoiceRecord>[] => [
            {
                headerElement: {
                    value: 'number',
                    label: 'N°',
                    sortable: true,
                    render: (_: unknown, row: InvoiceRecord) => (
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
                    render: (_: unknown, row: InvoiceRecord) => (
                        <Badge
                            id={`invoice-status-${row.status}`}
                            text={invoiceStatusLabel(row.status)}
                            type={invoiceStatusColor(row.status)}
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
                    render: (_: unknown, row: InvoiceRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.total)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'issueDate',
                    label: t('issueDate'),
                    sortable: true,
                    render: (_: unknown, row: InvoiceRecord) => (
                        <OrganismTable.Cell mainText={formatDate(row.issueDate)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'dueDate',
                    label: t('dueDate'),
                    render: (_: unknown, row: InvoiceRecord) => (
                        <OrganismTable.Cell mainText={formatDate(row.dueDate)} />
                    ),
                },
            },
        ],
        [t, tCommon, invoiceStatusLabel],
    );

    const actions = useMemo(
        (): ITableAction<InvoiceRecord>[] => [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.eye,
                onClick: (row) => router.push(Routes.Invoices.show(row.id)),
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    if (row.status === 'PAID') {
                        openToast(tCommon('error'), tCommon('delete'), {
                            type: EToastType.ERROR,
                        });
                        return;
                    }
                    setModalState({ type: 'delete', invoice: row });
                    openModal();
                },
            },
        ],
        [openModal, openToast, router, tCommon],
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
                        onSubmit={() => deleteMutation.mutate(modalState.invoice.id)}
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
                    <OrganismTable<InvoiceRecord>
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
                            <Link href={Routes.Quotes.index}>
                                <Button
                                    id="invoices-add"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    text={t('createFromQuote')}
                                    iconPosition="left"
                                    icon={{
                                        name: IconComponentsEnum.plus,
                                        size: ESize.sm,
                                        color: 'text-white',
                                    }}
                                />
                            </Link>
                        }
                    />
                }
            />
        </>
    );
}
