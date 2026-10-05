'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import CreditClientFormModal, {
    type CreditClientFormValues,
} from '@/components/Modals/CreditClientFormModal/CreditClientFormModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import { formatMoney } from '@/lib/daily-income-api';
import {
    createCreditClient,
    deleteCreditClient,
    fetchCreditClients,
    fetchCreditSummary,
    updateCreditClient,
    type CreditClientListItem,
} from '@/lib/credit-api';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | { type: 'form'; client: CreditClientListItem | null }
    | { type: 'delete'; client: CreditClientListItem }
    | null;

export default function CreditsPage() {
    const t = useTranslations('admin.credits');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const canManage = isAllowed({ anyRoles: ['ADMIN', 'USER'] });
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    useEffect(() => {
        if (!canManage) router.replace(Routes.Today);
    }, [canManage, router]);

    const { data, isLoading } = useQuery({
        queryKey: ['credit-clients', page, searchValue],
        queryFn: () =>
            fetchCreditClients({ page, perPage: 10, search: searchValue || undefined }),
        enabled: canManage,
    });

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['credit-summary'],
        queryFn: fetchCreditSummary,
        enabled: canManage,
    });

    const invalidateCredits = () => {
        void queryClient.invalidateQueries({ queryKey: ['credit-clients'] });
        void queryClient.invalidateQueries({ queryKey: ['credit-summary'] });
    };

    const createMutation = useMutation({
        mutationFn: createCreditClient,
        onSuccess: () => {
            invalidateCredits();
            openToast(tCommon('success'), t('createClient'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateCreditClient>[1] }) =>
            updateCreditClient(id, body),
        onSuccess: () => {
            invalidateCredits();
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCreditClient,
        onSuccess: () => {
            invalidateCredits();
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const handleFormSubmit = useCallback(
        async (values: CreditClientFormValues) => {
            const payload = {
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                phone: values.phone.trim() || undefined,
            };
            if (modalState?.type === 'form' && modalState.client) {
                await updateMutation.mutateAsync({ id: modalState.client.id, body: payload });
                return;
            }
            await createMutation.mutateAsync(payload);
        },
        [createMutation, modalState, updateMutation],
    );

    const columns = useMemo(
        (): ITableColumn<CreditClientListItem>[] => [
            {
                headerElement: {
                    value: 'name',
                    label: tCommon('name'),
                    mobile: 'primary',
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell
                            mainText={`${row.firstName} ${row.lastName}`}
                            supportingText={row.phone ?? undefined}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'totalCredit',
                    label: t('totalCredit'),
                    mobile: 'secondary',
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell
                            mainText={formatMoney(row.totalCredit)}
                            supportingText={t('creditCount', { count: row.creditCount })}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'totalPaid',
                    label: t('totalPaid'),
                    mobile: 'secondary',
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell mainText={formatMoney(row.totalPaid)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'remaining',
                    label: t('remaining'),
                    mobile: 'primary',
                    render: (_: unknown, row: CreditClientListItem) => (
                        <Badge
                            id={`credit-client-remaining-${row.id}`}
                            text={row.remaining > 0 ? formatMoney(row.remaining) : t('settled')}
                            type={row.remaining > 0 ? EBadgeType.warning : EBadgeType.success}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [t, tCommon],
    );

    const actions = useMemo((): ITableAction<CreditClientListItem>[] => {
        const items: ITableAction<CreditClientListItem>[] = [
            {
                label: t('viewCredits'),
                iconName: IconComponentsEnum.eye,
                onClick: (row) => router.push(Routes.Credits.show(row.id)),
            },
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'form', client: row });
                    openModal();
                },
            },
        ];
        if (isAdmin) {
            items.push({
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'delete', client: row });
                    openModal();
                },
            });
        }
        return items;
    }, [isAdmin, openModal, router, t, tCommon]);

    const summaryCards = [
        {
            key: 'remaining',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-600' as const,
            label: t('totalRemaining'),
            value: formatMoney(summary?.remaining ?? 0),
        },
        {
            key: 'credit',
            icon: IconComponentsEnum.layers,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600' as const,
            label: t('totalCredit'),
            value: formatMoney(summary?.totalCredit ?? 0),
        },
        {
            key: 'paid',
            icon: IconComponentsEnum.checkCircle,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-600' as const,
            label: t('totalPaid'),
            value: formatMoney(summary?.totalPaid ?? 0),
        },
        {
            key: 'clients',
            icon: IconComponentsEnum.users,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600' as const,
            label: t('clientsWithBalance'),
            value: String(summary?.clientsWithBalance ?? 0),
        },
    ];

    const renderModalContent = () => {
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deleteClientConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteMutation.mutate(modalState.client.id)}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        if (modalState?.type === 'form') {
            return (
                <CreditClientFormModal
                    client={modalState.client}
                    onSubmit={handleFormSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            );
        }
        return null;
    };

    if (!canManage) return null;

    return (
        <>
            {modalPortal(renderModalContent())}
            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <Div className="min-h-full space-y-6">
                        <Div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {summaryCards.map((card) => (
                                <StatCard
                                    key={card.key}
                                    icon={card.icon}
                                    iconBg={card.iconBg}
                                    iconColor={card.iconColor}
                                    label={summaryLoading ? '—' : card.label}
                                    value={summaryLoading ? '—' : card.value}
                                />
                            ))}
                        </Div>
                        <OrganismTable<CreditClientListItem>
                            columns={columns}
                            rows={rows}
                            pageSize={10}
                            searchable
                            searchValue={searchValue}
                            onSearchChange={(value) => {
                                setSearchValue(value);
                                setPage(1);
                            }}
                            placeholder={tCommon('search')}
                            actions={actions}
                            isLoading={isLoading}
                            emptyMessage={t('emptyClients')}
                            page={page}
                            totalRows={totalRows}
                            onPageChange={setPage}
                            primaryAction={
                                <Button
                                    id="credits-add-client-btn"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    iconPosition="left"
                                    icon={{
                                        name: IconComponentsEnum.plus,
                                        size: ESize.sm,
                                        color: 'text-white',
                                    }}
                                    text={t('createClient')}
                                    onClick={() => {
                                        setModalState({ type: 'form', client: null });
                                        openModal();
                                    }}
                                />
                            }
                        />
                    </Div>
                }
            />
        </>
    );
}
