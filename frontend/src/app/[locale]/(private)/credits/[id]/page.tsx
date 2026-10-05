'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import CreditFormModal, {
    type CreditFormValues,
} from '@/components/Modals/CreditFormModal/CreditFormModal';
import CreditPaymentFormModal, {
    type CreditPaymentFormValues,
} from '@/components/Modals/CreditPaymentFormModal/CreditPaymentFormModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import { formatMoney } from '@/lib/daily-income-api';
import {
    CREDIT_ERROR_AMOUNT_BELOW_PAID,
    CREDIT_ERROR_PAYMENT_EXCEEDS,
    addCreditPayment,
    createCredit,
    deleteCredit,
    deleteCreditPayment,
    fetchCreditClient,
    updateCredit,
    type CreditPaymentRecord,
    type CreditRecord,
} from '@/lib/credit-api';
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

type ModalState =
    | { type: 'credit-form'; credit: CreditRecord | null }
    | { type: 'credit-delete'; credit: CreditRecord }
    | { type: 'payment-form'; credit: CreditRecord }
    | { type: 'payment-delete'; payment: PaymentRow }
    | null;

export default function CreditClientDetailPage() {
    const t = useTranslations('admin.credits');
    const tCommon = useTranslations('common');
    const params = useParams<{ id: string }>();
    const clientId = params.id;
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const canManage = isAllowed({ anyRoles: ['ADMIN', 'USER'] });
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    useEffect(() => {
        if (!canManage) router.replace(Routes.Today);
    }, [canManage, router]);

    const { data: client, isLoading } = useQuery({
        queryKey: ['credit-client', clientId],
        queryFn: () => fetchCreditClient(clientId),
        enabled: canManage && !!clientId,
    });

    const translateError = useCallback(
        (error: Error) => {
            if (error.message === CREDIT_ERROR_PAYMENT_EXCEEDS) return t('paymentExceeds');
            if (error.message === CREDIT_ERROR_AMOUNT_BELOW_PAID) return t('amountBelowPaid');
            return error.message;
        },
        [t],
    );

    const onMutationError = (error: Error) =>
        openToast(tCommon('error'), translateError(error), { type: EToastType.ERROR });

    const onMutationSuccess = (message: string) => {
        void queryClient.invalidateQueries({ queryKey: ['credit-client', clientId] });
        void queryClient.invalidateQueries({ queryKey: ['credit-clients'] });
        void queryClient.invalidateQueries({ queryKey: ['credit-summary'] });
        openToast(tCommon('success'), message, { type: EToastType.SUCCESS });
        setModalState(null);
    };

    const createCreditMutation = useMutation({
        mutationFn: createCredit,
        onSuccess: () => onMutationSuccess(t('createCredit')),
        onError: onMutationError,
    });

    const updateCreditMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateCredit>[1] }) =>
            updateCredit(id, body),
        onSuccess: () => onMutationSuccess(tCommon('save')),
        onError: onMutationError,
    });

    const deleteCreditMutation = useMutation({
        mutationFn: deleteCredit,
        onSuccess: () => {
            onMutationSuccess(tCommon('delete'));
            closeModal();
        },
        onError: onMutationError,
    });

    const addPaymentMutation = useMutation({
        mutationFn: ({ creditId, body }: { creditId: string; body: Parameters<typeof addCreditPayment>[1] }) =>
            addCreditPayment(creditId, body),
        onSuccess: () => onMutationSuccess(t('paymentRecorded')),
        onError: onMutationError,
    });

    const deletePaymentMutation = useMutation({
        mutationFn: deleteCreditPayment,
        onSuccess: () => {
            onMutationSuccess(tCommon('delete'));
            closeModal();
        },
        onError: onMutationError,
    });

    const credits = client?.credits ?? [];
    const clientName = client ? `${client.firstName} ${client.lastName}` : '';

    const creditLabel = useCallback(
        (credit: CreditRecord) =>
            credit.description?.trim() || t('creditOf', { date: formatDate(credit.date) }),
        [t],
    );

    const payments = useMemo(
        (): PaymentRow[] =>
            credits
                .flatMap((credit) =>
                    credit.payments.map((payment) => ({
                        ...payment,
                        creditLabel: creditLabel(credit),
                    })),
                )
                .sort((a, b) => b.date.localeCompare(a.date)),
        [creditLabel, credits],
    );

    const handleCreditSubmit = useCallback(
        async (values: CreditFormValues) => {
            const body = {
                date: values.date,
                amount: Number(values.amount),
                description: values.description.trim() || undefined,
            };
            if (modalState?.type === 'credit-form' && modalState.credit) {
                await updateCreditMutation.mutateAsync({ id: modalState.credit.id, body });
                return;
            }
            await createCreditMutation.mutateAsync({ clientId, ...body });
        },
        [clientId, createCreditMutation, modalState, updateCreditMutation],
    );

    const handlePaymentSubmit = useCallback(
        async (values: CreditPaymentFormValues) => {
            if (modalState?.type !== 'payment-form') return;
            await addPaymentMutation.mutateAsync({
                creditId: modalState.credit.id,
                body: {
                    date: values.date,
                    amount: Number(values.amount),
                    note: values.note.trim() || undefined,
                },
            });
        },
        [addPaymentMutation, modalState],
    );

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
                    render: (_: unknown, row: CreditRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.totalPaid)} />
                    ),
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

    const creditActions = useMemo((): ITableAction<CreditRecord>[] => {
        const items: ITableAction<CreditRecord>[] = [
            {
                label: t('addPayment'),
                iconName: IconComponentsEnum.checkCircle,
                isVisible: (row) => row.remaining > 0,
                onClick: (row) => {
                    setModalState({ type: 'payment-form', credit: row });
                    openModal();
                },
            },
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'credit-form', credit: row });
                    openModal();
                },
            },
        ];
        if (isAdmin) {
            items.push({
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'credit-delete', credit: row });
                    openModal();
                },
            });
        }
        return items;
    }, [isAdmin, openModal, t, tCommon]);

    const paymentColumns = useMemo(
        (): ITableColumn<PaymentRow>[] => [
            {
                headerElement: {
                    value: 'date',
                    label: t('date'),
                    mobile: 'primary',
                    render: (_: unknown, row: PaymentRow) => (
                        <OrganismTable.Cell mainText={formatDate(row.date)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'credit',
                    label: t('credit'),
                    mobile: 'secondary',
                    render: (_: unknown, row: PaymentRow) => (
                        <OrganismTable.Cell mainText={row.creditLabel} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'amount',
                    label: t('amount'),
                    mobile: 'primary',
                    render: (_: unknown, row: PaymentRow) => (
                        <OrganismTable.Cell mainText={formatMoney(row.amount)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'note',
                    label: t('note'),
                    mobile: 'secondary',
                    render: (_: unknown, row: PaymentRow) => (
                        <OrganismTable.Cell mainText={row.note ?? '—'} />
                    ),
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
                          onClick: (row) => {
                              setModalState({ type: 'payment-delete', payment: row });
                              openModal();
                          },
                      },
                  ]
                : [],
        [isAdmin, openModal, tCommon],
    );

    const summaryCards = [
        {
            key: 'remaining',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-600' as const,
            label: t('remaining'),
            value: formatMoney(client?.remaining ?? 0),
        },
        {
            key: 'credit',
            icon: IconComponentsEnum.layers,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600' as const,
            label: t('totalCredit'),
            value: formatMoney(client?.totalCredit ?? 0),
        },
        {
            key: 'paid',
            icon: IconComponentsEnum.checkCircle,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-600' as const,
            label: t('totalPaid'),
            value: formatMoney(client?.totalPaid ?? 0),
        },
    ];

    const renderModalContent = () => {
        if (modalState?.type === 'credit-form') {
            return (
                <CreditFormModal
                    clientName={clientName}
                    credit={modalState.credit}
                    onSubmit={handleCreditSubmit}
                    isLoading={createCreditMutation.isPending || updateCreditMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'payment-form') {
            return (
                <CreditPaymentFormModal
                    credit={modalState.credit}
                    onSubmit={handlePaymentSubmit}
                    isLoading={addPaymentMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'credit-delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deleteCreditConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteCreditMutation.mutate(modalState.credit.id)}
                    isLoading={deleteCreditMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        if (modalState?.type === 'payment-delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deletePaymentConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deletePaymentMutation.mutate(modalState.payment.id)}
                    isLoading={deletePaymentMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        return null;
    };

    if (!canManage) return null;

    const backButton = (
        <Button
            id="credit-client-back"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{
                name: IconComponentsEnum.arrowLeft,
                size: ESize.md,
                color: 'text-primary-600',
            }}
            onClick={() => router.push(Routes.Credits.index)}
            aria-label={tCommon('back')}
            className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );

    return (
        <>
            {modalPortal(renderModalContent())}
            <LayoutWrapper
                title={isLoading ? '…' : clientName}
                subTitle={isLoading ? '…' : client?.phone || t('noPhone')}
                leftActions={backButton}
                mainSection={
                    isLoading ? (
                        <Div className="flex min-h-48 items-center justify-center py-16">
                            <Spinner color="text-primary-500" size="lg" />
                        </Div>
                    ) : (
                        <Div className="min-h-full space-y-6">
                            <Div className="grid gap-3 sm:grid-cols-3">
                                {summaryCards.map((card) => (
                                    <StatCard
                                        key={card.key}
                                        icon={card.icon}
                                        iconBg={card.iconBg}
                                        iconColor={card.iconColor}
                                        label={card.label}
                                        value={card.value}
                                    />
                                ))}
                            </Div>

                            <Div className="space-y-3">
                                <Div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <Label
                                        variant={EVariantLabel.body}
                                        color="text-primary-700"
                                        className="font-semibold"
                                    >
                                        {t('creditsTitle')}
                                    </Label>
                                    <Button
                                        id="credit-add-btn"
                                        type={EButtonType.primary}
                                        size={EButtonSize.medium}
                                        iconPosition="left"
                                        icon={{
                                            name: IconComponentsEnum.plus,
                                            size: ESize.sm,
                                            color: 'text-white',
                                        }}
                                        text={t('createCredit')}
                                        onClick={() => {
                                            setModalState({ type: 'credit-form', credit: null });
                                            openModal();
                                        }}
                                    />
                                </Div>
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
                            </Div>

                            <Div className="space-y-3">
                                <Label
                                    variant={EVariantLabel.body}
                                    color="text-primary-700"
                                    className="font-semibold"
                                >
                                    {t('paymentsTitle')}
                                </Label>
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
                            </Div>
                        </Div>
                    )
                }
            />
        </>
    );
}
