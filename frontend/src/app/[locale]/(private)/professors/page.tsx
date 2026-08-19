'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import ProfessorFormModal, {
    type ProfessorFormValues,
} from '@/components/Modals/ProfessorFormModal/ProfessorFormModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import {
    createProfessor,
    deleteProfessor,
    fetchProfessors,
    updateProfessor,
    type ProfessorRecord,
} from '@/lib/professor-api';
import {
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | { type: 'form'; professor: ProfessorRecord | null }
    | { type: 'delete'; professor: ProfessorRecord }
    | null;

export default function ProfessorsAdminPage() {
    const t = useTranslations('admin.professors');
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
        queryKey: ['professors', page, searchValue],
        queryFn: () => fetchProfessors({ page, perPage: 10, search: searchValue || undefined }),
        enabled: canManage,
    });

    const invalidateProfessors = () => {
        queryClient.invalidateQueries({ queryKey: ['professors'] });
        queryClient.invalidateQueries({ queryKey: ['professors-options'] });
    };

    const createMutation = useMutation({
        mutationFn: createProfessor,
        onSuccess: () => {
            invalidateProfessors();
            openToast(tCommon('success'), t('create'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateProfessor>[1] }) =>
            updateProfessor(id, body),
        onSuccess: () => {
            invalidateProfessors();
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProfessor,
        onSuccess: () => {
            invalidateProfessors();
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const handleFormSubmit = useCallback(
        async (values: ProfessorFormValues) => {
            const payload = {
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                email: values.email.trim() || undefined,
                phone: values.phone.trim() || undefined,
                specialty: values.specialty.trim() || undefined,
            };
            if (modalState?.type === 'form' && modalState.professor) {
                await updateMutation.mutateAsync({ id: modalState.professor.id, body: payload });
                return;
            }
            await createMutation.mutateAsync(payload);
        },
        [createMutation, modalState, updateMutation],
    );

    const columns = useMemo(
        (): ITableColumn<ProfessorRecord>[] => [
            {
                headerElement: {
                    value: 'name',
                    label: tCommon('name'),
                    render: (_: unknown, row: ProfessorRecord) => (
                        <OrganismTable.Cell
                            mainText={`${row.firstName} ${row.lastName}`}
                            supportingText={row.specialty ?? undefined}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'email',
                    label: t('email'),
                    render: (_: unknown, row: ProfessorRecord) => (
                        <OrganismTable.Cell mainText={row.email ?? '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'phone',
                    label: t('phone'),
                    render: (_: unknown, row: ProfessorRecord) => (
                        <OrganismTable.Cell mainText={row.phone ?? '—'} />
                    ),
                },
            },
        ],
        [t, tCommon],
    );

    const actions = useMemo((): ITableAction<ProfessorRecord>[] => {
        const items: ITableAction<ProfessorRecord>[] = [
            {
                label: t('reservations'),
                iconName: IconComponentsEnum.eye,
                onClick: (row) => {
                    router.push(Routes.Professors.show(row.id));
                },
            },
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'form', professor: row });
                    openModal();
                },
            },
        ];
        if (isAdmin) {
            items.push({
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'delete', professor: row });
                    openModal();
                },
            });
        }
        return items;
    }, [isAdmin, openModal, router, t, tCommon]);

    const renderModalContent = () => {
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deleteConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteMutation.mutate(modalState.professor.id)}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        if (modalState?.type === 'form') {
            return (
                <ProfessorFormModal
                    mode={modalState.professor ? 'edit' : 'create'}
                    professor={modalState.professor}
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
                    <div className="min-h-full">
                        <OrganismTable<ProfessorRecord>
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
                            emptyMessage={tCommon('empty')}
                            page={page}
                            totalRows={totalRows}
                            onPageChange={setPage}
                            primaryAction={
                                <Button
                                    id="professors-add-btn"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    iconPosition="left"
                                    icon={{
                                        name: IconComponentsEnum.plus,
                                        size: ESize.sm,
                                        color: 'text-white',
                                    }}
                                    text={t('create')}
                                    onClick={() => {
                                        setModalState({ type: 'form', professor: null });
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
