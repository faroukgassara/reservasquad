'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Badge from '@/components/Primitives/Badge/Badge';
import {
    fetchCalendar,
    formatMoney,
    type ReservationRecord,
} from '@/lib/reservation-api';
import { fetchRooms } from '@/lib/room-api';
import {
    exportWeeklyCalendarPdf,
    startOfWeek as weekStartOf,
    addDays as weekAddDays,
    startOfDay as weekStartOfDay,
} from '@/lib/export-weekly-calendar-pdf';
import { useToast } from '@/contexts/ToastContext';
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

function formatDayLabel(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
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
        <Div className="rounded-lg bg-accent-50 px-2 py-1.5">
            <Label
                variant={EVariantLabel.caption}
                color="text-accent-700"
                className="block font-semibold"
            >
                {formatTime(event.startAt)} – {formatTime(event.endAt)}
            </Label>
            <Label variant={EVariantLabel.caption} color="text-gray-800" className="block">
                {event.title || event.room?.name || '—'}
            </Label>
            {event.professor ? (
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                    {event.professor.firstName} {event.professor.lastName}
                </Label>
            ) : null}
            <Div className="mt-1 flex flex-wrap items-center gap-1">
                <Label variant={EVariantLabel.caption} color="text-gray-700" className="block">
                    {formatMoney(event.price)}
                </Label>
                <Badge
                    id={`cal-paid-${event.id}`}
                    text={event.isPaid ? paidLabel : unpaidLabel}
                    type={event.isPaid ? EBadgeType.success : EBadgeType.warning}
                    size={EBadgeSize.small}
                />
            </Div>
        </Div>
    );
}

export default function CalendarPage() {
    const t = useTranslations('admin.calendar');
    const tPay = useTranslations('admin.reservations');
    const tCommon = useTranslations('common');
    const { openToast } = useToast();
    const [view, setView] = useState<CalendarView>('week');
    const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
    const [roomId, setRoomId] = useState('');
    const [isExporting, setIsExporting] = useState(false);

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

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            mainSection={
                <Div className="mx-auto max-w-7xl space-y-4">
                    <Div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <Div className="flex flex-wrap items-center gap-2">
                            <Button
                                id="cal-prev"
                                type={EButtonType.secondary}
                                size={EButtonSize.small}
                                text={t('prev')}
                                onClick={goPrev}
                            />
                            <Button
                                id="cal-today"
                                type={EButtonType.secondary}
                                size={EButtonSize.small}
                                text={t('today')}
                                onClick={() => setAnchor(startOfDay(new Date()))}
                            />
                            <Button
                                id="cal-next"
                                type={EButtonType.secondary}
                                size={EButtonSize.small}
                                text={t('next')}
                                onClick={goNext}
                            />
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color="text-primary-700"
                                className="px-2"
                            >
                                {periodLabel}
                            </Label>
                            <Button
                                id="cal-export-pdf"
                                type={EButtonType.primary}
                                size={EButtonSize.small}
                                text={t('exportPdf')}
                                isLoading={isExporting}
                                iconPosition="left"
                                icon={{
                                    name: IconComponentsEnum.pdf,
                                    size: ESize.sm,
                                    color: 'text-white',
                                }}
                                onClick={() => {
                                    void handleExportPdf();
                                }}
                            />
                        </Div>
                        <Div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
                            <Div className="w-full sm:w-40">
                                <Dropdown
                                    label={t('view')}
                                    options={viewOptions}
                                    value={view}
                                    onChange={(value) => {
                                        if (value === 'day' || value === 'week' || value === 'month') {
                                            setView(value);
                                        }
                                    }}
                                />
                            </Div>
                            <Div className="w-full sm:w-64">
                                <Dropdown
                                    label={t('filterRoom')}
                                    options={roomOptions}
                                    value={roomId}
                                    onChange={(value) => {
                                        if (typeof value === 'string') setRoomId(value);
                                    }}
                                />
                            </Div>
                        </Div>
                    </Div>

                    {isLoading ? (
                        <Label variant={EVariantLabel.body} color="text-gray-500">
                            …
                        </Label>
                    ) : null}

                    {view === 'day' ? (
                        <Div className="min-h-80 rounded-xl border border-gray-100 bg-white p-4">
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color="text-primary-600"
                                className="mb-3 block"
                            >
                                {formatDayLabel(range.days[0])}
                            </Label>
                            {(eventsByDay.get(range.days[0].toDateString()) ?? []).length === 0 ? (
                                <Label variant={EVariantLabel.caption} color="text-gray-400">
                                    {t('empty')}
                                </Label>
                            ) : (
                                <Div className="space-y-2">
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
                    ) : null}

                    {view === 'week' ? (
                        <Div className="grid gap-3 md:grid-cols-7">
                            {range.days.map((day) => {
                                const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
                                return (
                                    <Div
                                        key={day.toISOString()}
                                        className="min-h-40 rounded-xl border border-gray-100 bg-white p-3"
                                    >
                                        <Label
                                            variant={EVariantLabel.caption}
                                            color="text-primary-600"
                                            className="mb-2 block uppercase"
                                        >
                                            {formatDayLabel(day)}
                                        </Label>
                                        {dayEvents.length === 0 ? (
                                            <Label
                                                variant={EVariantLabel.caption}
                                                color="text-gray-400"
                                            >
                                                {t('empty')}
                                            </Label>
                                        ) : (
                                            <Div className="space-y-2">
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
                                );
                            })}
                        </Div>
                    ) : null}

                    {view === 'month' ? (
                        <Div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                            <Div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                                {weekdayHeaders.map((label) => (
                                    <Div key={label} className="px-2 py-2 text-center">
                                        <Label
                                            variant={EVariantLabel.caption}
                                            color="text-gray-500"
                                            className="uppercase"
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
                                    const isToday =
                                        day.toDateString() === startOfDay(new Date()).toDateString();
                                    return (
                                        <Div
                                            key={day.toISOString()}
                                            className={`min-h-28 border-b border-r border-gray-100 p-2 ${
                                                inMonth ? 'bg-white' : 'bg-gray-50/60'
                                            } ${isToday ? 'ring-1 ring-inset ring-accent-300' : ''}`}
                                        >
                                            <Label
                                                variant={EVariantLabel.caption}
                                                color={inMonth ? 'text-primary-700' : 'text-gray-400'}
                                                className="mb-1 block font-semibold"
                                            >
                                                {day.getDate()}
                                            </Label>
                                            <Div className="space-y-1">
                                                {dayEvents.slice(0, 3).map((event) => (
                                                    <Div
                                                        key={event.id}
                                                        className="truncate rounded bg-accent-50 px-1 py-0.5"
                                                    >
                                                        <Label
                                                            variant={EVariantLabel.caption}
                                                            color="text-accent-700"
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
                                                    >
                                                        +{dayEvents.length - 3}
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
            }
        />
    );
}
