'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import { EButtonSize, EButtonType, ESize, EToastType, IconComponentsEnum } from '@/Enum/Enum';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer, type CustomerRecord } from '@/lib/sales-api';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import CustomerFormModal, { type CustomerFormValues } from '@/components/Modals/CustomerFormModal/CustomerFormModal';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | { type: 'form'; customer: CustomerRecord | null }
    | { type: 'delete'; customer: CustomerRecord }
    | null;

export default function ClientsAdminPage() {
    const t = useTranslations('sales.clients');
    const tCommon = useTranslations('common');

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
        queryKey: ['customers', page, searchValue, sortBy, sortOrder],
        queryFn: () =>
            fetchCustomers({
                page,
                perPage: 10,
                search: searchValue || undefined,
                sortBy,
                sortOrder,
            }),
        enabled: isAdmin,
    });

    const createMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            openToast(tCommon('success'), tCommon('create'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateCustomer>[1] }) =>
            updateCustomer(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    const handleFormSubmit = async (values: CustomerFormValues) => {
        const body = {
            type: values.type,
            name: values.name.trim(),
            email: values.email.trim() || undefined,
            phone: values.phone.trim() || undefined,
            company: values.company.trim() || undefined,
            vatNumber: values.vatNumber.trim() || undefined,
            address: values.address.trim() || undefined,
            city: values.city.trim() || undefined,
            postalCode: values.postalCode.trim() || undefined,
            country: values.country.trim() || undefined,
        };
        if (modalState?.type === 'form' && modalState.customer) {
            await updateMutation.mutateAsync({ id: modalState.customer.id, body });
        } else {
            await createMutation.mutateAsync(body);
        }
    };

    const columns = useMemo(
        (): ITableColumn<CustomerRecord>[] => [
            {
                headerElement: {
                    value: 'name',
                    label: t('name'),
                    sortable: true,
                    render: (_: unknown, row: CustomerRecord) => (
                        <OrganismTable.Cell
                            mainText={row.name}
                            supportingText={row.company ?? row.email ?? undefined}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'phone',
                    label: t('phone'),
                    render: (_: unknown, row: CustomerRecord) => (
                        <OrganismTable.Cell mainText={row.phone ?? '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'vatNumber',
                    label: t('taxId'),
                    render: (_: unknown, row: CustomerRecord) => (
                        <OrganismTable.Cell mainText={row.vatNumber ?? '—'} />
                    ),
                },
            },
        ],
        [t],
    );

    const actions = useMemo(
        (): ITableAction<CustomerRecord>[] => [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'form', customer: row });
                    openModal();
                },
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'delete', customer: row });
                    openModal();
                },
            },
        ],
        [openModal, tCommon],
    );

    const renderModal = () => {
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('confirmDelete')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteMutation.mutate(modalState.customer.id)}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }

        if (modalState?.type === 'form') {
            return (
                <CustomerFormModal
                    mode={modalState.customer ? 'edit' : 'create'}
                    customer={modalState.customer}
                    onSubmit={handleFormSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            );
        }

        return null;
    };

    if (!isAdmin) return null;

    return (
        <>
            {modalPortal(renderModal())}

            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <OrganismTable<CustomerRecord>
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
                            <Button
                                id="clients-add"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={t('add')}
                                onClick={() => {
                                    setModalState({ type: 'form', customer: null });
                                    openModal();
                                }}
                                iconPosition="left"
                                icon={{
                                    name: IconComponentsEnum.plus,
                                    size: ESize.sm,
                                    color: 'text-white',
                                }}
                            />
                        }
                    />
                }
            />
        </>
    );
}
