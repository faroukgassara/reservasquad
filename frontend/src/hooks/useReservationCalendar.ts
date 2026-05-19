'use client';

import { ApiError, backendFetchPublic } from '@/lib/reservasquad-api';
import { endTimeOptions, startTimeOptions, validEndsForStart } from '@/lib/time-slots';
import { previewReservationTotalTnd, type ReservationPriceMode } from '@/lib/reservation-pricing';
import type {
    CalendarPayload,
    CalendarReservation,
    CalendarViewMode,
    ReservationRoom,
    TeacherOption,
} from '@/types/calendar';
import {
    calendarApiIsoRange,
    formatCalendarPeriodTitle,
    navigateCalendarCursor,
    weekIntervalFromCursor,
} from '@/lib/calendar.utils';
import {
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EToastType } from '@/Enum/Enum';
import { useToast } from '@/contexts/ToastContext';
import { useLocale, useTranslations } from 'next-intl';

export function useReservationCalendar() {
    const t = useTranslations();
    const locale = useLocale();
    const [monthCursor, setMonthCursor] = useState(() => new Date());
    const [calendarView, setCalendarView] = useState<CalendarViewMode>('month');
    const [byDay, setByDay] = useState<Record<string, CalendarReservation[]>>({});
    const [rooms, setRooms] = useState<ReservationRoom[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<CalendarReservation | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [bookTeacherId, setBookTeacherId] = useState('');
    const [bookDate, setBookDate] = useState('');
    const [bookRoomId, setBookRoomId] = useState('');
    const [bookStart, setBookStart] = useState(() => startTimeOptions()[0]);
    const [bookEnd, setBookEnd] = useState(
        () => validEndsForStart(startTimeOptions()[0])[0] ?? endTimeOptions()[0],
    );
    const [bookPeople, setBookPeople] = useState(1);
    const [bookPurpose, setBookPurpose] = useState('');
    const [bookPriceMode, setBookPriceMode] = useState<ReservationPriceMode>('ROOM_HOURLY');
    const [bookManualPrice, setBookManualPrice] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const { openToast } = useToast();

    const loadRooms = useCallback(async () => {
        try {
            const list = await backendFetchPublic<ReservationRoom[]>('/rooms');
            const normalized =
                Array.isArray(list) ?
                    list.map((r) => ({
                        ...r,
                        pricePerHour: Number(r.pricePerHour ?? 0),
                    }))
                    : [];
            setRooms(normalized);
            const firstId = Array.isArray(list) && list[0]?.id ? list[0].id : '';
            setBookRoomId((prev) => prev || firstId);
        } catch {
            setRooms([]);
        }
    }, []);

    const loadTeachers = useCallback(async () => {
        try {
            const list = await backendFetchPublic<TeacherOption[]>('/public/teachers');
            setTeachers(Array.isArray(list) ? list : []);
            setBookTeacherId((prev) => prev || list[0]?.id || '');
        } catch {
            setTeachers([]);
        }
    }, []);

    const loadCalendar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { from, to } = calendarApiIsoRange(calendarView, monthCursor);
            const res = await backendFetchPublic<CalendarPayload>(
                `/reservations/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
            );
            const raw = res?.byDay ?? {};
            const next: Record<string, CalendarReservation[]> = {};
            for (const day of Object.keys(raw)) {
                const list = raw[day];
                next[day] =
                    Array.isArray(list) ?
                        list.map((item) => ({
                            ...item,
                            paid: Boolean(item.paid),
                        }))
                        : [];
            }
            setByDay(next);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : t('calendar.loadFailed'));
            setByDay({});
        } finally {
            setLoading(false);
        }
    }, [calendarView, monthCursor, t]);

    useEffect(() => {
        void loadRooms();
        void loadTeachers();
    }, [loadRooms, loadTeachers]);

    useEffect(() => {
        void loadCalendar();
    }, [loadCalendar]);

    const navigateCalendarPrev = useCallback(() => {
        setMonthCursor((d) => navigateCalendarCursor(calendarView, d, -1));
    }, [calendarView]);

    const navigateCalendarNext = useCallback(() => {
        setMonthCursor((d) => navigateCalendarCursor(calendarView, d, 1));
    }, [calendarView]);

    const calendarPeriodTitle = useMemo(
        () => formatCalendarPeriodTitle(calendarView, monthCursor, locale),
        [calendarView, monthCursor, locale],
    );

    const calendarViewSubtitle = useMemo(() => {
        if (calendarView === 'week') return t('calendar.subtitles.week');
        if (calendarView === 'day') return t('calendar.subtitles.day');
        return t('calendar.subtitles.month');
    }, [calendarView, t]);

    const navigatePrevLabel = useMemo(() => {
        if (calendarView === 'month') return t('calendar.nav.prevMonth');
        if (calendarView === 'week') return t('calendar.nav.prevWeek');
        return t('calendar.nav.prevDay');
    }, [calendarView, t]);

    const navigateNextLabel = useMemo(() => {
        if (calendarView === 'month') return t('calendar.nav.nextMonth');
        if (calendarView === 'week') return t('calendar.nav.nextWeek');
        return t('calendar.nav.nextDay');
    }, [calendarView, t]);

    const daysInWeek = useMemo(() => weekIntervalFromCursor(monthCursor), [monthCursor]);

    const focusedDayIso = useMemo(() => format(monthCursor, 'yyyy-MM-dd'), [monthCursor]);

    const dayReservationsSorted = useMemo(() => {
        const raw = byDay[focusedDayIso] || [];
        return [...raw].sort((a, b) => a.startMinutes - b.startMinutes);
    }, [byDay, focusedDayIso]);

    const selectedRoomCapacity = useMemo(
        () => rooms.find((r) => r.id === bookRoomId)?.capacity ?? 999,
        [rooms, bookRoomId],
    );

    const selectedRoomHourlyTnd = useMemo(
        () => rooms.find((r) => r.id === bookRoomId)?.pricePerHour ?? 0,
        [rooms, bookRoomId],
    );

    const bookPricePreviewTnd = useMemo(
        () =>
            previewReservationTotalTnd({
                mode: bookPriceMode,
                pricePerHour: selectedRoomHourlyTnd,
                startTime: bookStart,
                endTime: bookEnd,
                numberOfPeople: bookPeople,
                manualPrice: bookManualPrice,
            }),
        [bookPriceMode, selectedRoomHourlyTnd, bookStart, bookEnd, bookPeople, bookManualPrice],
    );

    useEffect(() => {
        const allowed = validEndsForStart(bookStart);
        setBookEnd((prev) => (allowed.includes(prev) ? prev : allowed[allowed.length - 1] ?? '00:00'));
    }, [bookStart]);

    const gridDays = useMemo(() => {
        const monthStart = startOfMonth(monthCursor);
        const monthEnd = endOfMonth(monthCursor);
        const start = startOfWeek(monthStart, { weekStartsOn: 1 });
        const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [monthCursor]);

    const openBooking = useCallback(
        (isoDate: string) => {
            setBookDate(isoDate);
            setBookStart(startTimeOptions()[0]);
            setBookPurpose('');
            const firstEnds = validEndsForStart(startTimeOptions()[0]);
            setBookEnd(firstEnds[0] ?? endTimeOptions()[0]);
            setBookPeople(1);
            setBookPriceMode('ROOM_HOURLY');
            setBookManualPrice(0);
            setBookRoomId((prev) => prev || rooms[0]?.id || '');
            setBookTeacherId((prev) => prev || teachers[0]?.id || '');
            setShowForm(true);
        },
        [rooms, teachers],
    );

    const submitBooking = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            if (!bookTeacherId) {
                openToast(t('common.error'), t('reservation.selectTeacherError'), {
                    type: EToastType.ERROR,
                });
                return;
            }
            setSubmitting(true);
            try {
                await backendFetchPublic('/reservations/book', {
                    method: 'POST',
                    body: JSON.stringify({
                        teacherUserId: bookTeacherId,
                        roomId: bookRoomId,
                        date: bookDate,
                        startTime: bookStart,
                        endTime: bookEnd,
                        numberOfPeople: bookPeople,
                        purpose: bookPurpose.trim(),
                        priceMode: bookPriceMode,
                        ...(bookPriceMode === 'MANUAL' ? { manualPrice: bookManualPrice } : {}),
                    }),
                });
                setShowForm(false);
                await loadCalendar();
                openToast(t('common.success'), t('reservation.bookingSuccess'), {
                    type: EToastType.SUCCESS,
                });
            } catch (err) {
                openToast(
                    t('common.error'),
                    err instanceof ApiError ? err.message : t('reservation.bookingFailed'),
                    { type: EToastType.ERROR },
                );
            } finally {
                setSubmitting(false);
            }
        },
        [
            bookTeacherId,
            bookRoomId,
            bookDate,
            bookStart,
            bookEnd,
            bookPeople,
            bookPurpose,
            bookPriceMode,
            bookManualPrice,
            loadCalendar,
            openToast,
            t,
        ],
    );

    const weekDays = useMemo(
        () =>
            [
                t('calendar.weekdays.mon'),
                t('calendar.weekdays.tue'),
                t('calendar.weekdays.wed'),
                t('calendar.weekdays.thu'),
                t('calendar.weekdays.fri'),
                t('calendar.weekdays.sat'),
                t('calendar.weekdays.sun'),
            ] as const,
        [t],
    );

    return {
        monthCursor,
        setMonthCursor,
        calendarView,
        setCalendarView,
        calendarPeriodTitle,
        calendarViewSubtitle,
        navigatePrevLabel,
        navigateNextLabel,
        navigateCalendarPrev,
        navigateCalendarNext,
        daysInWeek,
        focusedDayIso,
        dayReservationsSorted,
        byDay,
        rooms,
        teachers,
        loading,
        error,
        selected,
        setSelected,
        showForm,
        setShowForm,
        bookTeacherId,
        setBookTeacherId,
        bookDate,
        setBookDate,
        bookRoomId,
        setBookRoomId,
        bookStart,
        setBookStart,
        bookEnd,
        setBookEnd,
        bookPeople,
        setBookPeople,
        bookPurpose,
        setBookPurpose,
        bookPriceMode,
        setBookPriceMode,
        bookManualPrice,
        setBookManualPrice,
        bookPricePreviewTnd,
        submitting,
        loadCalendar,
        openBooking,
        submitBooking,
        gridDays,
        selectedRoomCapacity,
        weekDays,
    };
}
