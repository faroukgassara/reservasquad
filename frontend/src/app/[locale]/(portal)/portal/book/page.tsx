'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import PortalBookingModal, { type PortalBookingValues } from '@/components/Modals/PortalBookingModal/PortalBookingModal';
import { useModal } from '@/contexts/ModalContext';
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
import { formatMoney } from '@/lib/daily-income-api';
import { addDays, startOfDay, startOfWeek } from '@/lib/export-weekly-calendar-pdf';
import { bookPortalReservation, fetchPortalSchedule, PortalApiError, toDateInput } from '@/lib/portal-api';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarEvent {
    key: string;
    roomId: string;
    roomName: string;
    startAt: string;
    endAt: string;
    mine: boolean;
    title?: string | null;
    price?: number;
    isPaid?: boolean;
}

const MONTH_PREVIEW = 3;

function endOfDay(date: Date): Date {
    const day = new Date(date);
    day.setHours(23, 59, 59, 999);
    return day;
}

function addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Next full hour when booking for today (from 08:00), otherwise 09:00–10:00. */
function defaultTimes(day: Date): { start: string; end: string } {
    const now = new Date();
    let hour = isSameDay(day, now) ? Math.max(8, now.getHours() + 1) : 9;
    if (hour > 22) hour = 22;
    return { start: `${pad(hour)}:00`, end: `${pad(hour + 1)}:00` };
}

function EventItem({ event, locale }: Readonly<{ event: CalendarEvent; locale: string }>) {
    const t = useTranslations('portal');
    const time = (iso: string) =>
        new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });

    if (!event.mine) {
        return (
            <Div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-2.5 py-1.5">
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block tabular-nums">
                    {`${time(event.startAt)} – ${time(event.endAt)}`}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block truncate">
                    {`${event.roomName} · ${t('book.legendBusy')}`}
                </Label>
            </Div>
        );
    }

    return (
        <Div className="rounded-lg border border-gray-100 border-s-2 border-s-primary-500 bg-white py-2 ps-3 pe-2.5 shadow-xs">
            <Div className="flex flex-col gap-1.5">
                <Div className="flex flex-col tabular-nums">
                    <Label variant={EVariantLabel.bodySmall} color="text-primary-700">
                        {time(event.startAt)}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {time(event.endAt)}
                    </Label>
                </Div>
                <Badge
                    id={`portal-cal-paid-${event.key}`}
                    text={event.isPaid ? t('status.paid') : t('status.unpaid')}
                    type={event.isPaid ? EBadgeType.success : EBadgeType.warning}
                    size={EBadgeSize.tiny}
                    className="h-auto min-h-6 w-fit max-w-full shrink-0 whitespace-nowrap px-2 py-0.5 leading-none"
                />
            </Div>
            <Div className="mt-1.5 flex flex-col gap-1">
                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="block truncate">
                    {event.roomName}
                </Label>
                {event.title ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block truncate">
                        {event.title}
                    </Label>
                ) : null}
                {event.price !== undefined ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-600" className="mt-0.5 block">
                        {formatMoney(event.price)}
                    </Label>
                ) : null}
            </Div>
        </Div>
    );
}

function AddButton({ onClick, label }: Readonly<{ onClick: () => void; label: string }>) {
    return (
        <Button
            id="portal-cal-add"
            type={EButtonType.tertiary}
            size={EButtonSize.small}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.plus, size: ESize.xs, color: 'text-primary-500' }}
            aria-label={label}
            className="h-7 w-7 shrink-0 bg-white/80 shadow-xs"
            onClick={onClick}
        />
    );
}

