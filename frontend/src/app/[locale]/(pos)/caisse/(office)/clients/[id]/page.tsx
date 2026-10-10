'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import CreditClientFormModal from '@/components/Modals/CreditClientFormModal/CreditClientFormModal';
import { toClientInput, type CreditClientFormValues } from '@/components/Organisms/OrganismClientFormFields/OrganismClientFormFields';
import CreditFormModal, { type CreditFormValues } from '@/components/Modals/CreditFormModal/CreditFormModal';
import PosOrderDetailModal from '@/components/Modals/PosOrderDetailModal/PosOrderDetailModal';
import PosStatButton from '@/components/Organisms/Pos/PosStatButton';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
    CREDIT_ERROR_PAYMENT_EXCEEDS,
    CREDIT_ERROR_REGISTER_PAYMENT,
    createCredit,
    deleteCredit,
    deleteCreditClient,
    deleteCreditPayment,
    fetchCreditClient,
    updateCreditClient,
    type CreditPaymentRecord,
    type CreditRecord,
} from '@/lib/credit-api';
import { formatMoney } from '@/lib/daily-income-api';
import { usePosSubscriptionColumns } from '@/hooks/usePosSubscriptionColumns';
import {
    fetchCurrentPosSession,
    fetchPosOrders,
    fetchSubscriptions,
    formatOrderNumber,
    formatPosDateTime,
    personName,
    toAmount,
    type PosOrder,
    type Subscription,
} from '@/lib/pos-api';
import { Routes } from '@/lib/routes';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'short', timeZone: 'UTC' });
}

type PaymentRow = CreditPaymentRecord & { creditLabel: string };

type ClientTab = 'credits' | 'payments' | 'orders' | 'subscriptions';

type ModalState =
    | { type: 'client-form' }
    | { type: 'client-delete' }
    | { type: 'credit-form' }
    | { type: 'credit-delete'; credit: CreditRecord }
    | { type: 'payment-delete'; payment: PaymentRow }
    | { type: 'order'; orderId: string }
    | null;

const ORDERS_PER_PAGE = 10;
const SUBSCRIPTIONS_PER_PAGE = 10;

