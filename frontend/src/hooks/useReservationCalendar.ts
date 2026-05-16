'use client';

import { ApiError, backendFetchPublic } from '@/lib/reservasquad-api';
import { endTimeOptions, startTimeOptions, validEndsForStart } from '@/lib/time-slots';
import type {
    CalendarPayload,
    CalendarReservation,
    ReservationRoom,
    TeacherOption,
} from '@/types/calendar';
import {
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useReservationCalendar() {
    const [monthCursor, setMonthCursor] = useState(() => new Date());
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
    const [submitting, setSubmitting] = useState(false);

    const loadRooms = useCallback(async () => {
        try {
            const list = await backendFetchPublic<ReservationRoom[]>('/rooms');
            setRooms(Array.isArray(list) ? list : []);
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
            const y = monthCursor.getFullYear();
            const m = monthCursor.getMonth() + 1;
            const res = await backendFetchPublic<CalendarPayload>(
                `/reservations/calendar?year=${y}&month=${m}`,
            );
            setByDay(res?.byDay || {});
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Chargement impossible');
            setByDay({});
        } finally {
            setLoading(false);
        }
    }, [monthCursor]);

    useEffect(() => {
        void loadRooms();
        void loadTeachers();
    }, [loadRooms, loadTeachers]);

    useEffect(() => {
        void loadCalendar();
    }, [loadCalendar]);

    const selectedRoomCapacity = useMemo(
        () => rooms.find((r) => r.id === bookRoomId)?.capacity ?? 999,
        [rooms, bookRoomId],
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
                alert('Choisissez un professeur dans la liste (gérée par l’administration).');
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
                    }),
                });
                setShowForm(false);
                await loadCalendar();
                alert(
                    'Demande enregistrée. Elle sera affichée en « pending » jusqu’à validation par un administrateur.',
                );
            } catch (err) {
                const msg =
                    err instanceof ApiError ?
                        typeof err.body === 'object' && err.body !== null && 'message' in err.body
                        && Array.isArray((err.body as { message: unknown }).message)
                        ? ((err.body as { message: string[] }).message).join(', ')
                        : err.message
                    : 'Échec de la réservation';
                alert(msg);
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
            loadCalendar,
        ],
    );

    return {
        monthCursor,
        setMonthCursor,
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
        submitting,
        loadCalendar,
        openBooking,
        submitBooking,
        gridDays,
        selectedRoomCapacity,
        weekDays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const,
    };
}
