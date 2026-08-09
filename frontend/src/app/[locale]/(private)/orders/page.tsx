'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Badge from '@/components/Primitives/Badge/Badge';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import OrderFilterModal from '@/components/Modals/OrderFilterModal/OrderFilterModal';
import OrderDetailModal from '@/components/Modals/OrderDetailModal/OrderDetailModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { EBadgeSize, EBadgeType, EToastType, IconComponentsEnum } from '@/Enum/Enum';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';
import {
    deleteOrder,
    fetchOrderById,
    fetchOrders,
    updateOrderStatus,
    type OrderRecord,
    type OrderStatus,
} from '@/lib/order-api';
import { formatProductMoney } from '@/lib/product-api';
import { useRouter } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';

function statusBadgeType(status: OrderStatus): EBadgeType {
    if (status === 'CONFIRMED') return EBadgeType.success;
    if (status === 'CANCELLED') return EBadgeType.error;
    return EBadgeType.warning;
}

type ModalState =
    | { type: 'detail'; order: OrderRecord }
    | { type: 'status'; order: OrderRecord; status: OrderStatus }
    | { type: 'delete'; order: OrderRecord }
    | { type: 'filter' }
    | null;

export default function OrdersAdminPage() {
    const t = useTranslations('admin.orders');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const tCheckout = useTranslations('checkout');
    const locale = useLocale();
    const router = useRouter();
    const { isAllowed } = useAuthorization();

    useEffect(() => {
        if (!isAllowed({ anyRoles: ['ADMIN'] })) {
            router.replace(Routes.Dashboard);
        }
    }, [isAllowed, router]);

    const statusLabel = useCallback(
        (status: OrderStatus): string => {
            if (status === 'CONFIRMED') return tStatus('confirmed');
            if (status === 'CANCELLED') return tStatus('cancelled');
            return tStatus('pending');
        },
        [tStatus],
    );

    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    const openFilterDrawer = useCallback(() => {
        setModalState({ type: 'filter' });
        openModal();
    }, [openModal]);

    const { data, isLoading } = useQuery({
        queryKey: ['orders', page, searchValue, sortBy, sortOrder, statusFilter],
        queryFn: () =>
            fetchOrders({
                page,
                perPage: 10,
                search: searchValue || undefined,
                sortBy,
                sortOrder,
                status: statusFilter,
            }),
        enabled: isAllowed({ anyRoles: ['ADMIN'] }),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
            updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            openToast(tCommon('success'), t('statusUpdated'), { type: EToastType.SUCCESS });
            closeModal();
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteOrder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            closeModal();
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const openDetail = async (row: OrderRecord) => {
        try {
            const full = await fetchOrderById(row.id);
            setModalState({ type: 'detail', order: full });
            openModal();
        } catch (error) {
            openToast(
                tCommon('error'),
                error instanceof Error ? error.message : tCommon('error'),
                { type: EToastType.ERROR },
            );
        }
    };

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const filterTags = useMemo(() => {
        if (!statusFilter) return [];
        return [`${tCommon('status')}: ${statusLabel(statusFilter)}`];
    }, [statusFilter, statusLabel, tCommon]);

    const columns = useMemo(
        (): ITableColumn<OrderRecord>[] => [
            {
                headerElement: {
                    value: 'number',
                    label: t('columns.number'),
                    sortable: true,
                    width: '140px',
                    render: (_: unknown, row: OrderRecord) => (
                        <OrganismTable.Cell mainText={row.number} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'firstName',
                    label: t('columns.customer'),
                    sortable: true,
                    render: (_: unknown, row: OrderRecord) => (
                        <OrganismTable.Cell
                            mainText={`${row.firstName} ${row.lastName}`}
                            supportingText={row.email}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'shippingMethod',
                    label: t('columns.shipping'),
                    render: (_: unknown, row: OrderRecord) => (
                        <OrganismTable.Cell
                            mainText={tCheckout(`shippingMethods.${row.shippingMethod}.label`)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: t('columns.total'),
                    sortable: true,
                    width: '120px',
                    render: (_: unknown, row: OrderRecord) => (
                        <OrganismTable.Cell mainText={formatProductMoney(row.total, locale)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: tCommon('status'),
                    sortable: true,
                    width: '130px',
                    render: (val: OrderStatus) => (
                        <Badge
                            id={`order-status-${val}`}
                            text={statusLabel(val)}
                            type={statusBadgeType(val)}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'createdAt',
                    label: t('columns.date'),
                    sortable: true,
                    width: '160px',
                    render: (val: string) => (
                        <OrganismTable.Cell
                            mainText={
                                val
                                    ? new Date(val).toLocaleDateString(locale, {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                      })
                                    : '—'
                            }
                            supportingText={
                                val
                                    ? new Date(val).toLocaleTimeString(locale, {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : undefined
                            }
                        />
                    ),
                },
            },
        ],
        [locale, statusLabel, t, tCheckout, tCommon],
    );

    const actions = useMemo(
        (): ITableAction<OrderRecord>[] => [
            {
                label: t('view'),
                iconName: IconComponentsEnum.eye,
                onClick: (row) => {
                    void openDetail(row);
                },
            },
            {
                label: t('confirm'),
                iconName: IconComponentsEnum.checkCircle,
                isVisible: (row) => row.status === 'PENDING',
                onClick: (row) => {
                    setModalState({ type: 'status', order: row, status: 'CONFIRMED' });
                    openModal();
                },
            },
            {
                label: t('cancelOrder'),
                iconName: IconComponentsEnum.close,
                isVisible: (row) => row.status !== 'CANCELLED',
                onClick: (row) => {
                    setModalState({ type: 'status', order: row, status: 'CANCELLED' });
                    openModal();
                },
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'delete', order: row });
                    openModal();
                },
            },
        ],
        [openModal, t, tCommon],
    );

    const renderStatusModal = (state: ModalState & { type: 'status' }) => {
        const isConfirm = state.status === 'CONFIRMED';
        return (
            <ConfirmationModal
                title={isConfirm ? t('confirm') : t('cancelOrder')}
                description={t(isConfirm ? 'confirmStatus' : 'cancelStatus', { number: state.order.number })}
                submitBtnText={isConfirm ? t('confirm') : t('cancelOrder')}
                cancelBtnText={tCommon('cancel')}
                isLoading={statusMutation.isPending}
                icon={isConfirm ? IconComponentsEnum.checkCircle : IconComponentsEnum.alert}
                iconBgColor={isConfirm ? 'bg-success-100' : 'bg-danger-100'}
                iconColor={isConfirm ? 'text-success-600' : 'text-danger-600'}
                onSubmit={() => statusMutation.mutate({ id: state.order.id, status: state.status })}
            />
        );
    };

    const renderModal = () => {
        if (!modalState) return null;
        if (modalState.type === 'filter') {
            return (
                <OrderFilterModal
                    status={statusFilter}
                    onApply={(s) => {
                        setStatusFilter(s);
                        setPage(1);
                        closeModal();
                        setModalState(null);
                    }}
                    onReset={() => {
                        setStatusFilter(undefined);
                        setPage(1);
                        closeModal();
                        setModalState(null);
                    }}
                />
            );
        }
        if (modalState.type === 'detail') return <OrderDetailModal order={modalState.order} statusLabel={statusLabel} />;
        if (modalState.type === 'status') return renderStatusModal(modalState);
        return (
            <ConfirmationModal
                title={tCommon('delete')}
                description={t('confirmDelete', { number: modalState.order.number })}
                submitBtnText={tCommon('delete')}
                cancelBtnText={tCommon('cancel')}
                isLoading={deleteMutation.isPending}
                icon={IconComponentsEnum.trash}
                iconBgColor="bg-danger-100"
                iconColor="text-danger-600"
                onSubmit={() => deleteMutation.mutate(modalState.order.id)}
            />
        );
    };

    if (!isAllowed({ anyRoles: ['ADMIN'] })) {
        return null;
    }

    return (
        <>
            {modalState && modalPortal(renderModal())}

            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <div className="min-h-full">
                        <OrganismTable<OrderRecord>
                            columns={columns}
                            rows={rows}
                            pageSize={10}
                            searchable
                            searchValue={searchValue}
                            onSearchChange={(v) => {
                                setSearchValue(v);
                                setPage(1);
                            }}
                            placeholder={t('search')}
                            actions={actions}
                            isLoading={isLoading}
                            emptyMessage={t('empty')}
                            page={page}
                            totalRows={totalRows}
                            onPageChange={setPage}
                            sortConfig={{ key: sortBy, direction: sortOrder }}
                            onSort={(key, direction) => {
                                setSortBy(key);
                                setSortOrder(direction);
                                setPage(1);
                            }}
                            filterTags={filterTags}
                            onRemoveTag={(tag) => {
                                if (tag.startsWith(`${tCommon('status')}:`)) {
                                    setStatusFilter(undefined);
                                }
                                setPage(1);
                            }}
                            onReset={() => {
                                setStatusFilter(undefined);
                                setPage(1);
                            }}
                            onClickFilter={openFilterDrawer}
                        />
                    </div>
                }
            />
        </>
    );
}
