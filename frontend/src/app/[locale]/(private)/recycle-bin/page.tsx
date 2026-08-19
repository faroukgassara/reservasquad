'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import Div from '@/components/Primitives/Div/Div';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import {
    fetchDeletedReservations,
    hardDeleteReservation,
    restoreReservation,
    formatMoney,
    type ReservationRecord,
} from '@/lib/reservation-api';
import { mapReservationConflictMessage } from '@/lib/reservation-conflicts';
import {
    fetchDeletedProfessors,
    hardDeleteProfessor,
    restoreProfessor,
    type ProfessorRecord,
} from '@/lib/professor-api';
import {
    ITableAction,
    ITableColumn,
} from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';
import { EToastType, IconComponentsEnum } from '@/Enum/Enum';

type BinTab = 'reservations' | 'professors';

type ConfirmState =
    | { type: 'restore-reservation'; id: string }
    | { type: 'hard-reservation'; id: string }
    | { type: 'restore-professor'; id: string }
    | { type: 'hard-professor'; id: string }
    | null;

type DeletedReservation = ReservationRecord & { deletedAt?: string | null };
type DeletedProfessor = ProfessorRecord & { deletedAt?: string | null };

function formatDate(value: string): string {
    return new Date(value).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

export default function RecycleBinPage() {
    const t = useTranslations('admin.recycleBin');
    const tCommon = useTranslations('common');
    const tPay = useTranslations('admin.reservations');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    const [tab, setTab] = useState<BinTab>('reservations');
    const [page, setPage] = useState(1);
    const [confirmState, setConfirmState] = useState<ConfirmState>(null);
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setConfirmState(null),
    });

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Today);
    }, [isAdmin, router]);

    useEffect(() => {
        setPage(1);
    }, [tab]);

    const reservationsQuery = useQuery({
        queryKey: ['recycle-bin-reservations', page],
        queryFn: () =>
            fetchDeletedReservations({
                page,
                perPage: 20,
                sortBy: 'deletedAt',
                sortOrder: 'desc',
            }),
        enabled: isAdmin && tab === 'reservations',
    });

    const professorsQuery = useQuery({
        queryKey: ['recycle-bin-professors', page],
        queryFn: () =>
            fetchDeletedProfessors({
                page,
                perPage: 20,
                sortBy: 'deletedAt',
                sortOrder: 'desc',
            }),
        enabled: isAdmin && tab === 'professors',
    });

    const restoreReservationMutation = useMutation({
        mutationFn: restoreReservation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recycle-bin-reservations'] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            openToast(tCommon('success'), t('restored'), { type: EToastType.SUCCESS });
            setConfirmState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), mapReservationConflictMessage(error.message, tPay), {
                type: EToastType.ERROR,
            }),
    });

    const hardReservationMutation = useMutation({
        mutationFn: hardDeleteReservation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recycle-bin-reservations'] });
            openToast(tCommon('success'), t('hardDeleted'), { type: EToastType.SUCCESS });
            setConfirmState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const restoreProfessorMutation = useMutation({
        mutationFn: restoreProfessor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recycle-bin-professors'] });
            queryClient.invalidateQueries({ queryKey: ['professors'] });
            queryClient.invalidateQueries({ queryKey: ['professors-options'] });
            openToast(tCommon('success'), t('restored'), { type: EToastType.SUCCESS });
            setConfirmState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const hardProfessorMutation = useMutation({
        mutationFn: hardDeleteProfessor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recycle-bin-professors'] });
            openToast(tCommon('success'), t('hardDeleted'), { type: EToastType.SUCCESS });
            setConfirmState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const tabOptions = useMemo(
        () => [
            { value: 'reservations', label: t('tabs.reservations') },
            { value: 'professors', label: t('tabs.professors') },
        ],
        [t],
    );

    const reservationColumns = useMemo(
        (): ITableColumn<DeletedReservation>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell
                            mainText={formatDate(row.deletedAt ?? row.updatedAt)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'room',
                    label: tPay('room'),
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell mainText={row.room?.name ?? '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'professor',
                    label: tPay('professor'),
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell
                            mainText={
                                row.professor
                                    ? `${row.professor.firstName} ${row.professor.lastName}`
                                    : '—'
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'startAt',
                    label: tPay('startAt'),
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell mainText={formatDate(row.startAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'price',
                    label: tPay('price'),
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell mainText={formatMoney(row.price)} />
                    ),
                },
            },
        ],
        [t, tPay],
    );

    const professorColumns = useMemo(
        (): ITableColumn<DeletedProfessor>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: DeletedProfessor) => (
                        <OrganismTable.Cell
                            mainText={formatDate(row.deletedAt ?? row.updatedAt)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'name',
                    label: t('columns.name'),
                    render: (_: unknown, row: DeletedProfessor) => (
                        <OrganismTable.Cell
                            mainText={`${row.firstName} ${row.lastName}`.trim()}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'email',
                    label: tCommon('email'),
                    render: (_: unknown, row: DeletedProfessor) => (
                        <OrganismTable.Cell mainText={row.email ?? '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'specialty',
                    label: t('columns.specialty'),
                    render: (_: unknown, row: DeletedProfessor) => (
                        <OrganismTable.Cell mainText={row.specialty ?? '—'} />
                    ),
                },
            },
        ],
        [t, tCommon],
    );

    const reservationActions = useMemo(
        (): ITableAction<DeletedReservation>[] => [
            {
                label: t('restore'),
                iconName: IconComponentsEnum.check,
                onClick: (row) => {
                    setConfirmState({ type: 'restore-reservation', id: row.id });
                    openModal();
                },
            },
            {
                label: t('hardDelete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setConfirmState({ type: 'hard-reservation', id: row.id });
                    openModal();
                },
            },
        ],
        [openModal, t],
    );

    const professorActions = useMemo(
        (): ITableAction<DeletedProfessor>[] => [
            {
                label: t('restore'),
                iconName: IconComponentsEnum.check,
                onClick: (row) => {
                    setConfirmState({ type: 'restore-professor', id: row.id });
                    openModal();
                },
            },
            {
                label: t('hardDelete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setConfirmState({ type: 'hard-professor', id: row.id });
                    openModal();
                },
            },
        ],
        [openModal, t],
    );

    const isConfirmLoading =
        restoreReservationMutation.isPending ||
        hardReservationMutation.isPending ||
        restoreProfessorMutation.isPending ||
        hardProfessorMutation.isPending;

    const isRestore = Boolean(confirmState?.type.startsWith('restore'));

    if (!isAdmin) return null;

    return (
        <>
            {modalPortal(
                confirmState ? (
                    <ConfirmationModal
                        title={isRestore ? t('restore') : t('hardDelete')}
                        description={
                            isRestore ? t('confirmRestore') : t('confirmHardDelete')
                        }
                        submitBtnText={isRestore ? t('restore') : t('hardDelete')}
                        cancelBtnText={tCommon('cancel')}
                        isLoading={isConfirmLoading}
                        icon={isRestore ? IconComponentsEnum.check : IconComponentsEnum.trash}
                        iconBgColor={isRestore ? 'bg-success-100' : 'bg-danger-100'}
                        iconColor={isRestore ? 'text-success-600' : 'text-danger-600'}
                        onSubmit={() => {
                            if (confirmState.type === 'restore-reservation') {
                                restoreReservationMutation.mutate(confirmState.id);
                            } else if (confirmState.type === 'hard-reservation') {
                                hardReservationMutation.mutate(confirmState.id);
                            } else if (confirmState.type === 'restore-professor') {
                                restoreProfessorMutation.mutate(confirmState.id);
                            } else if (confirmState.type === 'hard-professor') {
                                hardProfessorMutation.mutate(confirmState.id);
                            }
                        }}
                    />
                ) : null,
            )}
            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <Div className="space-y-4">
                        <Tabs
                            options={tabOptions}
                            value={tab}
                            onChange={(value) => {
                                if (value === 'reservations' || value === 'professors') {
                                    setTab(value);
                                }
                            }}
                            variant="pills"
                        />
                        {tab === 'reservations' ? (
                            <OrganismTable<DeletedReservation>
                                columns={reservationColumns}
                                rows={reservationsQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={reservationsQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={reservationActions}
                                isLoading={reservationsQuery.isLoading}
                                emptyMessage={t('emptyReservations')}
                            />
                        ) : (
                            <OrganismTable<DeletedProfessor>
                                columns={professorColumns}
                                rows={professorsQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={professorsQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={professorActions}
                                isLoading={professorsQuery.isLoading}
                                emptyMessage={t('emptyProfessors')}
                            />
                        )}
                    </Div>
                }
            />
        </>
    );
}
