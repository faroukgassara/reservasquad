'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import Checkbox from '@/components/Primitives/Checkbox/Checkbox';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import ReservationFormModal, {
    type ReservationFormValues,
} from '@/components/Modals/ReservationFormModal/ReservationFormModal';
import FindFreeRoomModal from '@/components/Modals/FindFreeRoomModal/FindFreeRoomModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
    bulkMarkReservationsPaid,
    cancelReservation,
    createReservation,
    createReservationSeries,
    deleteFutureInSeries,
    deleteReservation,
    fetchReservations,
    formatMoney,
    updateReservation,
    type ReservationRecord,
    type ReservationStatus,
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
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | {
          type: 'form';
          reservation: ReservationRecord | null;
          roomId?: string;
          startAt?: string;
          endAt?: string;
      }
    | { type: 'find-room' }
    | { type: 'delete'; reservation: ReservationRecord }
    | { type: 'cancel'; reservation: ReservationRecord }
    | { type: 'bulk-paid' }
    | { type: 'delete-series'; reservation: ReservationRecord }
    | null;

type PaidFilter = 'all' | 'paid' | 'unpaid';
type StatusFilter = 'all' | ReservationStatus;

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
    const canManage = isAllowed({ anyRoles: ['ADMIN', 'USER'] });
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [roomFilter, setRoomFilter] = useState('all');
    const [professorFilter, setProfessorFilter] = useState('all');
    const [paidFilter, setPaidFilter] = useState<PaidFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [modalState, setModalState] = useState<ModalState>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    const fromIso = fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined;
    const toExclusiveIso = toDate
        ? new Date(new Date(`${toDate}T00:00:00`).getTime() + 24 * 60 * 60 * 1000).toISOString()
        : undefined;

    const { data, isLoading } = useQuery({
        queryKey: [
            'reservations',
            page,
            searchValue,
            roomFilter,
            professorFilter,
            paidFilter,
            statusFilter,
            fromDate,
            toDate,
        ],
        queryFn: () =>
            fetchReservations({
                page,
                perPage: 10,
                search: searchValue || undefined,
                ...(roomFilter !== 'all' ? { roomId: roomFilter } : {}),
                ...(professorFilter !== 'all' ? { professorId: professorFilter } : {}),
                ...(paidFilter === 'paid' ? { isPaid: true } : {}),
                ...(paidFilter === 'unpaid' ? { isPaid: false } : {}),
                ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
                ...(fromIso ? { from: fromIso } : {}),
                ...(toExclusiveIso ? { to: toExclusiveIso } : {}),
            }),
    });

    const { data: roomsData } = useQuery({
        queryKey: ['rooms-options'],
        queryFn: () => fetchRooms({ page: 1, perPage: 100 }),
    });

    const { data: professorsData } = useQuery({
        queryKey: ['professors-options'],
        queryFn: () => fetchProfessors({ page: 1, perPage: 100 }),
    });

    const rooms = roomsData?.data ?? [];
    const professors = professorsData?.data ?? [];

    const roomFilterOptions = useMemo(
        () => [
            { value: 'all', label: t('filterAllRooms') },
            ...rooms.map((room) => ({ value: room.id, label: room.name })),
        ],
        [rooms, t],
    );

    const professorFilterOptions = useMemo(
        () => [
            { value: 'all', label: t('filterAllProfessors') },
            { value: 'none', label: t('noProfessor') },
            ...professors.map((p) => ({
                value: p.id,
                label: `${p.firstName} ${p.lastName}`,
            })),
        ],
        [professors, t],
    );

    const paidFilterOptions = useMemo(
        () => [
            { value: 'all', label: t('filterAllPayments') },
            { value: 'paid', label: t('paid') },
            { value: 'unpaid', label: t('unpaid') },
        ],
        [t],
    );

    const statusFilterOptions = useMemo(
        () => [
            { value: 'all', label: t('filterAllStatuses') },
            { value: 'CONFIRMED', label: tStatus('confirmed') },
            { value: 'CANCELLED', label: tStatus('cancelled') },
        ],
        [t, tStatus],
    );

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

    const seriesMutation = useMutation({
        mutationFn: createReservationSeries,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
            openToast(tCommon('success'), t('seriesCreated', { count: result.count }), {
                type: EToastType.SUCCESS,
            });
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

    const bulkPaidMutation = useMutation({
        mutationFn: bulkMarkReservationsPaid,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            openToast(tCommon('success'), t('bulkPaidSuccess', { count: result.updated }), {
                type: EToastType.SUCCESS,
            });
            setSelectedIds([]);
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const deleteSeriesMutation = useMutation({
        mutationFn: deleteFutureInSeries,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
            openToast(tCommon('success'), t('deleteSeriesFuture'), {
                type: EToastType.SUCCESS,
            });
            void result;
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;
    const unpaidSelectableIds = useMemo(
        () => rows.filter((row) => !row.isPaid).map((row) => row.id),
        [rows],
    );
    const allUnpaidSelected =
        unpaidSelectableIds.length > 0 &&
        unpaidSelectableIds.every((id) => selectedIds.includes(id));

    const toggleSelectAllUnpaid = useCallback(() => {
        setSelectedIds((prev) => {
            if (unpaidSelectableIds.every((id) => prev.includes(id))) {
                return prev.filter((id) => !unpaidSelectableIds.includes(id));
            }
            return Array.from(new Set([...prev, ...unpaidSelectableIds]));
        });
    }, [unpaidSelectableIds]);

    const toggleSelectRow = useCallback((id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        );
    }, []);

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
                ...(values.manualPrice ? { price: Number(values.price) } : {}),
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
            if (values.recurring) {
                await seriesMutation.mutateAsync({
                    ...payload,
                    frequency: values.frequency,
                    until: values.until,
                });
                return;
            }
            await createMutation.mutateAsync(payload);
        },
        [createMutation, modalState, seriesMutation, updateMutation],
    );

    const columns = useMemo(
        (): ITableColumn<ReservationRecord>[] => [
            ...(isAdmin
                ? [
                      {
                          headerElement: {
                              value: 'select',
                              label: '',
                              width: '48px',
                              render: (_: unknown, row: ReservationRecord) =>
                                  row.isPaid ? (
                                      <Div className="size-5" />
                                  ) : (
                                      <Checkbox
                                          id={`reservation-select-${row.id}`}
                                          checked={selectedIds.includes(row.id)}
                                          onChange={() => toggleSelectRow(row.id)}
                                          label=""
                                      />
                                  ),
                          },
                      } satisfies ITableColumn<ReservationRecord>,
                  ]
                : []),
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
        [isAdmin, selectedIds, t, tStatus, toggleSelectRow],
    );

    const actions = useMemo(
        (): ITableAction<ReservationRecord>[] => {
            if (!canManage) return [];
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
        [canManage, openModal, t, tCommon],
    );

    const renderModalContent = () => {
        if (modalState?.type === 'bulk-paid') {
            return (
                <ConfirmationModal
                    title={t('bulkPaid')}
                    description={t('bulkPaidConfirm', { count: selectedIds.length })}
                    submitBtnText={t('bulkPaid')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => bulkPaidMutation.mutate(selectedIds)}
                    isLoading={bulkPaidMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'delete-series') {
            return (
                <ConfirmationModal
                    title={t('deleteSeriesFuture')}
                    description={t('deleteSeriesFutureConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteSeriesMutation.mutate(modalState.reservation.id)}
                    isLoading={deleteSeriesMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
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
        if (modalState?.type === 'find-room') {
            return (
                <FindFreeRoomModal
                    onSelect={({ roomId, startAt, endAt }) => {
                        setModalState({
                            type: 'form',
                            reservation: null,
                            roomId,
                            startAt,
                            endAt,
                        });
                    }}
                />
            );
        }
        if (modalState?.type === 'form') {
            return (
                <ReservationFormModal
                    key={
                        modalState.reservation
                            ? modalState.reservation.id
                            : `create-${modalState.roomId ?? ''}-${modalState.startAt ?? ''}-${modalState.endAt ?? ''}`
                    }
                    mode={modalState.reservation ? 'edit' : 'create'}
                    reservation={modalState.reservation}
                    rooms={rooms}
                    professors={professors}
                    onSubmit={handleFormSubmit}
                    isLoading={
                        createMutation.isPending ||
                        updateMutation.isPending ||
                        seriesMutation.isPending
                    }
                    defaultRoomId={modalState.roomId}
                    defaultStartAt={modalState.startAt}
                    defaultEndAt={modalState.endAt}
                    onDeleteSeriesFuture={
                        modalState.reservation?.seriesId
                            ? () => {
                                  setModalState({
                                      type: 'delete-series',
                                      reservation: modalState.reservation!,
                                  });
                              }
                            : undefined
                    }
                    isDeletingSeries={deleteSeriesMutation.isPending}
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
                    <Div className="min-h-full space-y-4">
                        <Div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            <Dropdown
                                label={t('room')}
                                options={roomFilterOptions}
                                value={roomFilter}
                                onChange={(value) => {
                                    if (typeof value === 'string') {
                                        setRoomFilter(value);
                                        setPage(1);
                                    }
                                }}
                            />
                            <Dropdown
                                label={t('professor')}
                                options={professorFilterOptions}
                                value={professorFilter}
                                onChange={(value) => {
                                    if (typeof value === 'string') {
                                        setProfessorFilter(value);
                                        setPage(1);
                                    }
                                }}
                            />
                            <Dropdown
                                label={t('payment')}
                                options={paidFilterOptions}
                                value={paidFilter}
                                onChange={(value) => {
                                    if (value === 'all' || value === 'paid' || value === 'unpaid') {
                                        setPaidFilter(value);
                                        setPage(1);
                                    }
                                }}
                            />
                            <Dropdown
                                label={t('status')}
                                options={statusFilterOptions}
                                value={statusFilter}
                                onChange={(value) => {
                                    if (
                                        value === 'all' ||
                                        value === 'CONFIRMED' ||
                                        value === 'CANCELLED'
                                    ) {
                                        setStatusFilter(value);
                                        setPage(1);
                                    }
                                }}
                            />
                            <Div>
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-700"
                                    className="mb-1.5 block"
                                >
                                    {t('filterFrom')}
                                </Label>
                                <input
                                    id="reservations-filter-from"
                                    type="date"
                                    lang="fr"
                                    className="ds-input-field h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900"
                                    value={fromDate}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </Div>
                            <Div>
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-700"
                                    className="mb-1.5 block"
                                >
                                    {t('filterTo')}
                                </Label>
                                <input
                                    id="reservations-filter-to"
                                    type="date"
                                    lang="fr"
                                    className="ds-input-field h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900"
                                    value={toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </Div>
                        </Div>
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
                                canManage ? (
                                    <Div className="flex flex-wrap items-center gap-2">
                                        {isAdmin && selectedIds.length > 0 ? (
                                            <Button
                                                id="reservations-bulk-paid-btn"
                                                type={EButtonType.secondary}
                                                size={EButtonSize.medium}
                                                text={t('bulkPaidSelected', { count: selectedIds.length })}
                                                onClick={() => {
                                                    setModalState({ type: 'bulk-paid' });
                                                    openModal();
                                                }}
                                            />
                                        ) : null}
                                        {isAdmin && unpaidSelectableIds.length > 0 ? (
                                            <Button
                                                id="reservations-select-unpaid-btn"
                                                type={EButtonType.tertiary}
                                                size={EButtonSize.medium}
                                                text={
                                                    allUnpaidSelected
                                                        ? t('deselectUnpaid')
                                                        : t('selectUnpaidPage')
                                                }
                                                onClick={toggleSelectAllUnpaid}
                                            />
                                        ) : null}
                                        <Button
                                            id="reservations-find-room-btn"
                                            type={EButtonType.secondary}
                                            size={EButtonSize.medium}
                                            text={t('findRoom')}
                                            onClick={() => {
                                                setModalState({ type: 'find-room' });
                                                openModal();
                                            }}
                                        />
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
                                    </Div>
                                ) : undefined
                            }
                        />
                    </Div>
                }
            />
        </>
    );
}
