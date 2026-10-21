'use client';

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type DragEvent,
    type KeyboardEvent,
    type MouseEvent,
} from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
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
    resolveReservationFormPrice,
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
    addDays,
    addMonths,
    endOfDay,
    formatDayLabel,
    formatDayMonth,
    formatMonthLabel,
    formatTime,
    formatWeekdayShort,
    isSameDay,
    monthNames,
    startOfDay,
    startOfMonth,
    startOfWeek,
    toIsoDateKey,
} from '@/lib/date-utils';
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

function toLocalDateTimeInput(date: Date, hours: number, minutes = 0): string {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDateParam(raw: string | null): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw ?? '');
    if (!match) return null;
    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function parseViewParam(raw: string | null): CalendarView {
    return raw === 'day' || raw === 'week' || raw === 'month' ? raw : 'week';
}

function parseColorParam(raw: string | null): CalendarColorBy {
    return raw === 'room' || raw === 'professor' ? raw : 'payment';
}

// Prefill "now-friendly" defaults: next full hour when booking for today (8h–20h), otherwise 9h.
function defaultCreateTimes(day: Date): { startAt: string; endAt: string } {
    const now = new Date();
    const nextHour = isSameDay(day, now) ? now.getHours() + 1 : 9;
    const startHour = nextHour >= 8 && nextHour <= 20 ? nextHour : 9;
    return {
        startAt: toLocalDateTimeInput(day, startHour),
        endAt: toLocalDateTimeInput(day, startHour + 1),
    };
}

// Rooms/professors endpoints cap perPage at 100 — walk the pages so filter options never
// silently truncate. Returns the same { data, meta } envelope as the single-page fetchers,
// so the shared ['rooms-options'] / ['professors-options'] cache entries stay shape-compatible
// with the other pages that observe them (e.g. reservations).
async function fetchAllPages<T>(
    fetchPage: (page: number) => Promise<{ data: T[]; meta: { hasMore: boolean } }>,
    maxPages = 10,
): Promise<{ data: T[]; meta: { hasMore: boolean } }> {
    const all: T[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
        const result = await fetchPage(page);
        all.push(...result.data);
        if (!result.meta?.hasMore) break;
    }
    return { data: all, meta: { hasMore: false } };
}

