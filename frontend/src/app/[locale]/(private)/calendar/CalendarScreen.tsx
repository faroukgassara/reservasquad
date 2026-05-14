'use client';

import { useSession } from 'next-auth/react';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, backendFetch } from '@/lib/reservasquad-api';
import { endTimeOptions, startTimeOptions, validEndsForStart } from '@/lib/time-slots';

const NAVY = '#253165';
const RED = '#E5191D';

export type CalendarReservation = {
    id: string;
    userId: string;
    roomId: string;
    date: string;
    startMinutes: number;
    endMinutes: number;
    startTime: string;
    endTime: string;
    numberOfPeople: number;
    purpose: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    user: { id: string; name: string; email: string };
    room: { id: string; name: string; capacity: number; color: string; equipment: string[] };
};

type Room = { id: string; name: string; capacity: number; color: string; equipment: string[] };

type CalendarPayload = { from: string; to: string; byDay: Record<string, CalendarReservation[]> };

function statusPill(status: CalendarReservation['status']) {
    if (status === 'CONFIRMED') return 'bg-emerald-100 text-emerald-900';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-900';
    return 'bg-red-100 text-red-900';
}

export default function CalendarScreen() {
    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;
    const [monthCursor, setMonthCursor] = useState(() => new Date());
    const [byDay, setByDay] = useState<Record<string, CalendarReservation[]>>({});
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<CalendarReservation | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [bookDate, setBookDate] = useState('');
    const [bookRoomId, setBookRoomId] = useState('');
    const [bookStart, setBookStart] = useState(startTimeOptions()[0]);
    const [bookEnd, setBookEnd] = useState(validEndsForStart(startTimeOptions()[0])[0] ?? endTimeOptions()[0]);
    const [bookPeople, setBookPeople] = useState(1);
    const [bookPurpose, setBookPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadRooms = useCallback(async () => {
        if (!accessToken) return;
        try {
            const list = await backendFetch<Room[]>(accessToken, '/rooms');
            setRooms(Array.isArray(list) ? list : []);
            const firstId = Array.isArray(list) && list[0]?.id ? list[0].id : '';
            setBookRoomId((prev) => prev || firstId);
        } catch {
            setRooms([]);
        }
    }, [accessToken]);

    const loadCalendar = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const y = monthCursor.getFullYear();
            const m = monthCursor.getMonth() + 1;
            const res = await backendFetch<CalendarPayload>(
                accessToken,
                `/reservations/calendar?year=${y}&month=${m}`,
            );
            setByDay(res?.byDay || {});
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Chargement impossible');
            setByDay({});
        } finally {
            setLoading(false);
        }
    }, [accessToken, monthCursor]);

    useEffect(() => {
        if (accessToken) void loadRooms();
    }, [accessToken, loadRooms]);

    useEffect(() => {
        if (accessToken) void loadCalendar();
    }, [accessToken, loadCalendar]);

    const selectedRoomCapacity = useMemo(() => rooms.find((r) => r.id === bookRoomId)?.capacity ?? 999, [
        rooms,
        bookRoomId,
    ]);

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

    const openBooking = (isoDate: string) => {
        setBookDate(isoDate);
        setBookStart(startTimeOptions()[0]);
        setBookPurpose('');
        const firstEnds = validEndsForStart(startTimeOptions()[0]);
        setBookEnd(firstEnds[0] ?? endTimeOptions()[0]);
        setBookPeople(1);
        setBookRoomId((prev) => prev || rooms[0]?.id || '');
        setShowForm(true);
    };

    const submitBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;
        setSubmitting(true);
        try {
            await backendFetch(accessToken, '/reservations', {
                method: 'POST',
                body: JSON.stringify({
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
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? (typeof err.body === 'object' && err.body !== null &&
                      'message' in err.body &&
                      Array.isArray((err.body as { message: unknown }).message)
                          ? ((err.body as { message: string[] }).message).join(', ')
                          : err.message)
                    : 'Échec de la réservation';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'loading' || status === 'unauthenticated') {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
                Connexion...
            </div>
        );
    }

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
        <div className="p-4 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight" style={{ color: NAVY }}>
                        Planning des salles d&apos;étude
                    </h1>
                    <p className="text-sm text-slate-600">Vue mensuelle — cliquez un créneau pour les détails</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        onClick={() => setMonthCursor((d) => addMonths(d, -1))}
                    >
                        ← Mois précédent
                    </button>
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        onClick={() => setMonthCursor((d) => addMonths(d, 1))}
                    >
                        Mois suivant →
                    </button>
                    <button
                        type="button"
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow"
                        style={{ backgroundColor: RED }}
                        onClick={() => openBooking(format(new Date(), 'yyyy-MM-dd'))}
                    >
                        Nouvelle réservation
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3 font-medium capitalize" style={{ color: NAVY }}>
                    {format(monthCursor, 'MMMM yyyy', { locale: fr })}
                </div>
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Chargement...</div>
                ) : (
                    <div className="grid grid-cols-7 gap-px bg-slate-200 p-px">
                        {weekDays.map((wd) => (
                            <div
                                key={wd}
                                className="bg-slate-50 px-1 py-2 text-center text-xs font-semibold text-slate-600"
                            >
                                {wd}
                            </div>
                        ))}
                        {gridDays.map((day) => {
                            const iso = format(day, 'yyyy-MM-dd');
                            const slots = byDay[iso] || [];
                            const inMonth = isSameMonth(day, monthCursor);
                            return (
                                <div
                                    key={iso}
                                    className={[
                                        'min-h-[112px] bg-white p-1.5 hover:bg-slate-50/80 md:min-h-[128px]',
                                        inMonth ? 'opacity-100' : 'opacity-35',
                                    ].join(' ')}
                                >
                                    <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-700">
                                        <span>{format(day, 'd')}</span>
                                        <button
                                            type="button"
                                            className="rounded px-1 text-[11px]"
                                            style={{ color: NAVY }}
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                openBooking(iso);
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="flex max-h-[88px] flex-col gap-0.5 overflow-y-auto">
                                        {slots.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setSelected(r)}
                                                title={r.purpose}
                                                className={[
                                                    'truncate rounded-full px-1.5 py-0.5 text-left text-[10px] font-medium shadow-sm md:text-[11px]',
                                                    r.status === 'CANCELLED' ? 'opacity-50 line-through' : '',
                                                ].join(' ')}
                                                style={{
                                                    backgroundColor:
                                                        r.room?.color ?
                                                            `${r.room.color}26`
                                                        : 'rgba(37,49,101,0.12)',
                                                    color: NAVY,
                                                    borderLeft: `3px solid ${r.room?.color ?? NAVY}`,
                                                }}
                                            >
                                                {r.room.name} · {r.startTime}-{r.endTime}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selected ? (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold" style={{ color: NAVY }}>
                        Détail réservation
                    </h2>
                    <dl className="grid gap-2 text-sm md:grid-cols-2">
                        <dt className="text-slate-500">Professeur</dt>
                        <dd className="font-medium">{selected.user.name}</dd>
                        <dt className="text-slate-500">Salle</dt>
                        <dd>{selected.room.name}</dd>
                        <dt className="text-slate-500">Horaire</dt>
                        <dd>
                            {format(new Date(selected.date), 'dd/MM/yyyy')} · {selected.startTime} –{' '}
                            {selected.endTime}
                        </dd>
                        <dt className="text-slate-500">Participants</dt>
                        <dd>{selected.numberOfPeople}</dd>
                        <dt className="text-slate-500">Motif</dt>
                        <dd className="md:col-span-1">{selected.purpose}</dd>
                        <dt className="text-slate-500">Statut</dt>
                        <dd>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusPill(selected.status)}`}>
                                {selected.status}
                            </span>
                        </dd>
                    </dl>
                    <button
                        type="button"
                        className="mt-4 text-sm underline"
                        onClick={() => setSelected(null)}
                    >
                        Fermer le panneau
                    </button>
                </div>
            ) : null}

            {showForm ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold" style={{ color: NAVY }}>
                            Nouvelle réservation
                        </h3>
                        <form className="flex flex-col gap-3 text-sm" onSubmit={submitBooking}>
                            <label className="flex flex-col gap-1">
                                <span>Nom affiché</span>
                                <input
                                    className="rounded border border-slate-200 px-3 py-2 text-slate-400"
                                    readOnly
                                    value={session?.user?.name || ''}
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span>Date</span>
                                <input
                                    type="date"
                                    required
                                    className="rounded border border-slate-200 px-3 py-2"
                                    value={bookDate}
                                    onChange={(e) => setBookDate(e.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span>Salle</span>
                                <select
                                    className="rounded border border-slate-200 px-3 py-2"
                                    value={bookRoomId}
                                    onChange={(e) => setBookRoomId(e.target.value)}
                                    required
                                >
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} ({r.capacity} pers.)
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="flex gap-3">
                                <label className="flex flex-1 flex-col gap-1">
                                    <span>Début</span>
                                    <select
                                        className="rounded border border-slate-200 px-3 py-2"
                                        value={bookStart}
                                        onChange={(e) => setBookStart(e.target.value)}
                                    >
                                        {startTimeOptions().map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-1 flex-col gap-1">
                                    <span>Fin</span>
                                    <select
                                        className="rounded border border-slate-200 px-3 py-2"
                                        value={bookEnd}
                                        onChange={(e) => setBookEnd(e.target.value)}
                                    >
                                        {(bookStart ? validEndsForStart(bookStart) : endTimeOptions()).map(
                                            (t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>
                            </div>
                            <label className="flex flex-col gap-1">
                                <span>Nombre de personnes</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={selectedRoomCapacity}
                                    value={bookPeople}
                                    required
                                    onChange={(e) => setBookPeople(Number(e.target.value))}
                                    className="rounded border border-slate-200 px-3 py-2"
                                />
                                <span className="text-xs text-slate-500">Max {selectedRoomCapacity} pour cette salle</span>
                            </label>
                            <label className="flex flex-col gap-1">
                                <span>Objet / description</span>
                                <input
                                    required
                                    className="rounded border border-slate-200 px-3 py-2"
                                    value={bookPurpose}
                                    maxLength={500}
                                    onChange={(e) => setBookPurpose(e.target.value)}
                                />
                            </label>
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    className="flex-1 rounded-lg border border-slate-200 py-2"
                                    onClick={() => setShowForm(false)}
                                    disabled={submitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !bookRoomId}
                                    className="flex-1 rounded-lg py-2 font-semibold text-white"
                                    style={{ backgroundColor: NAVY }}
                                >
                                    {submitting ? 'Envoi…' : 'Réserver'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