function EmptyDay({ label, onClick }: Readonly<{ label: string; onClick?: () => void }>) {
    const content = (
        <>
            <Div
                className={twMerge(
                    'flex size-9 items-center justify-center rounded-full',
                    onClick ? 'bg-primary-50' : 'bg-gray-100',
                )}
            >
                <Icon
                    name={onClick ? IconComponentsEnum.plus : IconComponentsEnum.calendar}
                    size={ESize.sm}
                    color={onClick ? 'text-primary-500' : 'text-gray-400'}
                />
            </Div>
            <Label variant={EVariantLabel.caption} color={onClick ? 'text-primary-600' : 'text-gray-400'}>
                {label}
            </Label>
        </>
    );

    if (!onClick) {
        return <Div className="flex flex-col items-center gap-2 py-6 text-center">{content}</Div>;
    }
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 py-6 text-center transition-colors hover:border-primary-300 hover:bg-primary-25/60 focus-visible:border-primary-400 focus-visible:outline-none"
        >
            {content}
        </button>
    );
}

export default function PortalBookPage() {
    const t = useTranslations('portal.book');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const [view, setView] = useState<CalendarView>('week');
    const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
    const [roomFilter, setRoomFilter] = useState('');
    const [bookingDay, setBookingDay] = useState<Date | null>(null);
    const { openModal, closeModal, modalPortal } = useModal({ closeCallBack: () => setBookingDay(null) });
    const today = startOfDay(new Date());

    const range = useMemo(() => {
        if (view === 'day') {
            const from = startOfDay(anchor);
            return { from, to: endOfDay(from), days: [from] };
        }
        if (view === 'week') {
            const from = startOfWeek(anchor);
            return { from, to: endOfDay(addDays(from, 6)), days: Array.from({ length: 7 }, (_, i) => addDays(from, i)) };
        }
        const monthStart = startOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
        const gridStart = startOfWeek(monthStart);
        return {
            from: gridStart,
            to: endOfDay(addDays(gridStart, 41)),
            days: Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
            monthStart,
            nextMonth: addMonths(monthStart, 1),
        };
    }, [anchor, view]);

    const { data, isLoading, isFetching, isError, refetch } = useQuery({
        queryKey: ['portal-schedule', range.from.toISOString(), range.to.toISOString()],
        queryFn: () => fetchPortalSchedule(range.from.toISOString(), range.to.toISOString()),
        placeholderData: keepPreviousData,
    });

    const rooms = useMemo(() => data?.rooms ?? [], [data]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const day of range.days) map.set(day.toDateString(), []);
        for (const room of rooms) {
            if (roomFilter && room.id !== roomFilter) continue;
            for (const slot of room.busy) {
                const list = map.get(new Date(slot.startAt).toDateString());
                list?.push({
                    key: slot.id ?? `${room.id}-${slot.startAt}`,
                    roomId: room.id,
                    roomName: room.name,
                    startAt: slot.startAt,
                    endAt: slot.endAt,
                    mine: slot.mine,
                    title: slot.title,
                    price: slot.price,
                    isPaid: slot.isPaid,
                });
            }
        }
        for (const list of map.values()) {
            list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        }
        return map;
    }, [range.days, rooms, roomFilter]);

    const bookMutation = useMutation({
        mutationFn: (values: PortalBookingValues) => bookPortalReservation(values),
        onSuccess: () => {
            closeModal();
            void queryClient.invalidateQueries({ queryKey: ['portal-me'] });
            void queryClient.invalidateQueries({ queryKey: ['portal-reservations'] });
            void queryClient.invalidateQueries({ queryKey: ['portal-schedule'] });
            openToast(tCommon('success'), t('booked'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => {
            const message = error instanceof PortalApiError && error.status === 409 ? t('conflict') : t('bookError');
            void queryClient.invalidateQueries({ queryKey: ['portal-schedule'] });
            void queryClient.invalidateQueries({ queryKey: ['portal-availability'] });
            openToast(tCommon('error'), message, { type: EToastType.ERROR });
        },
    });

    const canBook = (day: Date) => day.getTime() >= today.getTime();

    const openBooking = (day: Date) => {
        if (!canBook(day)) return;
        setBookingDay(day);
        openModal();
    };

    const time = (iso: string) =>
        new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
    const weekday = (day: Date) => day.toLocaleDateString(locale, { weekday: 'short' });
    const dayMonth = (day: Date) => day.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    const dayLabel = (day: Date) => day.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

    const periodLabel = (() => {
        if (view === 'day') return dayLabel(anchor);
        if (view === 'week') {
            const start = startOfWeek(anchor);
            return `${dayLabel(start)} – ${dayLabel(addDays(start, 6))}`;
        }
        return anchor.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    })();

    const step = (direction: -1 | 1) => {
        if (view === 'day') setAnchor((d) => addDays(d, direction));
        else if (view === 'week') setAnchor((d) => addDays(d, 7 * direction));
        else setAnchor((d) => addMonths(d, direction));
    };

    const weekdayHeaders = Array.from({ length: 7 }, (_, i) => weekday(addDays(startOfWeek(new Date()), i)));

    const renderDayList = (day: Date, compact = false) => {
        const events = eventsByDay.get(day.toDateString()) ?? [];
        if (isLoading) {
            return (
                <Div className="space-y-2" aria-hidden="true">
                    {[0, 1].map((index) => (
                        <Div key={index} className="h-16 animate-pulse rounded-lg border border-gray-100 bg-gray-50" />
                    ))}
                </Div>
            );
        }
        if (events.length === 0) {
            return canBook(day) ? (
                <EmptyDay label={t('addBooking')} onClick={() => openBooking(day)} />
            ) : (
                <EmptyDay label={t('emptyDay')} />
            );
        }
        return (
            <Div className={twMerge('space-y-2', !compact && 'max-w-md')}>
                {events.map((event) => (
                    <EventItem key={event.key} event={event} locale={locale} />
                ))}
            </Div>
        );
    };

    const defaults = bookingDay ? defaultTimes(bookingDay) : null;

    return (
        <>
            {modalPortal(
                bookingDay && defaults ? (
                    <PortalBookingModal
                        rooms={rooms.map((room) => ({ id: room.id, name: room.name }))}
                        defaultRoomId={roomFilter || undefined}
                        defaultDate={toDateInput(bookingDay)}
                        defaultStart={defaults.start}
                        defaultEnd={defaults.end}
                        isLoading={bookMutation.isPending}
                        onConfirm={(values) => bookMutation.mutate(values)}
                    />
                ) : null,
            )}

            <Div className="space-y-4">
                <Div className="flex flex-col gap-1">
                    <Label variant={EVariantLabel.h3} color="text-gray-900">
                        {t('title')}
                    </Label>
                    <Label variant={EVariantLabel.body} color="text-gray-500">
                        {t('subtitle')}
                    </Label>
                </Div>

                <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                    <Div className="flex flex-wrap items-center justify-between gap-3">
                        <Div className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
                            <Button
                                id="portal-cal-prev"
                                type={EButtonType.tertiary}
                                size={EButtonSize.small}
                                iconPosition="only"
                                icon={{ name: IconComponentsEnum.chevronLeft, size: ESize.sm, color: 'text-gray-600' }}
                                aria-label={t('prev')}
                                className="rtl:[&_svg]:-scale-x-100"
                                onClick={() => step(-1)}
                            />
                            <Button
                                id="portal-cal-today"
                                type={EButtonType.tertiary}
                                size={EButtonSize.small}
                                text={t('today')}
                                onClick={() => setAnchor(startOfDay(new Date()))}
                            />
                            <Button
                                id="portal-cal-next"
                                type={EButtonType.tertiary}
                                size={EButtonSize.small}
                                iconPosition="only"
                                icon={{ name: IconComponentsEnum.chevronRight, size: ESize.sm, color: 'text-gray-600' }}
                                aria-label={t('next')}
                                className="rtl:[&_svg]:-scale-x-100"
                                onClick={() => step(1)}
                            />
                        </Div>
                        <Div className="flex min-w-0 items-center gap-2">
                            <Label variant={EVariantLabel.h6} color="text-primary-700" className="truncate capitalize">
                                {periodLabel}
                            </Label>
                            {isFetching ? <Spinner size={ESize.sm} color="text-gray-400" /> : null}
                        </Div>
                        <Tabs
                            variant="pills"
                            options={[
                                { value: 'day', label: t('day') },
                                { value: 'week', label: t('week') },
                                { value: 'month', label: t('month') },
                            ]}
                            value={view}
                            onChange={(value) => {
                                if (value === 'day' || value === 'week' || value === 'month') setView(value);
                            }}
                        />
                    </Div>

                    <Div className="mt-3 flex flex-wrap items-center gap-3">
                        <Div className="w-full sm:w-56">
                            <Dropdown
                                leftIcon="filter"
                                options={[
                                    { value: '', label: t('allRooms') },
                                    ...rooms.map((room) => ({ value: room.id, label: room.name })),
                                ]}
                                value={roomFilter}
                                onChange={(value) => {
                                    if (typeof value === 'string') setRoomFilter(value);
                                }}
                            />
                        </Div>
                        <Button
                            id="portal-cal-book"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            iconPosition="left"
                            icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                            text={t('addBooking')}
                            className="w-full sm:ms-auto sm:w-auto"
                            onClick={() => openBooking(canBook(anchor) ? anchor : today)}
                        />
                    </Div>

                    <Div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                        <Div className="inline-flex items-center gap-1.5">
                            <Div className="size-2.5 rounded-full bg-primary-500" />
                            <Label variant={EVariantLabel.caption} color="text-gray-600">
                                {t('legendMine')}
                            </Label>
                        </Div>
                        <Div className="inline-flex items-center gap-1.5">
                            <Div className="size-2.5 rounded-full border border-dashed border-gray-400 bg-gray-100" />
                            <Label variant={EVariantLabel.caption} color="text-gray-600">
                                {t('legendBusy')}
                            </Label>
                        </Div>
                        <Label variant={EVariantLabel.caption} color="text-gray-400" className="ms-auto hidden sm:block">
                            {t('calendarHint')}
                        </Label>
                    </Div>
                </Div>

                {isError ? (
                    <Div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-center">
                        <Label variant={EVariantLabel.bodySmall} color="text-danger-600">
                            {t('availabilityError')}
                        </Label>
                        <Button
                            id="portal-cal-retry"
                            type={EButtonType.secondary}
                            size={EButtonSize.small}
                            text={t('retry')}
                            onClick={() => refetch()}
                        />
                    </Div>
                ) : (
                    <Div className="overflow-clip rounded-2xl border border-gray-100 bg-white shadow-sm">
                        {view === 'day' ? (
                            <Div>
                                <Div className="flex items-center justify-between border-b border-gray-100 bg-gray-25 px-5 py-3.5">
                                    <Div>
                                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="uppercase tracking-wide">
                                            {weekday(range.days[0])}
                                        </Label>
                                        <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="block font-semibold">
                                            {dayMonth(range.days[0])}
                                        </Label>
                                    </Div>
                                    {canBook(range.days[0]) ? (
                                        <AddButton label={t('addBooking')} onClick={() => openBooking(range.days[0])} />
                                    ) : null}
                                </Div>
                                <Div className="p-4 sm:p-5">{renderDayList(range.days[0])}</Div>
                            </Div>
                        ) : null}

                        {view === 'week' ? (
                            <Div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-7 md:divide-x md:divide-y-0 rtl:md:divide-x-reverse">
                                {range.days.map((day) => {
                                    const isToday = isSameDay(day, today);
                                    return (
                                        <Div key={day.toISOString()} className="flex flex-col" aria-current={isToday ? 'date' : undefined}>
                                            <Div
                                                className={twMerge(
                                                    'flex items-center justify-between border-b px-3 py-2.5',
                                                    isToday ? 'border-b-2 border-b-accent-400 bg-accent-50/60' : 'border-gray-100 bg-gray-25',
                                                )}
                                            >
                                                <Div>
                                                    <Label
                                                        variant={EVariantLabel.caption}
                                                        color={isToday ? 'text-accent-700' : 'text-gray-500'}
                                                        className="block uppercase tracking-wide"
                                                    >
                                                        {weekday(day)}
                                                    </Label>
                                                    <Label
                                                        variant={EVariantLabel.bodySmall}
                                                        color={isToday ? 'text-accent-700' : 'text-gray-700'}
                                                        className="block font-semibold"
                                                    >
                                                        {dayMonth(day)}
                                                    </Label>
                                                </Div>
                                                {canBook(day) ? (
                                                    <AddButton label={t('addBooking')} onClick={() => openBooking(day)} />
                                                ) : null}
                                            </Div>
                                            <Div className="min-h-48 flex-1 p-3">{renderDayList(day, true)}</Div>
                                        </Div>
                                    );
                                })}
                            </Div>
                        ) : null}

                        {view === 'month' && range.monthStart && range.nextMonth ? (
                            <Div>
                                <Div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                                    {weekdayHeaders.map((label) => (
                                        <Div key={label} className="px-2 py-2.5 text-center">
                                            <Label variant={EVariantLabel.caption} color="text-gray-500" className="uppercase tracking-wide">
                                                {label}
                                            </Label>
                                        </Div>
                                    ))}
                                </Div>
                                <Div className="grid grid-cols-7">
                                    {range.days.map((day) => {
                                        const inMonth = day >= range.monthStart && day < range.nextMonth;
                                        const events = eventsByDay.get(day.toDateString()) ?? [];
                                        const isToday = isSameDay(day, today);
                                        const bookable = canBook(day);
                                        return (
                                            <Div
                                                key={day.toISOString()}
                                                className={twMerge(
                                                    'min-h-28 border-b border-e border-gray-100 p-1.5 sm:p-2',
                                                    inMonth ? 'bg-white' : 'bg-gray-25/70',
                                                )}
                                            >
                                                <Div className="mb-1.5 flex items-center justify-between gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAnchor(day);
                                                            setView('day');
                                                        }}
                                                        aria-label={dayLabel(day)}
                                                        className={twMerge(
                                                            'flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors',
                                                            isToday ? 'bg-accent-500' : 'hover:bg-gray-100',
                                                        )}
                                                    >
                                                        <Label
                                                            variant={EVariantLabel.caption}
                                                            color={isToday ? 'text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'}
                                                            className="font-semibold"
                                                        >
                                                            {day.getDate()}
                                                        </Label>
                                                    </button>
                                                    {bookable && inMonth ? (
                                                        <AddButton label={t('addBooking')} onClick={() => openBooking(day)} />
                                                    ) : null}
                                                </Div>
                                                <Div className="space-y-1">
                                                    {events.slice(0, MONTH_PREVIEW).map((event) => (
                                                        <Div key={event.key} className="flex items-center gap-1.5 rounded px-1 py-0.5">
                                                            <Div
                                                                className={twMerge(
                                                                    'size-1.5 shrink-0 rounded-full',
                                                                    event.mine ? 'bg-primary-500' : 'bg-gray-300',
                                                                )}
                                                            />
                                                            <Label
                                                                variant={EVariantLabel.caption}
                                                                color={event.mine ? 'text-gray-800' : 'text-gray-400'}
                                                                className="block truncate"
                                                            >
                                                                {`${time(event.startAt)} ${event.roomName}`}
                                                            </Label>
                                                        </Div>
                                                    ))}
                                                    {events.length > MONTH_PREVIEW ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setAnchor(day);
                                                                setView('day');
                                                            }}
                                                            className="cursor-pointer px-1 text-start"
                                                        >
                                                            <Label variant={EVariantLabel.caption} color="text-gray-500" className="hover:underline">
                                                                {t('moreEvents', { count: events.length - MONTH_PREVIEW })}
                                                            </Label>
                                                        </button>
                                                    ) : null}
                                                </Div>
                                            </Div>
                                        );
                                    })}
                                </Div>
                            </Div>
                        ) : null}
                    </Div>
                )}
            </Div>
        </>
    );
}
