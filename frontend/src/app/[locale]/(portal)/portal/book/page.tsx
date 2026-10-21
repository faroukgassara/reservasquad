'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import PortalBookingModal, { type PortalBookingValues } from '@/components/Modals/PortalBookingModal/PortalBookingModal';
import {
    AddDayButton,
    EmptySlot,
    EventCard,
    MonthView,
    MonthYearPicker,
    SkeletonSlot,
    WeekView,
} from '@/components/Calendar';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import {
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import {
    addDays,
    addMonths,
    endOfDay,
    formatDayLabel,
    formatDayMonth,
    formatMonthLabel,
    formatTime,
    formatWeekdayShort,
    isSameDay,
    startOfDay,
    startOfWeek,
} from '@/lib/date-utils';
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

const pad = (value: number) => String(value).padStart(2, '0');

/** Next full hour when booking for today (from 08:00), otherwise 09:00–10:00. */
function defaultTimes(day: Date): { start: string; end: string } {
    const now = new Date();
    let hour = isSameDay(day, now) ? Math.max(8, now.getHours() + 1) : 9;
    if (hour > 22) hour = 22;
    return { start: `${pad(hour)}:00`, end: `${pad(hour + 1)}:00` };
}

export default function PortalBookPage() {
    const t = useTranslations('portal.book');
    const tPortal = useTranslations('portal');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const [view, setView] = useState<CalendarView>('week');
    const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
    const [roomFilter, setRoomFilter] = useState('');
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
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

    const periodLabel = useMemo(() => {
        if (view === 'day') return formatDayLabel(anchor, locale);
        if (view === 'week') {
            const start = startOfWeek(anchor);
            return `${formatDayLabel(start, locale)} – ${formatDayLabel(addDays(start, 6), locale)}`;
        }
        return formatMonthLabel(anchor, locale);
    }, [anchor, locale, view]);

    const step = (direction: -1 | 1) => {
        if (view === 'day') setAnchor((d) => addDays(d, direction));
        else if (view === 'week') setAnchor((d) => addDays(d, 7 * direction));
        else setAnchor((d) => addMonths(d, direction));
    };

    const renderDayList = (day: Date, compact = false) => {
        const events = eventsByDay.get(day.toDateString()) ?? [];
        if (isLoading) {
            return <SkeletonSlot variant="card" count={2} />;
        }
        if (events.length === 0) {
            return canBook(day) ? (
                <EmptySlot label={t('addBooking')} actionable onClick={() => openBooking(day)} />
            ) : (
                <EmptySlot label={t('emptyDay')} />
            );
        }
        return (
            <Div className={twMerge('space-y-2', !compact && 'max-w-md')}>
                {events.map((event) => (
                    <EventCard<CalendarEvent>
                        key={event.key}
                        event={event}
                        paidLabel={tPortal('status.paid')}
                        unpaidLabel={tPortal('status.unpaid')}
                        busyLabel={t('legendBusy')}
                        locale={locale}
                    />
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
                        <Div className="relative flex min-w-0 items-center gap-2">
                            <Button
                                id="portal-cal-period"
                                type={EButtonType.tertiary}
                                size={EButtonSize.small}
                                text={periodLabel}
                                iconPosition="right"
                                icon={{
                                    name: IconComponentsEnum.chevronDown,
                                    size: ESize.xs,
                                    color: 'text-primary-700',
                                }}
                                aria-label={t('date')}
                                aria-expanded={isDatePickerOpen}
                                onClick={() => setDatePickerOpen((open) => !open)}
                                className="font-semibold capitalize text-primary-700"
                            />
                            {isDatePickerOpen ? (
                                <MonthYearPicker
                                    locale={locale}
                                    anchor={anchor}
                                    dialogLabel={t('date')}
                                    prevLabel={t('prev')}
                                    nextLabel={t('next')}
                                    onSelect={(date) => {
                                        setAnchor(date);
                                        setDatePickerOpen(false);
                                    }}
                                    onClose={() => setDatePickerOpen(false)}
                                />
                            ) : null}
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
                                        <Label
                                            variant={EVariantLabel.caption}
                                            color="text-gray-500"
                                            className="uppercase tracking-wide"
                                        >
                                            {formatWeekdayShort(range.days[0], locale)}
                                        </Label>
                                        <Label
                                            variant={EVariantLabel.subtitle}
                                            color="text-gray-900"
                                            className="block font-semibold"
                                        >
                                            {formatDayMonth(range.days[0], locale)}
                                        </Label>
                                    </Div>
                                    {canBook(range.days[0]) ? (
                                        <AddDayButton
                                            ariaLabel={t('addBooking')}
                                            onClick={() => openBooking(range.days[0])}
                                        />
                                    ) : null}
                                </Div>
                                <Div className="p-4 sm:p-5">{renderDayList(range.days[0])}</Div>
                            </Div>
                        ) : null}

                        {view === 'week' ? (
                            <WeekView<CalendarEvent>
                                days={range.days}
                                eventsByDay={eventsByDay}
                                today={today}
                                anchor={anchor}
                                locale={locale}
                                isLoading={isLoading}
                                canManage={canBook}
                                addDayLabel={t('addBooking')}
                                emptyLabel={t('emptyDay')}
                                paidLabel={tPortal('status.paid')}
                                unpaidLabel={tPortal('status.unpaid')}
                                busyLabel={t('legendBusy')}
                                onAddDay={openBooking}
                            />
                        ) : null}

                        {view === 'month' && range.monthStart && range.nextMonth ? (
                            <MonthView<CalendarEvent>
                                days={range.days}
                                monthStart={range.monthStart}
                                nextMonth={range.nextMonth}
                                eventsByDay={eventsByDay}
                                today={today}
                                anchor={anchor}
                                locale={locale}
                                isLoading={isLoading}
                                canManage={canBook}
                                addDayLabel={t('addBooking')}
                                moreEventsLabel={(count) => t('moreEvents', { count })}
                                onAddDay={openBooking}
                                onSelectDay={(day) => {
                                    setAnchor(day);
                                    setView('day');
                                }}
                                renderEventChip={(event) => (
                                    <Div className="flex items-center gap-1.5 rounded px-1 py-0.5">
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
                                            {`${formatTime(event.startAt, locale)} ${event.roomName}`}
                                        </Label>
                                    </Div>
                                )}
                            />
                        ) : null}
                    </Div>
                )}
            </Div>
        </>
    );
}
