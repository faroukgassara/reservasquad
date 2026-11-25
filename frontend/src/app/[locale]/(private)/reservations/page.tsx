'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import Checkbox from '@/components/Primitives/Checkbox/Checkbox';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import ReservationFormModal, { type ReservationFormValues } from '@/components/Modals/ReservationFormModal/ReservationFormModal';
import FindFreeRoomModal from '@/components/Modals/FindFreeRoomModal/FindFreeRoomModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import UnpaidStatCard from '@/components/Primitives/UnpaidStatCard/UnpaidStatCard';
import {
    bulkMarkReservationsPaid,
    bulkDeleteReservations,
    cancelReservation,
    createReservation,
    createReservationSeries,
    deleteFutureInSeries,
    deleteReservation,
    fetchReservations,
    fetchUnpaidSummary,
    formatMoney,
    resolveReservationFormPrice,
    updateReservation,
    type ReservationRecord,
    type ReservationStatus,
} from '@/lib/reservation-api';
import { mapReservationConflictMessage } from '@/lib/reservation-conflicts';
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
    | { type: 'bulk-delete' }
    | { type: 'delete-series'; reservation: ReservationRecord }
    | null;

type PaidFilter = 'all' | 'paid' | 'unpaid';
type StatusFilter = 'all' | ReservationStatus;

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'short' });
}