export default function CalendarPage() {
    const t = useTranslations('admin.calendar');
    const tPay = useTranslations('admin.reservations');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const { openToast } = useToast();
    const { isAllowed } = useAuthorization();
    const canManage = isAllowed({ anyRoles: ['ADMIN', 'USER'] });
    const queryClient = useQueryClient();
    const [view, setView] = useState<CalendarView>('week');
    const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
    const [roomId, setRoomId] = useState('');
    const [professorId, setProfessorId] = useState('');
    const [colorBy, setColorBy] = useState<CalendarColorBy>('payment');
    const [isExporting, setIsExporting] = useState(false);
    const [modalState, setModalState] = useState<CalendarModalState>(null);
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);
    const [navDirection, setNavDirection] = useState<'prev' | 'next' | 'none'>('none');
    const [pendingFocusKey, setPendingFocusKey] = useState<string | null>(null);
    const [today, setToday] = useState(() => startOfDay(new Date()));
    const dragEventRef = useRef<ReservationRecord | null>(null);
    const suppressClickRef = useRef(false);
    const urlSyncedRef = useRef(false);
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    // Deep-linkable calendar state (?view=&date=&room=&professor=&color=) — read once after hydration,
    // then kept in sync so refresh/share/back preserves the exact calendar view.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const dateParam = parseDateParam(params.get('date'));
        const viewParam = parseViewParam(params.get('view'));
        const roomParam = params.get('room');
        const professorParam = params.get('professor');
        setView(viewParam);
        if (dateParam) setAnchor(dateParam);
        if (roomParam) setRoomId(roomParam);
        if (professorParam) setProfessorId(professorParam);
        setColorBy(parseColorParam(params.get('color')));
        urlSyncedRef.current = true;
    }, []);

    useEffect(() => {
        if (!urlSyncedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        params.set('view', view);
        params.set('date', toIsoDateKey(anchor));
        if (roomId) params.set('room', roomId);
        else params.delete('room');
        if (professorId) params.set('professor', professorId);
        else params.delete('professor');
        if (colorBy !== 'payment') params.set('color', colorBy);
        else params.delete('color');
        const query = params.toString();
        window.history.replaceState(
            null,
            '',
            `${window.location.pathname}${query ? `?${query}` : ''}`,
        );
    }, [view, anchor, roomId, professorId, colorBy]);

    // Keep the "today" highlight accurate when the app stays open across midnight.
    useEffect(() => {
        const timer = window.setInterval(() => {
            const next = startOfDay(new Date());
            setToday((current) => (current.getTime() === next.getTime() ? current : next));
        }, 60_000);
        return () => window.clearInterval(timer);
    }, []);

    // After keyboard navigation, move DOM focus to the day cell of the new anchor
    // (roving tabindex: only the anchor cell is in the tab order).
    useEffect(() => {
        if (!pendingFocusKey) return;
        const cell = document.querySelector<HTMLElement>(
            `[data-cal-day="${CSS.escape(pendingFocusKey)}"]`,
        );
        cell?.focus();
        setPendingFocusKey(null);
    }, [pendingFocusKey]);

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
        queryFn: () => fetchAllPages((page) => fetchRooms({ page, perPage: 100 })),
        staleTime: 5 * 60 * 1000,
    });

    const { data: professorsData } = useQuery({
        queryKey: ['professors-options'],
        queryFn: () => fetchAllPages((page) => fetchProfessors({ page, perPage: 100 })),
        staleTime: 5 * 60 * 1000,
    });

    const { data: events = [], isLoading, isFetching } = useQuery({
        queryKey: [
            'calendar',
            range.from.toISOString(),
            range.to.toISOString(),
            roomId,
            professorId,
        ],
        queryFn: () =>
            fetchCalendar({
                from: range.from.toISOString(),
                to: range.to.toISOString(),
                roomId: roomId || undefined,
                professorId: professorId || undefined,
            }),
        // Keep the previous range's events visible while a new range loads —
        // the grid no longer blanks out between period switches.
        placeholderData: keepPreviousData,
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
            const resolvedPrice = resolveReservationFormPrice(values, rooms, professors);
            if (resolvedPrice === null) {
                openToast(tCommon('error'), tPay('priceInvalid'), { type: EToastType.ERROR });
                return;
            }

            const payload = {
                title: values.title.trim() || undefined,
                roomId: values.roomId,
                professorId: values.professorId || null,
                startAt: new Date(values.startAt).toISOString(),
                endAt: new Date(values.endAt).toISOString(),
                notes: values.notes.trim() || undefined,
                status: values.status,
                isPaid: values.isPaid,
                price: resolvedPrice,
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
        [createMutation, modalState, openToast, professors, rooms, seriesMutation, tPay, tCommon, updateMutation],
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
            setDragOverKey(null);
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

    const handleDayDragOver = useCallback(
        (day: Date, e: DragEvent) => {
            if (!canManage) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverKey(day.toDateString());
        },
        [canManage],
    );

    const handleDayDragLeave = useCallback((day: Date, e: DragEvent) => {
        // dragenter/dragleave bubble from children — only clear when the pointer
        // truly leaves the day cell.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDragOverKey((current) => (current === day.toDateString() ? null : current));
    }, []);

    const clearDragOver = useCallback(() => setDragOverKey(null), []);

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

    const professorOptions = useMemo(
        () => [
            { value: '', label: t('allProfessors') },
            ...professors.map((professor) => ({
                value: professor.id,
                label: `${professor.firstName} ${professor.lastName}`,
            })),
        ],
        [professors, t],
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
        if (view === 'day') return formatDayLabel(anchor, locale);
        if (view === 'week') {
            const start = startOfWeek(anchor);
            return `${formatDayLabel(start, locale)} – ${formatDayLabel(addDays(start, 6), locale)}`;
        }
        return formatMonthLabel(anchor, locale);
    }, [anchor, locale, view]);

    const goPrev = () => {
        setNavDirection('prev');
        if (view === 'day') setAnchor((d) => addDays(d, -1));
        else if (view === 'week') setAnchor((d) => addDays(d, -7));
        else setAnchor((d) => addMonths(d, -1));
    };

    const goNext = () => {
        setNavDirection('next');
        if (view === 'day') setAnchor((d) => addDays(d, 1));
        else if (view === 'week') setAnchor((d) => addDays(d, 7));
        else setAnchor((d) => addMonths(d, 1));
    };

    const goToday = () => {
        setNavDirection('none');
        setAnchor(startOfDay(new Date()));
    };

    const goToDay = (day: Date) => {
        setNavDirection('none');
        setAnchor(startOfDay(day));
        setView('day');
    };

    // Clicking anywhere on a day only creates on desktop — on touch layouts the whole-cell
    // hit area caused accidental modal opens while scrolling. The + button and the empty
    // slot stay explicit, tappable affordances on every screen size.
    const handleCellClick = (day: Date) => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;
        openCreateForDay(day);
    };

    // Keyboard navigation: ← → step by day (week by 7), ↑ ↓ step by week in month view,
    // T jumps to today, D/W/M switch views. Ignored while typing or when a dialog is open.
    const handleShortcutsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.altKey || e.ctrlKey || e.metaKey || modalState || isDatePickerOpen) return;
        const target = e.target as HTMLElement | null;
        if (target?.closest('input, textarea, select, [role="dialog"]')) return;

        const key = e.key;
        const step = view === 'week' ? 7 : 1;

        if (key === 'ArrowLeft') {
            e.preventDefault();
            setNavDirection('prev');
            setAnchor((d) => addDays(d, -step));
            setPendingFocusKey(addDays(anchor, -step).toDateString());
        } else if (key === 'ArrowRight') {
            e.preventDefault();
            setNavDirection('next');
            setAnchor((d) => addDays(d, step));
            setPendingFocusKey(addDays(anchor, step).toDateString());
        } else if (view === 'month' && key === 'ArrowDown') {
            e.preventDefault();
            setNavDirection('next');
            setAnchor((d) => addDays(d, 7));
            setPendingFocusKey(addDays(anchor, 7).toDateString());
        } else if (view === 'month' && key === 'ArrowUp') {
            e.preventDefault();
            setNavDirection('prev');
            setAnchor((d) => addDays(d, -7));
            setPendingFocusKey(addDays(anchor, -7).toDateString());
        } else if (key === 't' || key === 'T') {
            e.preventDefault();
            goToday();
        } else if (key === 'd' || key === 'D') {
            setNavDirection('none');
            setView('day');
        } else if (key === 'w' || key === 'W') {
            setNavDirection('none');
            setView('week');
        } else if (key === 'm' || key === 'M') {
            setNavDirection('none');
            setView('month');
        }
    };

    const calendarAnimClass =
        navDirection === 'prev'
            ? 'cal-anim-prev'
            : navDirection === 'next'
                ? 'cal-anim-next'
                : 'cal-anim-fade';

    const weekdayHeaders = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) =>
                addDays(startOfWeek(new Date()), i).toLocaleDateString(locale, {
                    weekday: 'short',
                }),
            ),
        [locale],
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
                    professorId: professorId || undefined,
                });
                const { exportDailyCalendarPdf } = await import('@/lib/export-daily-calendar-pdf');
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
                    professorId: professorId || undefined,
                });
                const { exportWeeklyCalendarPdf } = await import('@/lib/export-weekly-calendar-pdf');
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
        professorId,
        roomId,
        rooms,
        t,
        tCommon,
        view,
    ]);

    return (
        <>
            {modalPortal(
                modalState?.mode === 'find-room' ? (
                    <FindFreeRoomModal
                        defaultStartAt={modalState.day ? defaultCreateTimes(modalState.day).startAt : undefined}
                        defaultEndAt={modalState.day ? defaultCreateTimes(modalState.day).endAt : undefined}
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
                                    ? defaultCreateTimes(modalState.day).startAt
                                    : undefined)
                                : undefined
                        }
                        defaultEndAt={
                            modalState.mode === 'create'
                                ? modalState.endAt ??
                                (modalState.day
                                    ? defaultCreateTimes(modalState.day).endAt
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
                    <Div className="mx-auto max-w-7xl space-y-4" onKeyDown={handleShortcutsKeyDown}>
                        <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                            <Div className="flex flex-col gap-3">
                                <Div className="flex flex-wrap items-center justify-between gap-3">
                                    <Div className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
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
                                            onClick={goToday}
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
                                    <Div className="hidden h-6 w-px bg-gray-100 sm:block" />
                                    <Div className="relative flex items-center gap-2">
                                        <Button
                                            id="cal-period"
                                            type={EButtonType.tertiary}
                                            size={EButtonSize.medium}
                                            text={periodLabel}
                                            iconPosition="right"
                                            icon={{
                                                name: IconComponentsEnum.chevronDown,
                                                size: ESize.sm,
                                                color: 'text-gray-500',
                                            }}
                                            aria-label={t('chooseDate')}
                                            aria-expanded={isDatePickerOpen}
                                            className="text-lg font-semibold capitalize text-primary-700"
                                            onClick={() => {
                                                setNavDirection('none');
                                                setDatePickerOpen((open) => !open);
                                            }}
                                        />
                                        {isDatePickerOpen ? (
                                            <MonthYearPicker
                                                locale={locale}
                                                anchor={anchor}
                                                dialogLabel={t('chooseDate')}
                                                prevLabel={t('prev')}
                                                nextLabel={t('next')}
                                                onSelect={(date) => {
                                                    setDatePickerOpen(false);
                                                    setNavDirection('none');
                                                    setAnchor(date);
                                                }}
                                                onClose={() => setDatePickerOpen(false)}
                                            />
                                        ) : null}
                                        {isFetching ? (
                                            <Spinner size={ESize.sm} color="text-gray-400" />
                                        ) : null}
                                    </Div>
                                    <Tabs
                                        options={viewOptions}
                                        value={view}
                                        onChange={(value) => {
                                            if (value === 'day' || value === 'week' || value === 'month') {
                                                setNavDirection('none');
                                                setView(value);
                                            }
                                        }}
                                        variant="pills"
                                    />
                                </Div>

                                <Div className="flex flex-wrap items-center gap-3">
                                    <Div className="flex flex-1 flex-wrap items-center gap-3">
                                        <Div className="w-full sm:w-48">
                                            <Dropdown
                                                leftIcon="filter"
                                                options={roomOptions}
                                                value={roomId}
                                                onChange={(value) => {
                                                    if (typeof value === 'string') setRoomId(value);
                                                }}
                                            />
                                        </Div>
                                        <Div className="w-full sm:w-52">
                                            <Dropdown
                                                leftIcon="filter"
                                                options={professorOptions}
                                                value={professorId}
                                                onChange={(value) => {
                                                    if (typeof value === 'string') setProfessorId(value);
                                                }}
                                            />
                                        </Div>
                                        <Div className="w-full sm:w-52">
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
                                            className="sm:ms-auto"
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
                                <Div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
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
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color="text-gray-400"
                                        className="hidden min-w-0 truncate lg:block lg:max-w-md"
                                    >
                                        {t('keyboardHint')}
                                    </Label>
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

                        <Div
                            key={`${view}-${toIsoDateKey(range.from)}`}
                            className={`overflow-clip rounded-2xl border border-gray-100 bg-white shadow-sm ${calendarAnimClass}`}
                        >
                            {view === 'day' ? (
                                <Div
                                    data-cal-day={range.days[0].toDateString()}
                                    tabIndex={0}
                                    aria-label={`${formatDayLabel(range.days[0], locale)} · ${t('eventsCount', { count: eventsByDay.get(range.days[0].toDateString())?.length ?? 0 })}`}
                                    aria-current={isSameDay(range.days[0], today) ? 'date' : undefined}
                                    onDragOver={(e: DragEvent) => handleDayDragOver(range.days[0], e)}
                                    onDragLeave={(e: DragEvent) => handleDayDragLeave(range.days[0], e)}
                                    onDrop={(e: DragEvent) => handleDayDrop(range.days[0], e)}
                                    className={`group outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400 ${canManage ? 'cursor-pointer' : ''} ${dragOverKey === range.days[0].toDateString() ? 'bg-primary-25/80 ring-2 ring-inset ring-primary-400' : ''}`}
                                    onClick={() => handleCellClick(range.days[0])}
                                >
                                    <Div className="flex items-center justify-between border-b border-gray-100 bg-gray-25 px-5 py-3.5 sm:sticky sm:top-[4.5rem] sm:z-10 lg:top-[4.75rem]">
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
                                        {canManage ? (
                                            <AddDayButton
                                                onClick={() => openCreateForDay(range.days[0])}
                                                ariaLabel={t('addReservation')}
                                            />
                                        ) : null}
                                    </Div>
                                    <Div className="p-4 sm:p-5">
                                        {isLoading ? (
                                            <SkeletonSlot variant="card" count={3} />
                                        ) : (eventsByDay.get(range.days[0].toDateString()) ?? []).length === 0 ? (
                                            <EmptySlot
                                                label={
                                                    dragOverKey === range.days[0].toDateString() && canManage
                                                        ? t('dropHere')
                                                        : canManage
                                                            ? t('addReservation')
                                                            : t('empty')
                                                }
                                                actionable={canManage}
                                                droppable={canManage && dragOverKey === range.days[0].toDateString()}
                                                onClick={canManage ? () => openCreateForDay(range.days[0]) : undefined}
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
                                                            locale={locale}
                                                            draggable={canManage}
                                                            onDragStart={handleEventDragStart}
                                                            onDragEnd={clearDragOver}
                                                            onEdit={canManage ? openEditReservation : undefined}
                                                        />
                                                    ),
                                                )}
                                            </Div>
                                        )}
                                    </Div>
                                </Div>
                            ) : null}

                            {view === 'week' ? (
                                <WeekView
                                    days={range.days}
                                    eventsByDay={eventsByDay}
                                    today={today}
                                    anchor={anchor}
                                    locale={locale}
                                    isLoading={isLoading}
                                    canManage={canManage}
                                    addDayLabel={t('addReservation')}
                                    dropHereLabel={t('dropHere')}
                                    emptyLabel={t('empty')}
                                    eventsCountLabel={(count) => t('eventsCount', { count })}
                                    onAddDay={openCreateForDay}
                                    onCellClick={handleCellClick}
                                    dragOverKey={dragOverKey}
                                    onDayDragOver={handleDayDragOver}
                                    onDayDragLeave={handleDayDragLeave}
                                    onDayDrop={handleDayDrop}
                                    onEventDragStart={handleEventDragStart}
                                    onEventDragEnd={clearDragOver}
                                    paidLabel={tPay('paid')}
                                    unpaidLabel={tPay('unpaid')}
                                    colorBy={colorBy}
                                    noProfessorLabel={tPay('noProfessor')}
                                    onEditEvent={canManage ? openEditReservation : undefined}
                                />
                            ) : null}

                            {view === 'month' ? (
                                <MonthView
                                    days={range.days}
                                    monthStart={range.monthStart}
                                    nextMonth={range.nextMonth}
                                    eventsByDay={eventsByDay}
                                    today={today}
                                    anchor={anchor}
                                    locale={locale}
                                    isLoading={isLoading}
                                    canManage={canManage}
                                    weekdayHeaders={weekdayHeaders}
                                    addDayLabel={t('addReservation')}
                                    eventsCountLabel={(count) => t('eventsCount', { count })}
                                    moreEventsLabel={(count) => t('moreEvents', { count })}
                                    onAddDay={openCreateForDay}
                                    onCellClick={handleCellClick}
                                    onSelectDay={goToDay}
                                    dragOverKey={dragOverKey}
                                    onDayDragOver={handleDayDragOver}
                                    onDayDragLeave={handleDayDragLeave}
                                    onDayDrop={handleDayDrop}
                                    onEventDragStart={handleEventDragStart}
                                    onEventDragEnd={clearDragOver}
                                    colorBy={colorBy}
                                    colorLabels={colorLabels}
                                    onEditEvent={canManage ? openEditReservation : undefined}
                                />
                            ) : null}
                        </Div>
                    </Div>
                }
            />
        </>
    );
}
