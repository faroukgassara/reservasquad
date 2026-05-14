'use client';

import type { CalendarReservation } from '@/features/calendar/CalendarScreen';
import { ApiError, backendFetch } from '@/lib/reservasquad-api';
import { startTimeOptions, validEndsForStart } from '@/lib/time-slots';
import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

type Room = { id: string; name: string; capacity: number; color: string; equipment: string[] };
type Teacher = { id: string; name: string; email: string };

const NAVY = '#253165';

export default function AdminReservationsPage() {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const role = session?.user?.role;
    const [rows, setRows] = useState<CalendarReservation[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [roomId, setRoomId] = useState('');
    const [stat, setStat] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [bookTeacherId, setBookTeacherId] = useState('');
    const [bookDate, setBookDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [bookRoomId, setBookRoomId] = useState('');
    const [bookStart, setBookStart] = useState(startTimeOptions()[0]);
    const [bookEnd, setBookEnd] = useState(validEndsForStart(startTimeOptions()[0])[0] ?? '00:00');
    const [bookPeople, setBookPeople] = useState(1);
    const [bookPurpose, setBookPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const parts: string[] = [];
            if (roomId) parts.push(`roomId=${encodeURIComponent(roomId)}`);
            if (stat !== 'ALL') parts.push(`status=${encodeURIComponent(stat)}`);
            const suffix = parts.length ? `?${parts.join('&')}` : '';
            const list = await backendFetch<CalendarReservation[]>(token, `/reservations${suffix}`);
            setRows(Array.isArray(list) ? list : []);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [token, roomId, stat]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!token || role !== 'ADMIN') return;
        void backendFetch<Room[]>(token, '/rooms')
            .then((r) => {
                const list = Array.isArray(r) ? r : [];
                setRooms(list);
                setBookRoomId((prev) => prev || list[0]?.id || '');
            })
            .catch(() => []);
        void backendFetch<Teacher[]>(token, '/directory/teachers')
            .then((t) => {
                const list = Array.isArray(t) ? t : [];
                setTeachers(list);
                setBookTeacherId((prev) => prev || list[0]?.id || '');
            })
            .catch(() => []);
    }, [token, role]);

    useEffect(() => {
        const allowed = validEndsForStart(bookStart);
        setBookEnd((prev) => (allowed.includes(prev) ? prev : allowed[allowed.length - 1] ?? '00:00'));
    }, [bookStart]);

    const patch = async (id: string, next: 'CONFIRMED' | 'CANCELLED') => {
        if (!token) return;
        try {
            await backendFetch(token, `/reservations/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: next }),
            });
            await load();
        } catch (e) {
            alert(e instanceof ApiError ? e.message : 'Erreur');
        }
    };

    const adminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setSubmitting(true);
        try {
            await backendFetch(token, '/reservations/admin', {
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
            setShowModal(false);
            setBookPurpose('');
            await load();
        } catch (err) {
            alert(err instanceof ApiError ? err.message : 'Erreur');
        } finally {
            setSubmitting(false);
        }
    };

    if (role !== 'ADMIN') {
        return (
            <div className="p-8 text-slate-600">Accès réservé aux administrateurs.</div>
        );
    }

    if (status === 'loading' || status === 'unauthenticated') {
        return null;
    }

    const capacity = rooms.find((r) => r.id === bookRoomId)?.capacity ?? 99;

    return (
        <div className="p-4 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold" style={{ color: NAVY }}>
                    Réservations (admin)
                </h1>
                <button
                    type="button"
                    className="rounded-lg px-4 py-2 font-semibold text-white"
                    style={{ backgroundColor: '#E5191D' }}
                    onClick={() => setShowModal(true)}
                >
                    Créer pour un professeur
                </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-3">
                <select
                    className="rounded border border-slate-200 px-3 py-2 text-sm"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                >
                    <option value="">Toutes les salles</option>
                    {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.name}
                        </option>
                    ))}
                </select>
                <select
                    className="rounded border border-slate-200 px-3 py-2 text-sm"
                    value={stat}
                    onChange={(e) => setStat(e.target.value as typeof stat)}
                >
                    <option value="ALL">Tous statuts</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmées</option>
                    <option value="CANCELLED">Annulées</option>
                </select>
                <button
                    type="button"
                    className="rounded border border-slate-200 px-3 py-2 text-sm"
                    onClick={() => void load()}
                >
                    Actualiser
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <p className="p-6 text-slate-500">Chargement…</p>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Créneau</th>
                                <th className="px-4 py-3">Salle</th>
                                <th className="px-4 py-3">Demandeur</th>
                                <th className="px-4 py-3">Places</th>
                                <th className="px-4 py-3">Motif</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-b border-slate-100">
                                    <td className="px-4 py-2">
                                        {format(parseISO(String(r.date).slice(0, 10)), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-4 py-2">
                                        {r.startTime} – {r.endTime}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span
                                            className="inline-flex rounded px-2 py-0.5"
                                            style={{ borderLeft: `3px solid ${r.room.color}` }}
                                        >
                                            {r.room.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">{r.user.name}</td>
                                    <td className="px-4 py-2">{r.numberOfPeople}</td>
                                    <td className="max-w-[180px] truncate px-4 py-2">{r.purpose}</td>
                                    <td className="px-4 py-2 text-xs">{r.status}</td>
                                    <td className="flex flex-wrap gap-1 px-4 py-2">
                                        {r.status === 'PENDING' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="rounded bg-emerald-600 px-2 py-1 text-[11px] text-white"
                                                    onClick={() => void patch(r.id, 'CONFIRMED')}
                                                >
                                                    Confirmer
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded bg-red-600 px-2 py-1 text-[11px] text-white"
                                                    onClick={() => void patch(r.id, 'CANCELLED')}
                                                >
                                                    Refuser
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold">Réservation confirmée (professeur)</h3>
                        <form className="flex flex-col gap-3 text-sm" onSubmit={adminSubmit}>
                            <label className="flex flex-col gap-1">
                                Professeur
                                <select
                                    required
                                    className="rounded border px-3 py-2"
                                    value={bookTeacherId}
                                    onChange={(e) => setBookTeacherId(e.target.value)}
                                >
                                    {teachers.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.email})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1">
                                Date
                                <input
                                    type="date"
                                    required
                                    className="rounded border px-3 py-2"
                                    value={bookDate}
                                    onChange={(e) => setBookDate(e.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                Salle
                                <select
                                    required
                                    className="rounded border px-3 py-2"
                                    value={bookRoomId}
                                    onChange={(e) => setBookRoomId(e.target.value)}
                                >
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="flex gap-2">
                                <label className="flex flex-1 flex-col gap-1">
                                    Début
                                    <select
                                        className="rounded border px-3 py-2"
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
                                    Fin
                                    <select
                                        className="rounded border px-3 py-2"
                                        value={bookEnd}
                                        onChange={(e) => setBookEnd(e.target.value)}
                                    >
                                        {validEndsForStart(bookStart).map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label className="flex flex-col gap-1">
                                Participants
                                <input
                                    type="number"
                                    min={1}
                                    max={capacity}
                                    required
                                    className="rounded border px-3 py-2"
                                    value={bookPeople}
                                    onChange={(e) => setBookPeople(Number(e.target.value))}
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                Motif
                                <input
                                    required
                                    className="rounded border px-3 py-2"
                                    value={bookPurpose}
                                    onChange={(e) => setBookPurpose(e.target.value)}
                                />
                            </label>
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    className="flex-1 rounded border py-2"
                                    onClick={() => setShowModal(false)}
                                    disabled={submitting}
                                >
                                    Fermer
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !bookTeacherId}
                                    className="flex-1 rounded py-2 text-white"
                                    style={{ backgroundColor: NAVY }}
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
