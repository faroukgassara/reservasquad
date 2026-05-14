'use client';

import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import type { CalendarReservation } from '../calendar/CalendarScreen';
import { ApiError, backendFetch } from '@/lib/reservasquad-api';

const NAVY = '#253165';

function pill(status: CalendarReservation['status']) {
    if (status === 'CONFIRMED') return 'bg-emerald-100 text-emerald-900';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-900';
    return 'bg-red-100 text-red-900';
}

export default function MyReservationsPage() {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const [rows, setRows] = useState<CalendarReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setErr(null);
        try {
            const list = await backendFetch<CalendarReservation[]>(token, '/reservations?mine=true');
            setRows(Array.isArray(list) ? list : []);
        } catch (e) {
            setErr(e instanceof ApiError ? e.message : 'Erreur');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        void load();
    }, [load]);

    const cancel = async (id: string) => {
        if (!token || !confirm('Annuler cette réservation ?')) return;
        try {
            await backendFetch(token, `/reservations/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'CANCELLED' }),
            });
            await load();
        } catch (e) {
            alert(e instanceof ApiError ? e.message : 'Impossible d’annuler');
        }
    };

    if (status === 'loading' || status === 'unauthenticated') {
        return <div className="p-8 text-slate-600">…</div>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming: CalendarReservation[] = [];
    const past: CalendarReservation[] = [];
    for (const r of rows) {
        const d =
            typeof r.date === 'string' ? parseISO(r.date.slice(0, 10)) : new Date(String(r.date));
        d.setHours(0, 0, 0, 0);
        if (d.getTime() >= today.getTime()) upcoming.push(r);
        else past.push(r);
    }

    const row = (r: CalendarReservation) => {
        const d =
            typeof r.date === 'string' ? parseISO(r.date.slice(0, 10)) : new Date(String(r.date));
        d.setHours(0, 0, 0, 0);
        const isFuture = d.getTime() >= today.getTime();
        const canCancel =
            isFuture && (r.status === 'PENDING' || r.status === 'CONFIRMED');
        return (
        <tr key={r.id} className="border-b border-slate-100 text-sm">
            <td className="py-3 pr-2 font-medium" style={{ color: NAVY }}>
                {r.room.name}
            </td>
            <td className="py-3 pr-2">{format(parseISO(String(r.date).slice(0, 10)), 'dd/MM/yyyy')}</td>
            <td className="py-3 pr-2">
                {r.startTime} – {r.endTime}
            </td>
            <td className="py-3 pr-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${pill(r.status)}`}>{r.status}</span>
            </td>
            <td className="py-3 pr-2">
                {canCancel ? (
                    <button
                        type="button"
                        className="text-xs font-medium underline"
                        style={{ color: '#E5191D' }}
                        onClick={() => void cancel(r.id)}
                    >
                        Annuler
                    </button>
                ) : null}
            </td>
        </tr>
        );
    };

    return (
        <div className="p-4 lg:p-8">
            <h1 className="mb-2 text-2xl font-semibold" style={{ color: NAVY }}>
                Mes réservations
            </h1>
            {err && <p className="mb-4 text-sm text-red-600">{err}</p>}
            {loading ? (
                <p className="text-slate-500">Chargement…</p>
            ) : (
                <div className="space-y-8">
                    <section>
                        <h2 className="mb-3 text-lg font-medium text-slate-800">À venir</h2>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="min-w-full">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2">Salle</th>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Créneau</th>
                                        <th className="px-4 py-2">Statut</th>
                                        <th className="px-4 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="px-4">
                                    {upcoming.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-slate-500">
                                                Aucune réservation à venir.
                                            </td>
                                        </tr>
                                    ) : (
                                        upcoming.map((r) => row(r))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <section>
                        <h2 className="mb-3 text-lg font-medium text-slate-800">Historique</h2>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="min-w-full">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2">Salle</th>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Créneau</th>
                                        <th className="px-4 py-2">Statut</th>
                                        <th className="px-4 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {past.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-slate-500">
                                                Aucun historique.
                                            </td>
                                        </tr>
                                    ) : (
                                        past.map((r) => row(r))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
