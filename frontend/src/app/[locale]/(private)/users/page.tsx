'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import { EBadgeSize, EBadgeType, EButtonSize, EButtonType, ESize, EToastType, IconComponentsEnum } from '@/Enum/Enum';
import { fetchUsers, createUser, updateUser, deleteUser, type UserRecord, type UserRole, type UserStatus } from '@/lib/user-api';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import UserFormModal, { type UserFormValues } from '@/components/Modals/UserFormModal/UserFormModal';
import Badge from '@/components/Primitives/Badge/Badge';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | { type: 'form'; user: UserRecord | null }
    | { type: 'delete'; user: UserRecord }
    | null;

function formatDate(value: string): string {
    return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

export default function UsersAdminPage() {
    const t = useTranslations('admin.users');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const roleLabel = useCallback((role: UserRole): string => {
        if (role === 'ADMIN') return t('roles.ADMIN');
        return t('roles.USER');
    }, [t]);

    const statusLabel = useCallback(
        (status: UserStatus): string =>
            status === 'ACTIVE' ? tStatus('active') : tStatus('inactive'),
        [tStatus],
    );

    const router = useRouter();
    const { data: session } = useSession();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [modalState, setModalState] = useState<ModalState>(null);

    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    useEffect(() => {
        if (!isAdmin) {
            router.replace(Routes.Dashboard);
        }
    }, [isAdmin, router]);

    const { data, isLoading } = useQuery({
        queryKey: ['users', page, searchValue, sortBy, sortOrder],
        queryFn: () =>
            fetchUsers({
                page,
                perPage: 10,
                search: searchValue || undefined,
                sortBy,
                sortOrder,
            }),
        enabled: isAdmin,
    });

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            openToast(tCommon('success'), tCommon('create'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateUser>[1] }) =>
            updateUser(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;
    const currentUserId = session?.user?.id;

    const handleFormSubmit = async (values: UserFormValues) => {
        if (modalState?.type === 'form' && modalState.user) {
            const isAdminAccount = modalState.user.role === 'ADMIN';
            await updateMutation.mutateAsync({
                id: modalState.user.id,
                body: {
                    firstName: values.firstName.trim(),
                    lastName: values.lastName.trim(),
                    phone: values.phone.trim(),
                    role: values.role,
                    ...(isAdminAccount ? {} : { status: values.status }),
                    ...(values.password.trim() ? { password: values.password } : {}),
                },
            });
            return;
        }

        await createMutation.mutateAsync({
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            password: values.password,
            role: values.role,
            status: values.role === 'ADMIN' ? 'ACTIVE' : values.status,
        });
    };

    const columns = useMemo(
        (): ITableColumn<UserRecord>[] => [
            {
                headerElement: {
                    value: 'firstName',
                    label: tCommon('name'),
                    sortable: true,
                    width: '220px',
                    render: (_: unknown, row: UserRecord) => (
                        <OrganismTable.Cell
                            mainText={`${row.firstName} ${row.lastName}`}
                            supportingText={row.email}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'phone',
                    label: tCommon('phone'),
                    sortable: true,
                    width: '160px',
                    render: (_: unknown, row: UserRecord) => (
                        <OrganismTable.Cell mainText={row.phone} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'role',
                    label: 'Rôle',
                    sortable: true,
                    width: '150px',
                    render: (_: unknown, row: UserRecord) => (
                        <OrganismTable.Cell mainText={roleLabel(row.role)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: tCommon('status'),
                    sortable: true,
                    width: '120px',
                    render: (_: unknown, row: UserRecord) => (
                        <Badge
                            id={`user-status-${row.status}`}
                            text={statusLabel(row.status)}
                            type={statusColor(row.status)}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'createdAt',
                    label: 'Créé le',
                    sortable: true,
                    width: '160px',
                    render: (_: unknown, row: UserRecord) => (
                        <OrganismTable.Cell mainText={formatDate(row.createdAt)} />
                    ),
                },
            },
        ],
        [tCommon, roleLabel, statusLabel],
    );

    const actions = useMemo(
        (): ITableAction<UserRecord>[] => [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'form', user: row });
                    openModal();
                },
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                isVisible: (row) => row.role !== 'ADMIN',
                onClick: (row) => {
                    if (row.id === currentUserId) {
                        openToast(tCommon('error'), tCommon('delete'), {
                            type: EToastType.ERROR,
                        });
                        return;
                    }
                    if (row.role === 'ADMIN') {
                        openToast(tCommon('error'), tCommon('delete'), {
                            type: EToastType.ERROR,
                        });
                        return;
                    }
                    setModalState({ type: 'delete', user: row });
                    openModal();
                },
            },
        ],
        [currentUserId, openModal, openToast, tCommon],
    );

    const renderModalContent = () => {
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('confirmDelete')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteMutation.mutate(modalState.user.id)}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }

        if (modalState?.type === 'form') {
            return (
                <UserFormModal
                    mode={modalState.user ? 'edit' : 'create'}
                    user={modalState.user}
                    onSubmit={handleFormSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            );
        }

        return null;
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <>
            {modalPortal(renderModalContent())}

            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <div className="min-h-full">
                        <OrganismTable<UserRecord>
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
                            primaryAction={
                                <Button
                                    id="users-add-btn"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    iconPosition="left"
                                    icon={{
                                        name: IconComponentsEnum.plus,
                                        size: ESize.sm,
                                        color: 'text-white',
                                    }}
                                    text={t('add')}
                                    onClick={() => {
                                        setModalState({ type: 'form', user: null });
                                        openModal();
                                    }}
                                />
                            }
                        />
                    </div>
                }
            />
        </>
    );
}

function statusColor(status: UserStatus): EBadgeType {
    return status === 'ACTIVE' ? EBadgeType.success : EBadgeType.error;
}
