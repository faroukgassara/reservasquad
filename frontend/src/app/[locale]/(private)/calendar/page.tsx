'use client';

import { useCallback, useMemo, useRef, useState, type DragEvent, type MouseEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Badge from '@/components/Primitives/Badge/Badge';
import Icon from '@/components/Primitives/Icon/Icon';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import ReservationFormModal, { type ReservationFormValues } from '@/components/Modals/ReservationFormModal/ReservationFormModal';
import FindFreeRoomModal from '@/components/Modals/FindFreeRoomModal/FindFreeRoomModal';
import {
    createReservation,
    createReservationSeries,
    fetchCalendar,
    formatMoney,
    updateReservation,
    type ReservationRecord,
} from '@/lib/reservation-api';
import { mapReservationConflictMessage } from '@/lib/reservation-conflicts';
import {
    buildColorLegend,
    getEventAccent,
    moveReservationToDay,
    type CalendarColorBy,
} from '@/lib/calendar-event-colors';
import { fetchRooms } from '@/lib/room-api';
import { fetchProfessors } from '@/lib/professor-api';
import {
    exportWeeklyCalendarPdf,
    startOfWeek as weekStartOf,
    addDays as weekAddDays,
    startOfDay as weekStartOfDay,
} from '@/lib/export-weekly-calendar-pdf';
import { exportDailyCalendarPdf } from '@/lib/export-daily-calendar-pdf';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
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

type CalendarView = 'day' | 'week' | 'month';

type CalendarModalState =
    | {
        mode: 'create';
        day?: Date;
        roomId?: string;
        startAt?: string;
        endAt?: string;
    }
    | { mode: 'edit'; reservation: ReservationRecord }
    | { mode: 'find-room'; day?: Date }
    | null;

function formatExportDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function startOfDay(date: Date): Date {
    return weekStartOfDay(date);
}

function endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function startOfWeek(date: Date): Date {
    return weekStartOf(date);
}

function startOfMonth(date: Date): Date {
    const d = startOfDay(date);
    d.setDate(1);
    return d;
}

function addDays(date: Date, days: number): Date {
    return weekAddDays(date, days);
}

function addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
}

function toLocalDateTimeInput(date: Date, hours: number, minutes = 0): string {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDayLabel(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function formatWeekdayShort(date: Date): string {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
}

function formatDayMonth(date: Date): string {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatMonthLabel(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
    });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function AddDayButton({
    onClick,
    className = '',
}: Readonly<{ onClick: () => void; className?: string }>) {
    return (
        <Button
            id="cal-add-day"
            type={EButtonType.tertiary}
            size={EButtonSize.small}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.plus, size: ESize.xs, color: 'text-primary-500' }}
            className={`h-6 w-6 shrink-0 bg-white/80 opacity-0 shadow-xs group-hover:opacity-100 focus-visible:opacity-100 ${className}`}
            onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onClick();
            }}
        />
    );
}

function EmptySlot({
    label,
    actionable = false,
}: Readonly<{ label: string; actionable?: boolean }>) {
    return (
        <Div
            className={`flex flex-col items-center gap-2 rounded-lg py-6 text-center transition-colors ${actionable
                ? 'border border-dashed border-gray-200 group-hover:border-primary-300 group-hover:bg-primary-25/60'
                : ''
                }`}
        >
            <Div
                className={`flex size-9 items-center justify-center rounded-full ${actionable ? 'bg-primary-50' : 'bg-gray-100'
                    }`}
            >
                <Icon
                    name={actionable ? IconComponentsEnum.plus : IconComponentsEnum.calendar}
                    size={ESize.sm}
                    color={actionable ? 'text-primary-500' : 'text-gray-400'}
                />
            </Div>
            <Label
                variant={EVariantLabel.caption}
                color={actionable ? 'text-primary-600' : 'text-gray-400'}
            >
                {label}
            </Label>
        </Div>
    );
}