export default function PosClientPage() {
    const t = useTranslations('admin.credits');
    const tClients = useTranslations('pos.clients');
    const tOrders = useTranslations('pos.orders');
    const tCommon = useTranslations('common');
    const params = useParams<{ id: string }>();
    const clientId = params.id;
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [tab, setTab] = useState<ClientTab>('credits');
    const [ordersPage, setOrdersPage] = useState(1);
    const [subscriptionsPage, setSubscriptionsPage] = useState(1);
    const tSubscriptions = useTranslations('pos.subscriptions');
    const subscriptionColumns = usePosSubscriptionColumns({ withClient: false });
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    const { data: client, isLoading } = useQuery({
        queryKey: ['credit-client', clientId],
        queryFn: () => fetchCreditClient(clientId),
    });

    const { data: orders, isLoading: ordersLoading } = useQuery({
        queryKey: ['pos-orders', 'client', clientId, ordersPage],
        queryFn: () => fetchPosOrders({ creditClientId: clientId, page: ordersPage, perPage: ORDERS_PER_PAGE }),
    });

    const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
        queryKey: ['subscriptions', 'client', clientId, subscriptionsPage],
        queryFn: () =>
            fetchSubscriptions({ clientId, page: subscriptionsPage, perPage: SUBSCRIPTIONS_PER_PAGE }),
    });

    const { data: currentSession } = useQuery({
        queryKey: ['pos-session-current'],
        queryFn: fetchCurrentPosSession,
    });

    const open = useCallback(
        (state: NonNullable<ModalState>) => {
            setModalState(state);
            openModal();
        },
        [openModal],
    );

    const translateError = useCallback(
        (error: Error) => {
            if (error.message === CREDIT_ERROR_PAYMENT_EXCEEDS) return t('paymentExceeds');
            if (error.message === CREDIT_ERROR_REGISTER_PAYMENT) return t('registerPaymentLocked');
            return error.message;
        },
        [t],
    );

    const onMutationError = (error: Error) =>
        openToast(tCommon('error'), translateError(error), { type: EToastType.ERROR });

    const invalidateClients = () => {
        void queryClient.invalidateQueries({ queryKey: ['credit-client', clientId] });
        void queryClient.invalidateQueries({ queryKey: ['credit-clients'] });
        void queryClient.invalidateQueries({ queryKey: ['credit-summary'] });
    };

    const onMutationSuccess = (message: string) => {
        invalidateClients();
        openToast(tCommon('success'), message, { type: EToastType.SUCCESS });
        closeModal();
    };

    const updateClientMutation = useMutation({
        mutationFn: (body: Parameters<typeof updateCreditClient>[1]) => updateCreditClient(clientId, body),
        onSuccess: () => onMutationSuccess(tCommon('save')),
        onError: onMutationError,
    });

    const deleteClientMutation = useMutation({
        mutationFn: () => deleteCreditClient(clientId),
        onSuccess: () => {
            invalidateClients();
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            closeModal();
            router.push(Routes.Pos.clients);
        },
        onError: onMutationError,
    });

    const invalidateProducts = () => {
        void queryClient.invalidateQueries({ queryKey: ['pos-products'] });
        void queryClient.invalidateQueries({ queryKey: ['pos-products-available'] });
        void queryClient.invalidateQueries({ queryKey: ['pos-product-stats'] });
    };

    const createCreditMutation = useMutation({
        mutationFn: createCredit,
        onSuccess: () => {
            invalidateProducts();
            onMutationSuccess(t('createCredit'));
        },
        onError: onMutationError,
    });

    const deleteCreditMutation = useMutation({
        mutationFn: deleteCredit,
        onSuccess: () => {
            invalidateProducts();
            onMutationSuccess(tCommon('delete'));
        },
        onError: onMutationError,
    });

    const deletePaymentMutation = useMutation({
        mutationFn: deleteCreditPayment,
        onSuccess: () => onMutationSuccess(tCommon('delete')),
        onError: onMutationError,
    });

    const credits = useMemo(() => client?.credits ?? [], [client]);
    const clientName = client ? `${client.firstName} ${client.lastName}` : '';

    const creditLabel = useCallback(
        (credit: CreditRecord) => credit.description?.trim() || t('creditOf', { date: formatDate(credit.date) }),
        [t],
    );

    const payments = useMemo(
        (): PaymentRow[] =>
            credits
                .flatMap((credit) =>
                    credit.payments.map((payment) => ({ ...payment, creditLabel: creditLabel(credit) })),
                )
                .sort((a, b) => b.date.localeCompare(a.date)),
        [creditLabel, credits],
    );

    const handleClientSubmit = async (values: CreditClientFormValues) => {
        await updateClientMutation.mutateAsync(toClientInput(values));
    };

    const handleCreditSubmit = async (values: CreditFormValues) => {
        await createCreditMutation.mutateAsync({
            clientId,
            date: values.date,
            productId: values.productId,
            quantity: values.quantity,
            description: values.description.trim() || undefined,
        });
    };

    const creditColumns = useMemo(
        (): ITableColumn<CreditRecord>[] => [
            {
                headerElement: {
                    value: 'date',
                    label: t('date'),
                    mobile: 'primary',
                    render: (_: unknown, row: CreditRecord) => (
                        <OrganismTable.Cell
                            mainText={formatDate(row.date)}
                            supportingText={row.description ?? undefined}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'amount',
                    label: t('amount'),
                    mobile: 'secondary',
                    render: (_: unknown, row: CreditRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.totalCredit)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'paid',
                    label: t('totalPaid'),
                    mobile: 'secondary',
                    render: (_: unknown, row: CreditRecord) => <OrganismTable.Cell mainText={formatMoney(row.totalPaid)} />,
                },
            },
            {
                headerElement: {
                    value: 'remaining',
                    label: t('remaining'),
                    mobile: 'primary',
                    render: (_: unknown, row: CreditRecord) => (
                        <Badge
                            id={`credit-remaining-${row.id}`}
                            text={row.remaining > 0 ? formatMoney(row.remaining) : t('settled')}
                            type={row.remaining > 0 ? EBadgeType.warning : EBadgeType.success}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [t],
    );

    const creditActions = useMemo(
        (): ITableAction<CreditRecord>[] | undefined =>
            isAdmin
                ? [
                      {
                          label: tCommon('delete'),
                          iconName: IconComponentsEnum.trash,
                          onClick: (row) => open({ type: 'credit-delete', credit: row }),
                      },
                  ]
                : undefined,
        [isAdmin, open, tCommon],
    );

    const paymentColumns = useMemo(
        (): ITableColumn<PaymentRow>[] => [
            {
                headerElement: {
                    value: 'date',
                    label: t('date'),
                    mobile: 'primary',
                    render: (_: unknown, row: PaymentRow) => <OrganismTable.Cell mainText={formatDate(row.date)} />,
                },
            },
            {
                headerElement: {
                    value: 'credit',
                    label: t('credit'),
                    mobile: 'secondary',
                    render: (_: unknown, row: PaymentRow) => <OrganismTable.Cell mainText={row.creditLabel} />,
                },
            },
            {
                headerElement: {
                    value: 'amount',
                    label: t('amount'),
                    mobile: 'primary',
                    render: (_: unknown, row: PaymentRow) => <OrganismTable.Cell mainText={formatMoney(row.amount)} />,
                },
            },
            {
                headerElement: {
                    value: 'note',
                    label: t('note'),
                    mobile: 'secondary',
                    render: (_: unknown, row: PaymentRow) => <OrganismTable.Cell mainText={row.note ?? '—'} />,
                },
            },
        ],
        [t],
    );

    const paymentActions = useMemo(
        (): ITableAction<PaymentRow>[] =>
            isAdmin
                ? [
                      {
                          label: tCommon('delete'),
                          iconName: IconComponentsEnum.trash,
                          onClick: (row) => open({ type: 'payment-delete', payment: row }),
                      },
                  ]
                : [],
        [isAdmin, open, tCommon],
    );

    const orderColumns = useMemo(
        (): ITableColumn<PosOrder>[] => [
            {
                headerElement: {
                    value: 'number',
                    label: tOrders('number'),
                    mobile: 'primary',
                    render: (_: unknown, row: PosOrder) => (
                        <OrganismTable.Cell
                            mainText={formatOrderNumber(row.number)}
                            supportingText={formatPosDateTime(row.createdAt)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'cashier',
                    label: tOrders('cashier'),
                    render: (_: unknown, row: PosOrder) => <OrganismTable.Cell mainText={personName(row.cashier)} />,
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: tOrders('total'),
                    mobile: 'primary',
                    render: (_: unknown, row: PosOrder) => (
                        <OrganismTable.Cell mainText={formatMoney(toAmount(row.total))} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: tOrders('status'),
                    render: (_: unknown, row: PosOrder) => (
                        <Badge
                            id={`pos-client-order-status-${row.id}`}
                            text={row.status === 'REFUND' ? tOrders('statusRefund') : tOrders('statusPaid')}
                            type={row.status === 'REFUND' ? EBadgeType.warning : EBadgeType.success}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [tOrders],
    );

    const deleteConfirmation = (description: string, onSubmit: () => void, loading: boolean) => (
        <ConfirmationModal
            title={tCommon('delete')}
            description={description}
            submitBtnText={tCommon('delete')}
            cancelBtnText={tCommon('cancel')}
            onSubmit={onSubmit}
            isLoading={loading}
            icon={IconComponentsEnum.info}
            iconBgColor="bg-danger-100"
            iconColor="text-danger-600"
        />
    );

    const renderModalContent = () => {
        switch (modalState?.type) {
            case 'client-form':
                return (
                    <CreditClientFormModal
                        client={client ?? null}
                        onSubmit={handleClientSubmit}
                        isLoading={updateClientMutation.isPending}
                    />
                );
            case 'client-delete':
                return deleteConfirmation(
                    t('deleteClientConfirm'),
                    () => deleteClientMutation.mutate(),
                    deleteClientMutation.isPending,
                );
            case 'credit-form':
                return (
                    <CreditFormModal
                        clientName={clientName}
                        onSubmit={handleCreditSubmit}
                        isLoading={createCreditMutation.isPending}
                    />
                );
            case 'credit-delete':
                return deleteConfirmation(
                    t('deleteCreditConfirm'),
                    () => deleteCreditMutation.mutate(modalState.credit.id),
                    deleteCreditMutation.isPending,
                );
            case 'payment-delete':
                return deleteConfirmation(
                    t('deletePaymentConfirm'),
                    () => deletePaymentMutation.mutate(modalState.payment.id),
                    deletePaymentMutation.isPending,
                );
            case 'order':
                return <PosOrderDetailModal orderId={modalState.orderId} canRefund={!!currentSession} />;
            default:
                return null;
        }
    };

    const backButton = (
        <Button
            id="pos-client-back"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.md, color: 'text-primary-600' }}
            onClick={() => router.push(Routes.Pos.clients)}
            aria-label={tCommon('back')}
            className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );

    const headerActions = (
        <Div className="flex gap-2">
            <Button
                id="pos-client-edit"
                type={EButtonType.secondary}
                size={EButtonSize.medium}
                iconPosition="left"
                icon={{ name: IconComponentsEnum.edit, size: ESize.sm, color: 'text-primary-500' }}
                text={tCommon('edit')}
                disabled={!client}
                onClick={() => open({ type: 'client-form' })}
            />
            {isAdmin ? (
                <Button
                    id="pos-client-delete"
                    type={EButtonType.secondary}
                    size={EButtonSize.medium}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.trash, size: ESize.sm, color: 'text-danger-600' }}
                    text={tCommon('delete')}
                    disabled={!client}
                    onClick={() => open({ type: 'client-delete' })}
                />
            ) : null}
        </Div>
    );

    const tabOptions = [
        { value: 'credits', label: t('creditsTitle') },
        { value: 'payments', label: t('paymentsTitle') },
        { value: 'orders', label: tClients('ordersTab') },
        { value: 'subscriptions', label: tClients('subscriptionsTab') },
    ];

    return (
        <>
            {modalPortal(renderModalContent())}
            <LayoutWrapper
                title={tClients('title')}
                subTitle={clientName || '…'}
                leftActions={backButton}
                rightActions={headerActions}
                mainSection={
                    isLoading || !client ? (
                        <Div className="flex min-h-48 items-center justify-center py-16">
                            <Spinner color="text-primary-500" size={ESize.lg} />
                        </Div>
                    ) : (
                        <Div className="space-y-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <Div className="flex flex-col justify-end border-b border-gray-100 sm:flex-row">
                                <PosStatButton
                                    icon={IconComponentsEnum.calendar}
                                    value={String(subscriptions?.meta?.total ?? 0)}
                                    label={tClients('subscriptionsTab')}
                                    onClick={() => setTab('subscriptions')}
                                />
                                <PosStatButton
                                    icon={IconComponentsEnum.shoppingCart}
                                    value={String(orders?.meta?.total ?? 0)}
                                    label={tClients('ordersTab')}
                                    onClick={() => setTab('orders')}
                                />
                                <PosStatButton
                                    icon={IconComponentsEnum.layers}
                                    value={formatMoney(client.totalCredit)}
                                    label={t('totalCredit')}
                                    onClick={() => setTab('credits')}
                                />
                                <PosStatButton
                                    icon={IconComponentsEnum.checkCircle}
                                    value={formatMoney(client.totalPaid)}
                                    label={t('totalPaid')}
                                    onClick={() => setTab('payments')}
                                />
                            </Div>

                            <Div className="flex flex-wrap items-center gap-3 px-4 sm:flex-nowrap sm:gap-5 sm:px-6">
                                <Div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 sm:size-20">
                                    <Icon name={IconComponentsEnum.user} size={ESize.xl} color="text-gray-400" />
                                </Div>
                                <Div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <Label variant={EVariantLabel.h4} color="text-gray-900" className="truncate">
                                        {clientName}
                                    </Label>
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="break-all">
                                        {[client.phone || t('noPhone'), client.email].filter(Boolean).join(' · ')}
                                    </Label>
                                    {client.address || client.taxId || client.cin ? (
                                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                            {[
                                                client.address,
                                                client.cin ? tClients('cinValue', { value: client.cin }) : null,
                                                client.taxId ? tClients('taxIdValue', { value: client.taxId }) : null,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </Label>
                                    ) : null}
                                </Div>
                                <Div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end sm:gap-1">
                                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                                        {t('remaining')}
                                    </Label>
                                    <Badge
                                        id="pos-client-remaining"
                                        text={client.remaining > 0 ? formatMoney(client.remaining) : t('settled')}
                                        type={client.remaining > 0 ? EBadgeType.warning : EBadgeType.success}
                                        size={EBadgeSize.medium}
                                    />
                                </Div>
                            </Div>

                            <Div className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
                                <Div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <Tabs
                                        variant="pills"
                                        options={tabOptions}
                                        value={tab}
                                        onChange={(value) => setTab(value as ClientTab)}
                                        className="w-full sm:w-auto"
                                    />
                                    {tab === 'credits' ? (
                                        <Button
                                            id="credit-add-btn"
                                            type={EButtonType.primary}
                                            size={EButtonSize.medium}
                                            iconPosition="left"
                                            icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                                            text={t('createCredit')}
                                            onClick={() => open({ type: 'credit-form' })}
                                        />
                                    ) : null}
                                    {tab === 'subscriptions' ? (
                                        <Button
                                            id="client-subscription-add-btn"
                                            type={EButtonType.primary}
                                            size={EButtonSize.medium}
                                            iconPosition="left"
                                            icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                                            text={tSubscriptions('new')}
                                            onClick={() => router.push(Routes.Pos.newSubscriptionFor(clientId))}
                                        />
                                    ) : null}
                                </Div>

                                {tab === 'credits' ? (
                                    <OrganismTable<CreditRecord>
                                        columns={creditColumns}
                                        rows={credits}
                                        pageSize={Math.max(credits.length, 1)}
                                        searchable={false}
                                        actions={creditActions}
                                        emptyMessage={t('emptyCredits')}
                                        page={1}
                                        totalRows={credits.length}
                                        onPageChange={() => undefined}
                                    />
                                ) : null}

                                {tab === 'payments' ? (
                                    <OrganismTable<PaymentRow>
                                        columns={paymentColumns}
                                        rows={payments}
                                        pageSize={Math.max(payments.length, 1)}
                                        searchable={false}
                                        actions={paymentActions.length > 0 ? paymentActions : undefined}
                                        emptyMessage={t('emptyPayments')}
                                        page={1}
                                        totalRows={payments.length}
                                        onPageChange={() => undefined}
                                    />
                                ) : null}

                                {tab === 'orders' ? (
                                    <OrganismTable<PosOrder>
                                        columns={orderColumns}
                                        rows={orders?.data ?? []}
                                        pageSize={ORDERS_PER_PAGE}
                                        searchable={false}
                                        isLoading={ordersLoading}
                                        emptyMessage={tOrders('empty')}
                                        page={ordersPage}
                                        totalRows={orders?.meta?.total ?? 0}
                                        onPageChange={setOrdersPage}
                                        onClickRow={(row) => open({ type: 'order', orderId: row.id })}
                                    />
                                ) : null}

                                {tab === 'subscriptions' ? (
                                    <OrganismTable<Subscription>
                                        columns={subscriptionColumns}
                                        rows={subscriptions?.data ?? []}
                                        pageSize={SUBSCRIPTIONS_PER_PAGE}
                                        searchable={false}
                                        isLoading={subscriptionsLoading}
                                        emptyMessage={tSubscriptions('empty')}
                                        page={subscriptionsPage}
                                        totalRows={subscriptions?.meta?.total ?? 0}
                                        onPageChange={setSubscriptionsPage}
                                        onClickRow={(row) => router.push(Routes.Pos.subscription(row.id))}
                                    />
                                ) : null}
                            </Div>
                        </Div>
                    )
                }
            />
        </>
    );
}
