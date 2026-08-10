'use client';

import { useCallback, useMemo, useState, type MouseEvent } from 'react';
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
import ReservationFormModal, {
    type ReservationFormValues,
} from '@/components/Modals/ReservationFormModal/ReservationFormModal';
import {
    createReservation,
    fetchCalendar,
    formatMoney,
    type ReservationRecord,
} from '@/lib/reservation-api';
import { fetchRooms } from '@/lib/room-api';
import { fetchProfessors } from '@/lib/professor-api';
import {
    exportWeeklyCalendarPdf,
    startOfWeek as weekStartOf,
    addDays as weekAddDays,
    startOfDay as weekStartOfDay,
} from '@/lib/export-weekly-calendar-pdf';
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
            className={`flex flex-col items-center gap-2 rounded-lg py-6 text-center transition-colors ${
                actionable
                    ? 'border border-dashed border-gray-200 group-hover:border-primary-300 group-hover:bg-primary-25/60'
                    : ''
            }`}
        >
            <Div
                className={`flex size-9 items-center justify-center rounded-full ${
                    actionable ? 'bg-primary-50' : 'bg-gray-100'
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
}: Readonly<{
    event: ReservationRecord;
    paidLabel: string;
    unpaidLabel: string;
}>) {
    return (
        <Div
            className={`rounded-lg border border-gray-100 bg-white ps-3 pe-2.5 py-2 shadow-xs transition-shadow duration-150 hover:shadow-sm ${
                event.isPaid ? 'border-s-2 border-s-success-400' : 'border-s-2 border-s-warning-400'
            }`}
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
            <Label
                variant={EVariantLabel.bodySmall}
                color="text-gray-900"
                className="mt-1 block truncate font-medium"
            >
                {event.title || event.room?.name || '—'}
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
    );
}

export default function CalendarPage() {
    const t = useTranslations('admin.calendar');
    const tPay = useTranslations('admin.reservations');
    const tCommon = useTranslations('common');
    const { openToast } = useToast();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const queryClient = useQueryClient();
    const [view, setView] = useState<CalendarView>('week');
    const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
    const [roomId, setRoomId] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [createDay, setCreateDay] = useState<Date | null>(null);
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setCreateDay(null),
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
            setCreateDay(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const handleCreateSubmit = useCallback(
        async (values: ReservationFormValues) => {
            await createMutation.mutateAsync({
                title: values.title.trim() || undefined,
                roomId: values.roomId,
                professorId: values.professorId || undefined,
                startAt: new Date(values.startAt).toISOString(),
                endAt: new Date(values.endAt).toISOString(),
                notes: values.notes.trim() || undefined,
                status: values.status,
                isPaid: values.isPaid,
                ...(values.manualPrice ? { price: Number(values.price) } : {}),
            });
        },
        [createMutation],
    );

    const openCreateForDay = useCallback(
        (day: Date) => {
            if (!isAdmin) return;
            setCreateDay(day);
            openModal();
        },
        [isAdmin, openModal],
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
                    weekRange: t('exportWeekRange'),
                    empty: t('empty'),
                },
            });
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
    ]);

    const today = startOfDay(new Date());

    return (
        <>
            {modalPortal(
                createDay ? (
                    <ReservationFormModal
                        mode="create"
                        reservation={null}
                        rooms={rooms}
                        professors={professors}
                        onSubmit={handleCreateSubmit}
                        isLoading={createMutation.isPending}
                        defaultStartAt={toLocalDateTimeInput(createDay, 9)}
                        defaultEndAt={toLocalDateTimeInput(createDay, 10)}
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
                                        <Button
                                            id="cal-export-pdf"
                                            type={EButtonType.secondary}
                                            size={EButtonSize.medium}
                                            text={t('exportPdf')}
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
                                    </Div>
                                </Div>
                            </Div>
                        </Div>

                        <Div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            {view === 'day' ? (
                                <Div
                                    className={`group ${isAdmin ? 'cursor-pointer' : ''}`}
                                    onClick={() => openCreateForDay(range.days[0])}
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
                                        {isAdmin ? (
                                            <AddDayButton onClick={() => openCreateForDay(range.days[0])} />
                                        ) : null}
                                    </Div>
                                    <Div className="p-4 sm:p-5">
                                        {(eventsByDay.get(range.days[0].toDateString()) ?? []).length === 0 ? (
                                            <EmptySlot
                                                label={isAdmin ? t('addReservation') : t('empty')}
                                                actionable={isAdmin}
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
                                                className={`group flex flex-col ${isAdmin ? 'cursor-pointer' : ''}`}
                                                onClick={() => openCreateForDay(day)}
                                            >
                                                <Div
                                                    className={`flex items-center justify-between border-b px-3 py-2.5 ${
                                                        isToday
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
                                                    {isAdmin ? (
                                                        <AddDayButton onClick={() => openCreateForDay(day)} />
                                                    ) : null}
                                                </Div>
                                                <Div className="min-h-48 flex-1 p-3">
                                                    {dayEvents.length === 0 ? (
                                                        <EmptySlot
                                                            label={isAdmin ? t('addReservation') : t('empty')}
                                                            actionable={isAdmin}
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
                                                    className={`group min-h-28 border-b border-e border-gray-100 p-2 ${
                                                        isAdmin ? 'cursor-pointer' : ''
                                                    } ${inMonth ? 'bg-white hover:bg-primary-25/60' : 'bg-gray-25/70'}`}
                                                    onClick={() => openCreateForDay(day)}
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
                                                        {isAdmin ? (
                                                            <AddDayButton onClick={() => openCreateForDay(day)} />
                                                        ) : null}
                                                    </Div>
                                                    <Div
                                                        className="space-y-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {dayEvents.slice(0, 3).map((event) => (
                                                            <Div
                                                                key={event.id}
                                                                className="flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-gray-50"
                                                            >
                                                                <Div
                                                                    className={`size-1.5 shrink-0 rounded-full ${
                                                                        event.isPaid ? 'bg-success-400' : 'bg-warning-400'
                                                                    }`}
                                                                />
                                                                <Label
                                                                    variant={EVariantLabel.caption}
                                                                    color="text-gray-700"
                                                                    className="block truncate"
                                                                >
                                                                    {formatTime(event.startAt)}{' '}
                                                                    {event.room?.name || event.title || ''}
                                                                </Label>
                                                            </Div>
                                                        ))}
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