function formatTime(value: string): string {
    return new Date(value).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export default function ReservationsAdminPage() {
    const t = useTranslations('admin.reservations');
    const tProf = useTranslations('admin.professors');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const { isAllowed } = useAuthorization();
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
    const [selectedPaidIds, setSelectedPaidIds] = useState<string[]>([]);
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

    const { data: unpaidSummary, isLoading: unpaidSummaryLoading } = useQuery({
        queryKey: ['unpaid-summary', professorFilter, roomFilter, fromDate, toDate],
        queryFn: () =>
            fetchUnpaidSummary({
                ...(professorFilter !== 'all' ? { professorId: professorFilter } : {}),
                ...(roomFilter !== 'all' ? { roomId: roomFilter } : {}),
                ...(fromIso ? { from: fromIso } : {}),
                ...(toExclusiveIso ? { to: toExclusiveIso } : {}),
            }),
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

    const invalidateReservations = () => {
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        queryClient.invalidateQueries({ queryKey: ['calendar'] });
        queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
        queryClient.invalidateQueries({ queryKey: ['professor'] });
        queryClient.invalidateQueries({ queryKey: ['unpaid-summary'] });
    };

    const createMutation = useMutation({
        mutationFn: createReservation,
        onSuccess: () => {
            invalidateReservations();
            openToast(tCommon('success'), t('create'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), mapReservationConflictMessage(error.message, t), {
                type: EToastType.ERROR,
            }),
    });

    const seriesMutation = useMutation({
        mutationFn: createReservationSeries,
        onSuccess: (result) => {
            invalidateReservations();
            openToast(tCommon('success'), t('seriesCreated', { count: result.count }), {
                type: EToastType.SUCCESS,
            });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), mapReservationConflictMessage(error.message, t), {
                type: EToastType.ERROR,
            }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateReservation>[1] }) =>
            updateReservation(id, body),
        onSuccess: () => {
            invalidateReservations();
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), mapReservationConflictMessage(error.message, t), {
                type: EToastType.ERROR,
            }),
    });

    const cancelMutation = useMutation({
        mutationFn: cancelReservation,
        onSuccess: () => {
            invalidateReservations();
            openToast(tCommon('success'), t('cancel'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteReservation,
        onSuccess: () => {
            invalidateReservations();
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const bulkPaidMutation = useMutation({
        mutationFn: bulkMarkReservationsPaid,
        onSuccess: (result) => {
            invalidateReservations();
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            openToast(tCommon('success'), t('bulkPaidSuccess', { count: result.updated }), {
                type: EToastType.SUCCESS,
            });
            setSelectedIds([]);
            setSelectedPaidIds([]);
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteReservations,
        onSuccess: (result) => {
            invalidateReservations();
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            openToast(tCommon('success'), t('bulkDeleteSuccess', { count: result.deleted }), {
                type: EToastType.SUCCESS,
            });
            setSelectedIds([]);
            setSelectedPaidIds([]);
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const deleteSeriesMutation = useMutation({
        mutationFn: deleteFutureInSeries,
        onSuccess: (result) => {
            invalidateReservations();
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

    const unpaidSelectedIds = useMemo(
        () => selectedIds.filter((id) => !selectedPaidIds.includes(id)),
        [selectedIds, selectedPaidIds],
    );

    const toggleSelectRow = useCallback((row: ReservationRecord) => {
        const toggle = (prev: string[]) =>
            prev.includes(row.id) ? prev.filter((item) => item !== row.id) : [...prev, row.id];
        setSelectedIds(toggle);
        if (row.isPaid) setSelectedPaidIds(toggle);
    }, []);

    const handleFormSubmit = useCallback(
        async (values: ReservationFormValues) => {
            const resolvedPrice = resolveReservationFormPrice(values, rooms, professors);
            if (resolvedPrice === null) {
                openToast(tCommon('error'), t('priceInvalid'), { type: EToastType.ERROR });
                return;
            }

            const payload = {
                title: values.title.trim() || undefined,
                roomId: values.roomId,
                professorId: values.professorId || undefined,
                startAt: new Date(values.startAt).toISOString(),
                endAt: new Date(values.endAt).toISOString(),
                notes: values.notes.trim() || undefined,
                status: values.status,
                isPaid: values.isPaid,
                price: resolvedPrice,
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
        [createMutation, modalState, openToast, professors, rooms, seriesMutation, t, tCommon, updateMutation],
    );

    const columns = useMemo(
        (): ITableColumn<ReservationRecord>[] => [
            ...(canManage
                ? [
                    {
                        headerElement: {
                            value: 'select',
                            label: '',
                            width: '48px',
                            mobile: 'primary',
                            render: (_: unknown, row: ReservationRecord) => (
                                <Div onClick={(e) => e.stopPropagation()} className="inline-flex">
                                    <Checkbox
                                        id={`reservation-select-${row.id}`}
                                        checked={selectedIds.includes(row.id)}
                                        onChange={() => toggleSelectRow(row)}
                                        label=""
                                    />
                                </Div>
                            ),
                        },
                    } satisfies ITableColumn<ReservationRecord>,
                ]
                : []),
            {
                headerElement: {
                    value: 'title',
                    label: t('titleField'),
                    mobile: 'secondary',
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
                    mobile: 'primary',
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
                    mobile: 'primary',
                    render: (_: unknown, row: ReservationRecord) => (
                        <OrganismTable.Cell
                            mainText={formatDate(row.startAt)}
                            supportingText={`${formatTime(row.startAt)} – ${formatTime(row.endAt)}`}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'price',
                    label: t('price'),
                    mobile: 'secondary',
                    render: (_: unknown, row: ReservationRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.price)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'isPaid',
                    label: t('payment'),
                    mobile: 'secondary',
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
                    mobile: 'primary',
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
                                    : EBadgeType.reverror
                            }
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [canManage, selectedIds, t, tStatus, toggleSelectRow],
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
                    description={t('bulkPaidConfirm', { count: unpaidSelectedIds.length })}
                    submitBtnText={t('bulkPaid')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => bulkPaidMutation.mutate(unpaidSelectedIds)}
                    isLoading={bulkPaidMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'bulk-delete') {
            return (
                <ConfirmationModal
                    title={t('bulkDelete')}
                    description={t('bulkDeleteConfirm', { count: selectedIds.length })}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => bulkDeleteMutation.mutate(selectedIds)}
                    isLoading={bulkDeleteMutation.isPending}
                    icon={IconComponentsEnum.trash}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
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
                    <Div className={twMerge('min-h-full space-y-4', selectedIds.length > 0 && 'pb-28 sm:pb-20')}>
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
                                searchable
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
                            <DatePickerField
                                id="reservations-filter-from"
                                label={t('filterFrom')}
                                value={fromDate}
                                max={toDate || undefined}
                                onChange={(value) => {
                                    setFromDate(value);
                                    setPage(1);
                                }}
                            />
                            <DatePickerField
                                id="reservations-filter-to"
                                label={t('filterTo')}
                                value={toDate}
                                min={fromDate || undefined}
                                onChange={(value) => {
                                    setToDate(value);
                                    setPage(1);
                                }}
                            />
                        </Div>

                        <Div className="grid gap-3 sm:grid-cols-2">
                            <UnpaidStatCard
                                label={tProf('unpaidTotal')}
                                value={formatMoney(unpaidSummary?.unpaidTotal ?? 0)}
                                supportingText={tProf('unpaidCount', {
                                    count: unpaidSummary?.unpaidCount ?? 0,
                                })}
                                isLoading={unpaidSummaryLoading}
                            />
                            <UnpaidStatCard
                                tone="paid"
                                label={tProf('paidTotal')}
                                value={formatMoney(unpaidSummary?.paidTotal ?? 0)}
                                supportingText={tProf('paidCount', {
                                    count: unpaidSummary?.paidCount ?? 0,
                                })}
                                isLoading={unpaidSummaryLoading}
                            />
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
                            onClickRow={canManage ? (row) => toggleSelectRow(row) : undefined}
                            getRowClassName={(row) =>
                                row.status === 'CANCELLED'
                                    ? 'bg-danger-25 hover:bg-danger-50 shadow-[inset_3px_0_0_0_var(--ds-danger-500)] opacity-80'
                                    : selectedIds.includes(row.id)
                                      ? 'bg-primary-10'
                                      : undefined
                            }
                            primaryAction={
                                canManage ? (
                                    <Div className="flex flex-wrap items-center gap-2">
                                        {unpaidSelectableIds.length > 0 ? (
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
            <AnimatePresence>
                {canManage && selectedIds.length > 0 ? (
                    <motion.div
                        key="reservations-selection-bar"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:bottom-6"
                    >
                        <Div className="pointer-events-auto flex w-full max-w-md flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl sm:w-auto sm:max-w-none sm:flex-nowrap">
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color="text-gray-900"
                                className="flex-1 whitespace-nowrap ps-2 font-semibold sm:flex-none sm:pe-2"
                            >
                                {t('selectedCount', { count: selectedIds.length })}
                            </Label>
                            <Div
                                className={twMerge(
                                    'order-last grid w-full gap-2 sm:order-none sm:flex sm:w-auto',
                                    unpaidSelectedIds.length > 0 ? 'grid-cols-2' : 'grid-cols-1',
                                )}
                            >
                                {unpaidSelectedIds.length > 0 ? (
                                    <Button
                                        id="reservations-bulk-paid-btn"
                                        type={EButtonType.secondary}
                                        size={EButtonSize.medium}
                                        text={t('bulkPaidSelected', { count: unpaidSelectedIds.length })}
                                        onClick={() => {
                                            setModalState({ type: 'bulk-paid' });
                                            openModal();
                                        }}
                                    />
                                ) : null}
                                <Button
                                    id="reservations-bulk-delete-btn"
                                    type={EButtonType.secondary}
                                    size={EButtonSize.medium}
                                    iconPosition="left"
                                    icon={{ name: IconComponentsEnum.trash, size: ESize.sm, color: 'text-danger-600' }}
                                    text={tCommon('delete')}
                                    onClick={() => {
                                        setModalState({ type: 'bulk-delete' });
                                        openModal();
                                    }}
                                    className="border-danger-200! text-danger-600! hover:bg-danger-25!"
                                />
                            </Div>
                            <Icon
                                name={IconComponentsEnum.close}
                                size={ESize.md}
                                color="text-gray-500"
                                className="cursor-pointer rounded-lg p-1.5 box-content hover:bg-gray-100 hover:text-gray-800"
                                handleClick={() => {
                                    setSelectedIds([]);
                                    setSelectedPaidIds([]);
                                }}
                            />
                        </Div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </>
    );
}
