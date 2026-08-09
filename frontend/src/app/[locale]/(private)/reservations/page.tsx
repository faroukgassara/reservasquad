'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import ReservationFormModal, {
    type ReservationFormValues,
} from '@/components/Modals/ReservationFormModal/ReservationFormModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
    cancelReservation,
    createReservation,
    deleteReservation,
    fetchReservations,
    formatMoney,
    updateReservation,
    type ReservationRecord,
} from '@/lib/reservation-api';
import { fetchRooms } from '@/lib/room-api';
import { fetchProfessors } from '@/lib/professor-api';
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
    | { type: 'form'; reservation: ReservationRecord | null }
    | { type: 'delete'; reservation: ReservationRecord }
    | { type: 'cancel'; reservation: ReservationRecord }
    | null;

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

export default function ReservationsAdminPage() {
    const t = useTranslations('admin.reservations');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    const { data, isLoading } = useQuery({
        queryKey: ['reservations', page, searchValue],
        queryFn: () =>
            fetchReservations({ page, perPage: 10, search: searchValue || undefined }),
    });

    const { data: roomsData } = useQuery({
        queryKey: ['rooms-options'],
        queryFn: () => fetchRooms({ page: 1, perPage: 100 }),
    });

    const { data: professorsData } = useQuery({
        queryKey: ['professors-options'],
        queryFn: () => fetchProfessors({ page: 1, perPage: 100 }),
        enabled: isAdmin,
    });

    const rooms = roomsData?.data ?? [];
    const professors = professorsData?.data ?? [];

    const createMutation = useMutation({
        mutationFn: createReservation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
            openToast(tCommon('success'), t('create'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateReservation>[1] }) =>
            updateReservation(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const cancelMutation = useMutation({
        mutationFn: cancelReservation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            openToast(tCommon('success'), t('cancel'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteReservation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const handleFormSubmit = useCallback(
        async (values: ReservationFormValues) => {
            const payload = {
                title: values.title.trim() || undefined,
                roomId: values.roomId,
                professorId: values.professorId || undefined,
                startAt: new Date(values.startAt).toISOString(),
                endAt: new Date(values.endAt).toISOString(),
                notes: values.notes.trim() || undefined,
                status: values.status,
                isPaid: values.isPaid,
            };
            if (modalState?.type === 'form' && modalState.reservation) {
                await updateMutation.mutateAsync({
                    id: modalState.reservation.id,
                    body: {
                        ...payload,
                        professorId: values.professorId || null,
                    },
                });
                return;
            }
            await createMutation.mutateAsync(payload);
        },
        [createMutation, modalState, updateMutation],
    );

    const columns = useMemo(
        (): ITableColumn<ReservationRecord>[] => [
            {
                headerElement: {
                    value: 'title',
                    label: t('titleField'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <OrganismTable.Cell
                            mainText={row.title || row.room?.name || '—'}
                            supportingText={row.room?.name}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'professor',
                    label: t('professor'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <OrganismTable.Cell
                            mainText={
                                row.professor
                                    ? `${row.professor.firstName} ${row.professor.lastName}`
                                    : t('noProfessor')
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'startAt',
                    label: t('startAt'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <OrganismTable.Cell
                            mainText={formatDateTime(row.startAt)}
                            supportingText={formatDateTime(row.endAt)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'price',
                    label: t('price'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.price)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'isPaid',
                    label: t('payment'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <Badge
                            id={`reservation-paid-${row.id}`}
                            text={row.isPaid ? t('paid') : t('unpaid')}
                            type={row.isPaid ? EBadgeType.success : EBadgeType.warning}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('status'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <Badge
                            id={`reservation-status-${row.id}`}
                            text={
                                row.status === 'CONFIRMED'
                                    ? tStatus('confirmed')
                                    : tStatus('cancelled')
                            }
                            type={
                                row.status === 'CONFIRMED'
                                    ? EBadgeType.success
                                    : EBadgeType.warning
                            }
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [t, tStatus],
    );

    const actions = useMemo(
        (): ITableAction<ReservationRecord>[] => {
            if (!isAdmin) return [];
            return [
                {
                    label: tCommon('edit'),
                    iconName: IconComponentsEnum.edit,
                    onClick: (row) => {
                        setModalState({ type: 'form', reservation: row });
                        openModal();
                    },
                },
                {
                    label: t('cancel'),
                    iconName: IconComponentsEnum.close,
                    isVisible: (row) => row.status === 'CONFIRMED',
                    onClick: (row) => {
                        setModalState({ type: 'cancel', reservation: row });
                        openModal();
                    },
                },
                {
                    label: tCommon('delete'),
                    iconName: IconComponentsEnum.trash,
                    onClick: (row) => {
                        setModalState({ type: 'delete', reservation: row });
                        openModal();
                    },
                },
            ];
        },
        [isAdmin, openModal, t, tCommon],
    );

    const renderModalContent = () => {
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deleteConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteMutation.mutate(modalState.reservation.id)}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        if (modalState?.type === 'cancel') {
            return (
                <ConfirmationModal
                    title={t('cancel')}
                    description={t('deleteConfirm')}
                    submitBtnText={t('cancel')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => cancelMutation.mutate(modalState.reservation.id)}
                    isLoading={cancelMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'form') {
            return (
                <ReservationFormModal
                    mode={modalState.reservation ? 'edit' : 'create'}
                    reservation={modalState.reservation}
                    rooms={rooms}
                    professors={professors}
                    onSubmit={handleFormSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            );
        }
        return null;
    };

    return (
        <>
            {modalPortal(renderModalContent())}
            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <div className="min-h-full">
                        <OrganismTable<ReservationRecord>
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
                                isAdmin ? (
                                    <Button
                                        id="reservations-add-btn"
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
                                            setModalState({ type: 'form', reservation: null });
                                            openModal();
                                        }}
                                    />
                                ) : undefined
                            }
                        />
                    </div>
                }
            />
        </>
    );
}