function EventCard({
    event,
    paidLabel,
    unpaidLabel,
    colorBy,
    noProfessorLabel,
    draggable,
    onClick,
    onDragStart,
}: Readonly<{
    event: ReservationRecord;
    paidLabel: string;
    unpaidLabel: string;
    colorBy: CalendarColorBy;
    noProfessorLabel: string;
    draggable?: boolean;
    onClick?: () => void;
    onDragStart?: (event: ReservationRecord, e: DragEvent) => void;
}>) {
    const accent = getEventAccent(event, colorBy, {
        paid: paidLabel,
        unpaid: unpaidLabel,
        noProfessor: noProfessorLabel,
    });

    return (
        <Div
            draggable={draggable}
            className={`rounded-lg border border-gray-100 border-s-2 bg-white ps-3 pe-2.5 py-2 shadow-xs transition-shadow duration-150 hover:shadow-sm ${accent.borderClass} ${onClick ? 'cursor-pointer' : ''} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onClick?.();
            }}
            onDragStart={(e: DragEvent) => {
                e.stopPropagation();
                onDragStart?.(event, e);
            }}
        >
            <Div className="flex items-center justify-between gap-2">
                <Label
                    variant={EVariantLabel.caption}
                    color="text-primary-700"
                    className="font-semibold tabular-nums"
                >
                    {formatTime(event.startAt)} – {formatTime(event.endAt)}
                </Label>
                <Badge
                    id={`cal-paid-${event.id}`}
                    text={event.isPaid ? paidLabel : unpaidLabel}
                    type={event.isPaid ? EBadgeType.success : EBadgeType.warning}
                    size={EBadgeSize.tiny}
                />
            </Div>
            <Div className="flex flex-col gap-1">
                <Label
                    variant={EVariantLabel.bodySmall}
                    color="text-gray-900"
                    className="mt-1 block truncate font-medium"
                >
                    {event.room?.name || event.title || '—'}
                </Label>
                {event.professor ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="mt-0.5 block truncate">
                        {event.professor.firstName} {event.professor.lastName}
                    </Label>
                ) : null}
                <Label variant={EVariantLabel.caption} color="text-gray-600" className="mt-1.5 block font-medium">
                    {formatMoney(event.price)}
                </Label>
            </Div>
        </Div>
    );
}

export default function CalendarPage() {
    const t = useTranslations('admin.calendar');
    const tPay = useTranslations('admin.reservations');
    const tCommon = useTranslations('common');
    const { openToast } = useToast();
    const { isAllowed } = useAuthorization();
    const canManage = isAllowed({ anyRoles: ['ADMIN', 'USER'] });
    const queryClient = useQueryClient();
    const [view, setView] = useState<CalendarView>('week');
    const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
    const [roomId, setRoomId] = useState('');
    const [colorBy, setColorBy] = useState<CalendarColorBy>('payment');
    const [isExporting, setIsExporting] = useState(false);
    const [modalState, setModalState] = useState<CalendarModalState>(null);
    const dragEventRef = useRef<ReservationRecord | null>(null);
    const suppressClickRef = useRef(false);
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    const range = useMemo(() => {
        if (view === 'day') {
            const from = startOfDay(anchor);
            return { from, to: endOfDay(anchor), days: [from] };
        }
        if (view === 'week') {
            const from = startOfWeek(anchor);
            return {
                from,
                to: endOfDay(addDays(from, 6)),
                days: Array.from({ length: 7 }, (_, i) => addDays(from, i)),
            };
        }
        const monthStart = startOfMonth(anchor);
        const gridStart = startOfWeek(monthStart);
        const nextMonth = addMonths(monthStart, 1);
        const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
        return {
            from: gridStart,
            to: endOfDay(addDays(gridStart, 41)),
            days,
            monthStart,
            nextMonth,
        };
    }, [anchor, view]);

    const exportWeek = useMemo(() => {
        const from = startOfWeek(anchor);
        return {
            from,
            to: endOfDay(addDays(from, 6)),
        };
    }, [anchor]);

    const { data: roomsData } = useQuery({
        queryKey: ['rooms-options'],
        queryFn: () => fetchRooms({ page: 1, perPage: 100 }),
    });

    const { data: professorsData } = useQuery({
        queryKey: ['professors-options'],
        queryFn: () => fetchProfessors({ page: 1, perPage: 100 }),
    });

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['calendar', range.from.toISOString(), range.to.toISOString(), roomId],
        queryFn: () =>
            fetchCalendar({
                from: range.from.toISOString(),
                to: range.to.toISOString(),
                roomId: roomId || undefined,
            }),
    });

    const rooms = roomsData?.data ?? [];
    const professors = professorsData?.data ?? [];

    const createMutation = useMutation({
        mutationFn: createReservation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
            openToast(tCommon('success'), tPay('create'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), mapReservationConflictMessage(error.message, tPay), {
                type: EToastType.ERROR,
            }),
    });

    const seriesMutation = useMutation({
        mutationFn: createReservationSeries,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
            openToast(tCommon('success'), tPay('seriesCreated', { count: result.count }), {
                type: EToastType.SUCCESS,
            });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), mapReservationConflictMessage(error.message, tPay), {
                type: EToastType.ERROR,
            }),
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string;
            body: Parameters<typeof updateReservation>[1];
        }) => updateReservation(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
            openToast(tCommon('success'), tPay('edit'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), mapReservationConflictMessage(error.message, tPay), {
                type: EToastType.ERROR,
            }),
    });

    const rescheduleMutation = useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string;
            body: Parameters<typeof updateReservation>[1];
        }) => updateReservation(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
            openToast(tCommon('success'), t('rescheduleSuccess'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), mapReservationConflictMessage(error.message, tPay), {
                type: EToastType.ERROR,
            }),
    });

    const handleFormSubmit = useCallback(
        async (values: ReservationFormValues) => {
            const payload = {
                title: values.title.trim() || undefined,
                roomId: values.roomId,
                professorId: values.professorId || null,
                startAt: new Date(values.startAt).toISOString(),
                endAt: new Date(values.endAt).toISOString(),
                notes: values.notes.trim() || undefined,
                status: values.status,
                isPaid: values.isPaid,
                ...(values.manualPrice ? { price: Number(values.price) } : {}),
            };

            if (modalState?.mode === 'edit') {
                await updateMutation.mutateAsync({
                    id: modalState.reservation.id,
                    body: payload,
                });
                return;
            }

            if (values.recurring) {
                await seriesMutation.mutateAsync({
                    ...payload,
                    professorId: values.professorId || undefined,
                    frequency: values.frequency,
                    until: values.until,
                });
                return;
            }

            await createMutation.mutateAsync({
                ...payload,
                professorId: values.professorId || undefined,
                notes: values.notes.trim() || undefined,
            });
        },
        [createMutation, modalState, seriesMutation, updateMutation],
    );

    const openCreateForDay = useCallback(
        (day: Date) => {
            if (!canManage) return;
            if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
            }
            setModalState({ mode: 'create', day });
            openModal();
        },
        [canManage, openModal],
    );

    const openEditReservation = useCallback(
        (reservation: ReservationRecord) => {
            if (!canManage) return;
            if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
            }
            setModalState({ mode: 'edit', reservation });
            openModal();
        },
        [canManage, openModal],
    );

    const handleEventDragStart = useCallback(
        (event: ReservationRecord, e: DragEvent) => {
            if (!canManage) return;
            dragEventRef.current = event;
            e.dataTransfer.setData('text/plain', event.id);
            e.dataTransfer.effectAllowed = 'move';
        },
        [canManage],
    );

    const handleDayDrop = useCallback(
        (day: Date, e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!canManage) return;

            const dragged =
                dragEventRef.current ??
                events.find((item) => item.id === e.dataTransfer.getData('text/plain'));
            dragEventRef.current = null;
            if (!dragged) return;

            const next = moveReservationToDay(dragged, day);
            if (!next) return;

            suppressClickRef.current = true;
            rescheduleMutation.mutate({
                id: dragged.id,
                body: { startAt: next.startAt, endAt: next.endAt },
            });
        },
        [canManage, events, rescheduleMutation],
    );

    const allowDayDrop = useCallback(
        (e: DragEvent) => {
            if (!canManage) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        },
        [canManage],
    );

    const roomOptions = useMemo(
        () => [
            { value: '', label: t('allRooms') },
            ...rooms.map((room) => ({
                value: room.id,
                label: room.name,
            })),
        ],
        [rooms, t],
    );

    const viewOptions = useMemo(
        () => [
            { value: 'day', label: t('day') },
            { value: 'week', label: t('week') },
            { value: 'month', label: t('month') },
        ],
        [t],
    );

    const colorByOptions = useMemo(
        () => [
            { value: 'payment', label: t('colorByPayment') },
            { value: 'room', label: t('colorByRoom') },
            { value: 'professor', label: t('colorByProfessor') },
        ],
        [t],
    );

    const colorLabels = useMemo(
        () => ({
            paid: tPay('paid'),
            unpaid: tPay('unpaid'),
            noProfessor: tPay('noProfessor'),
        }),
        [tPay],
    );

    const legendItems = useMemo(
        () => buildColorLegend(events, colorBy, colorLabels),
        [events, colorBy, colorLabels],
    );

    const eventsByDay = useMemo(() => {
        const map = new Map<string, ReservationRecord[]>();
        for (const day of range.days) {
            map.set(day.toDateString(), []);
        }
        for (const event of events) {
            const key = new Date(event.startAt).toDateString();
            const list = map.get(key);
            if (list) list.push(event);
        }
        return map;
    }, [range.days, events]);

    const periodLabel = useMemo(() => {
        if (view === 'day') return formatDayLabel(anchor);
        if (view === 'week') {
            const start = startOfWeek(anchor);
            return `${formatDayLabel(start)} – ${formatDayLabel(addDays(start, 6))}`;
        }
        return formatMonthLabel(anchor);
    }, [anchor, view]);

    const goPrev = () => {
        if (view === 'day') setAnchor((d) => addDays(d, -1));
        else if (view === 'week') setAnchor((d) => addDays(d, -7));
        else setAnchor((d) => addMonths(d, -1));
    };

    const goNext = () => {
        if (view === 'day') setAnchor((d) => addDays(d, 1));
        else if (view === 'week') setAnchor((d) => addDays(d, 7));
        else setAnchor((d) => addMonths(d, 1));
    };

    const weekdayHeaders = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) =>
                addDays(startOfWeek(new Date()), i).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                }),
            ),
        [],
    );

    const handleExportPdf = useCallback(async () => {
        const roomsToExport = roomId
            ? rooms.filter((room) => room.id === roomId)
            : rooms;
        if (roomsToExport.length === 0) {
            openToast(tCommon('error'), t('exportNoRooms'), { type: EToastType.ERROR });
            return;
        }

        setIsExporting(true);
        try {
            if (view === 'day') {
                const day = startOfDay(anchor);
                const dayEvents = await fetchCalendar({
                    from: day.toISOString(),
                    to: endOfDay(day).toISOString(),
                    roomId: roomId || undefined,
                });
                exportDailyCalendarPdf({
                    day,
                    rooms: roomsToExport,
                    events: dayEvents,
                    labels: {
                        title: t('exportDayTitle'),
                        dayLabel: t('exportDayLabel', {
                            date: formatExportDate(day),
                        }),
                        morningSection: t('exportMorningSection'),
                        eveningSection: t('exportEveningSection'),
                        empty: t('empty'),
                        roomColumn: t('exportRoomColumn'),
                    },
                });
            } else {
                const weekEvents = await fetchCalendar({
                    from: exportWeek.from.toISOString(),
                    to: exportWeek.to.toISOString(),
                    roomId: roomId || undefined,
                });
                exportWeeklyCalendarPdf({
                    anchor,
                    rooms: roomsToExport,
                    events: weekEvents,
                    labels: {
                        title: t('exportTitle'),
                        weekRange: t('exportWeekRange', {
                            from: formatExportDate(exportWeek.from),
                            to: formatExportDate(exportWeek.to),
                        }),
                        morningSection: t('exportMorningSection'),
                        eveningSection: t('exportEveningSection'),
                        empty: t('empty'),
                    },
                });
            }
            openToast(tCommon('success'), t('exportSuccess'), { type: EToastType.SUCCESS });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('exportError');
            openToast(tCommon('error'), message, { type: EToastType.ERROR });
        } finally {
            setIsExporting(false);
        }
    }, [
        anchor,
        exportWeek.from,
        exportWeek.to,
        openToast,
        roomId,
        rooms,
        t,
        tCommon,
        view,
    ]);

    const today = startOfDay(new Date());

    return (
        <>
            {modalPortal(
                modalState?.mode === 'find-room' ? (
                    <FindFreeRoomModal
                        defaultStartAt={
                            modalState.day
                                ? toLocalDateTimeInput(modalState.day, 9)
                                : undefined
                        }
                        defaultEndAt={
                            modalState.day
                                ? toLocalDateTimeInput(modalState.day, 10)
                                : undefined
                        }
                        onSelect={({ roomId, startAt, endAt }) => {
                            setModalState({
                                mode: 'create',
                                roomId,
                                startAt,
                                endAt,
                            });
                        }}
                    />
                ) : modalState ? (
                    <ReservationFormModal
                        key={
                            modalState.mode === 'create'
                                ? `create-${modalState.roomId ?? ''}-${modalState.startAt ?? ''}-${modalState.endAt ?? ''}-${modalState.day?.toISOString() ?? ''}`
                                : modalState.reservation.id
                        }
                        mode={modalState.mode}
                        reservation={modalState.mode === 'edit' ? modalState.reservation : null}
                        rooms={rooms}
                        professors={professors}
                        onSubmit={handleFormSubmit}
                        isLoading={
                            createMutation.isPending ||
                            updateMutation.isPending ||
                            seriesMutation.isPending
                        }
                        defaultRoomId={
                            modalState.mode === 'create' ? modalState.roomId : undefined
                        }
                        defaultStartAt={
                            modalState.mode === 'create'
                                ? modalState.startAt ??
                                (modalState.day
                                    ? toLocalDateTimeInput(modalState.day, 9)
                                    : undefined)
                                : undefined
                        }
                        defaultEndAt={
                            modalState.mode === 'create'
                                ? modalState.endAt ??
                                (modalState.day
                                    ? toLocalDateTimeInput(modalState.day, 10)
                                    : undefined)
                                : undefined
                        }
                    />
                ) : null,
            )}
            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <Div className="mx-auto max-w-7xl space-y-4">
                        <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                            <Div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <Div className="flex flex-wrap items-center gap-3">
                                    <Div className="inline-flex items-center gap-1 rounded-xl bg-gray-50 p-1">
                                        <Button
                                            id="cal-prev"
                                            type={EButtonType.tertiary}
                                            size={EButtonSize.small}
                                            iconPosition="only"
                                            icon={{
                                                name: IconComponentsEnum.chevronLeft,
                                                size: ESize.sm,
                                                color: 'text-gray-600',
                                            }}
                                            aria-label={t('prev')}
                                            onClick={goPrev}
                                        />
                                        <Button
                                            id="cal-today"
                                            type={EButtonType.tertiary}
                                            size={EButtonSize.small}
                                            text={t('today')}
                                            onClick={() => setAnchor(startOfDay(new Date()))}
                                        />
                                        <Button
                                            id="cal-next"
                                            type={EButtonType.tertiary}
                                            size={EButtonSize.small}
                                            iconPosition="only"
                                            icon={{
                                                name: IconComponentsEnum.chevronRight,
                                                size: ESize.sm,
                                                color: 'text-gray-600',
                                            }}
                                            aria-label={t('next')}
                                            onClick={goNext}
                                        />
                                    </Div>
                                    <Div className="flex items-center gap-2">
                                        <Label
                                            variant={EVariantLabel.h6}
                                            color="text-primary-700"
                                            className="capitalize"
                                        >
                                            {periodLabel}
                                        </Label>
                                        {isLoading ? <Spinner size={ESize.sm} color="text-gray-400" /> : null}
                                    </Div>
                                </Div>

                                <Div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                    <Tabs
                                        options={viewOptions}
                                        value={view}
                                        onChange={(value) => {
                                            if (value === 'day' || value === 'week' || value === 'month') {
                                                setView(value);
                                            }
                                        }}
                                        variant="pills"
                                    />
                                    <Div className="hidden h-8 w-px bg-gray-100 sm:block" />
                                    <Div className="flex flex-wrap items-center gap-3">
                                        <Div className="w-40 sm:w-48">
                                            <Dropdown
                                                leftIcon="filter"
                                                options={roomOptions}
                                                value={roomId}
                                                onChange={(value) => {
                                                    if (typeof value === 'string') setRoomId(value);
                                                }}
                                            />
                                        </Div>
                                        <Div className="w-44 sm:w-52">
                                            <Dropdown
                                                options={colorByOptions}
                                                value={colorBy}
                                                onChange={(value) => {
                                                    if (
                                                        value === 'payment' ||
                                                        value === 'room' ||
                                                        value === 'professor'
                                                    ) {
                                                        setColorBy(value);
                                                    }
                                                }}
                                            />
                                        </Div>
                                        <Button
                                            id="cal-export-pdf"
                                            type={EButtonType.secondary}
                                            size={EButtonSize.medium}
                                            text={view === 'day' ? t('exportDayPdf') : t('exportPdf')}
                                            isLoading={isExporting}
                                            iconPosition="left"
                                            icon={{
                                                name: IconComponentsEnum.pdf,
                                                size: ESize.sm,
                                                color: 'text-primary-500',
                                            }}
                                            onClick={() => {
                                                void handleExportPdf();
                                            }}
                                        />
                                        {canManage ? (
                                            <Button
                                                id="cal-find-room"
                                                type={EButtonType.primary}
                                                size={EButtonSize.medium}
                                                text={tPay('findRoom')}
                                                onClick={() => {
                                                    setModalState({
                                                        mode: 'find-room',
                                                        day: startOfDay(anchor),
                                                    });
                                                    openModal();
                                                }}
                                            />
                                        ) : null}
                                    </Div>
                                </Div>
                            </Div>
                            {legendItems.length > 0 ? (
                                <Div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                                        {t('legend')}
                                    </Label>
                                    {legendItems.map((item) => (
                                        <Div key={item.label} className="inline-flex items-center gap-1.5">
                                            <Div className={`size-2.5 rounded-full ${item.swatchClass}`} />
                                            <Label variant={EVariantLabel.caption} color="text-gray-600">
                                                {item.label}
                                            </Label>
                                        </Div>
                                    ))}
                                    {canManage ? (
                                        <Label
                                            variant={EVariantLabel.caption}
                                            color="text-gray-400"
                                            className="ms-auto hidden sm:block"
                                        >
                                            {t('dragHint')}
                                        </Label>
                                    ) : null}
                                </Div>
                            ) : null}
                        </Div>

                        <Div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            {view === 'day' ? (
                                <Div
                                    className={`group ${canManage ? 'cursor-pointer' : ''}`}
                                    onClick={() => openCreateForDay(range.days[0])}
                                    onDragOver={allowDayDrop}
                                    onDrop={(e) => handleDayDrop(range.days[0], e)}
                                >
                                    <Div className="flex items-center justify-between border-b border-gray-100 bg-gray-25 px-5 py-3.5">
                                        <Div>
                                            <Label
                                                variant={EVariantLabel.caption}
                                                color="text-gray-500"
                                                className="uppercase tracking-wide"
                                            >
                                                {formatWeekdayShort(range.days[0])}
                                            </Label>
                                            <Label
                                                variant={EVariantLabel.subtitle}
                                                color="text-gray-900"
                                                className="block font-semibold"
                                            >
                                                {formatDayMonth(range.days[0])}
                                            </Label>
                                        </Div>
                                        {canManage ? (
                                            <AddDayButton onClick={() => openCreateForDay(range.days[0])} />
                                        ) : null}
                                    </Div>
                                    <Div className="p-4 sm:p-5">
                                        {(eventsByDay.get(range.days[0].toDateString()) ?? []).length === 0 ? (
                                            <EmptySlot
                                                label={canManage ? t('addReservation') : t('empty')}
                                                actionable={canManage}
                                            />
                                        ) : (
                                            <Div
                                                className="max-w-md space-y-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {(eventsByDay.get(range.days[0].toDateString()) ?? []).map(
                                                    (event) => (
                                                        <EventCard
                                                            key={event.id}
                                                            event={event}
                                                            paidLabel={tPay('paid')}
                                                            unpaidLabel={tPay('unpaid')}
                                                            colorBy={colorBy}
                                                            noProfessorLabel={tPay('noProfessor')}
                                                            draggable={canManage}
                                                            onDragStart={handleEventDragStart}
                                                            onClick={
                                                                canManage
                                                                    ? () => openEditReservation(event)
                                                                    : undefined
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Div>
                                        )}
                                    </Div>
                                </Div>
                            ) : null}

                            {view === 'week' ? (
                                <Div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-7 md:divide-x md:divide-y-0">
                                    {range.days.map((day) => {
                                        const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
                                        const isToday = isSameDay(day, today);
                                        return (
                                            <Div
                                                key={day.toISOString()}
                                                className={`group flex flex-col ${canManage ? 'cursor-pointer' : ''}`}
                                                onClick={() => openCreateForDay(day)}
                                                onDragOver={allowDayDrop}
                                                onDrop={(e) => handleDayDrop(day, e)}
                                            >
                                                <Div
                                                    className={`flex items-center justify-between border-b px-3 py-2.5 ${isToday
                                                        ? 'border-b-2 border-b-accent-400 bg-accent-50/60'
                                                        : 'border-gray-100 bg-gray-25'
                                                        }`}
                                                >
                                                    <Div>
                                                        <Label
                                                            variant={EVariantLabel.caption}
                                                            color={isToday ? 'text-accent-700' : 'text-gray-500'}
                                                            className="block uppercase tracking-wide"
                                                        >
                                                            {formatWeekdayShort(day)}
                                                        </Label>
                                                        <Label
                                                            variant={EVariantLabel.bodySmall}
                                                            color={isToday ? 'text-accent-700' : 'text-gray-700'}
                                                            className="block font-semibold"
                                                        >
                                                            {formatDayMonth(day)}
                                                        </Label>
                                                    </Div>
                                                    {canManage ? (
                                                        <AddDayButton onClick={() => openCreateForDay(day)} />
                                                    ) : null}
                                                </Div>
                                                <Div className="min-h-48 flex-1 p-3">
                                                    {dayEvents.length === 0 ? (
                                                        <EmptySlot
                                                            label={canManage ? t('addReservation') : t('empty')}
                                                            actionable={canManage}
                                                        />
                                                    ) : (
                                                        <Div
                                                            className="space-y-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {dayEvents.map((event) => (
                                                                <EventCard
                                                                    key={event.id}
                                                                    event={event}
                                                                    paidLabel={tPay('paid')}
                                                                    unpaidLabel={tPay('unpaid')}
                                                                    colorBy={colorBy}
                                                                    noProfessorLabel={tPay('noProfessor')}
                                                                    draggable={canManage}
                                                                    onDragStart={handleEventDragStart}
                                                                    onClick={
                                                                        canManage
                                                                            ? () => openEditReservation(event)
                                                                            : undefined
                                                                    }
                                                                />
                                                            ))}
                                                        </Div>
                                                    )}
                                                </Div>
                                            </Div>
                                        );
                                    })}
                                </Div>
                            ) : null}

                            {view === 'month' ? (
                                <Div>
                                    <Div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                                        {weekdayHeaders.map((label) => (
                                            <Div key={label} className="px-2 py-2.5 text-center">
                                                <Label
                                                    variant={EVariantLabel.caption}
                                                    color="text-gray-500"
                                                    className="uppercase tracking-wide"
                                                >
                                                    {label}
                                                </Label>
                                            </Div>
                                        ))}
                                    </Div>
                                    <Div className="grid grid-cols-7">
                                        {range.days.map((day) => {
                                            const inMonth =
                                                range.monthStart &&
                                                range.nextMonth &&
                                                day >= range.monthStart &&
                                                day < range.nextMonth;
                                            const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
                                            const isToday = isSameDay(day, today);
                                            return (
                                                <Div
                                                    key={day.toISOString()}
                                                    className={`group min-h-28 border-b border-e border-gray-100 p-2 ${canManage ? 'cursor-pointer' : ''
                                                        } ${inMonth ? 'bg-white hover:bg-primary-25/60' : 'bg-gray-25/70'}`}
                                                    onClick={() => openCreateForDay(day)}
                                                    onDragOver={allowDayDrop}
                                                    onDrop={(e) => handleDayDrop(day, e)}
                                                >
                                                    <Div className="mb-1.5 flex items-center justify-between">
                                                        {isToday ? (
                                                            <Div className="flex size-6 items-center justify-center rounded-full bg-accent-500">
                                                                <Label
                                                                    variant={EVariantLabel.caption}
                                                                    color="text-white"
                                                                    className="font-semibold"
                                                                >
                                                                    {day.getDate()}
                                                                </Label>
                                                            </Div>
                                                        ) : (
                                                            <Label
                                                                variant={EVariantLabel.caption}
                                                                color={inMonth ? 'text-gray-700' : 'text-gray-300'}
                                                                className="font-semibold"
                                                            >
                                                                {day.getDate()}
                                                            </Label>
                                                        )}
                                                        {canManage ? (
                                                            <AddDayButton onClick={() => openCreateForDay(day)} />
                                                        ) : null}
                                                    </Div>
                                                    <Div
                                                        className="space-y-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {dayEvents.slice(0, 3).map((event) => {
                                                            const accent = getEventAccent(
                                                                event,
                                                                colorBy,
                                                                colorLabels,
                                                            );
                                                            return (
                                                                <Div
                                                                    key={event.id}
                                                                    draggable={canManage}
                                                                    className={`flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-gray-50 ${canManage ? 'cursor-grab active:cursor-grabbing' : ''
                                                                        }`}
                                                                    onDragStart={(e: DragEvent) =>
                                                                        handleEventDragStart(event, e)
                                                                    }
                                                                    onClick={(e: MouseEvent) => {
                                                                        e.stopPropagation();
                                                                        openEditReservation(event);
                                                                    }}
                                                                >
                                                                    <Div
                                                                        className={`size-1.5 shrink-0 rounded-full ${accent.dotClass}`}
                                                                    />
                                                                    <Label
                                                                        variant={EVariantLabel.caption}
                                                                        color="text-gray-700"
                                                                        className="block truncate"
                                                                    >
                                                                        {formatTime(event.startAt)} –{' '}
                                                                        {formatTime(event.endAt)}{' '}
                                                                        {event.room?.name || event.title || ''}
                                                                    </Label>
                                                                </Div>
                                                            );
                                                        })}
                                                        {dayEvents.length > 3 ? (
                                                            <Label
                                                                variant={EVariantLabel.caption}
                                                                color="text-gray-500"
                                                                className="block ps-1"
                                                            >
                                                                {t('moreEvents', { count: dayEvents.length - 3 })}
                                                            </Label>
                                                        ) : null}
                                                    </Div>
                                                </Div>
                                            );
                                        })}
                                    </Div>
                                </Div>
                            ) : null}
                        </Div>
                    </Div>
                }
            />
        </>
    );
}
