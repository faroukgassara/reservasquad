'use client';

import { ApiError, backendFetch } from '@/lib/reservasquad-api';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

type TeacherRow = {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    _count: { reservations: number };
};

export default function AdminTeachersPage() {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const role = session?.user?.role;

    const [rows, setRows] = useState<TeacherRow[]>([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [editing, setEditing] = useState<TeacherRow | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        try {
            const list = await backendFetch<TeacherRow[]>(token, '/directory/teachers');
            setRows(Array.isArray(list) ? list : []);
        } catch {
            setRows([]);
        }
    }, [token]);

    useEffect(() => {
        void load();
    }, [load]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            if (editing) {
                await backendFetch(token, `/directory/teachers/${editing.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim(),
                    }),
                });
            } else {
                await backendFetch(token, '/directory/teachers', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim(),
                    }),
                });
            }
            setName('');
            setEmail('');
            setEditing(null);
            await load();
        } catch (err) {
            alert(err instanceof ApiError ? err.message : 'Erreur');
        }
    };

    const startEdit = (t: TeacherRow) => {
        setEditing(t);
        setName(t.name);
        setEmail(t.email);
    };

    const remove = async (id: string) => {
        if (!token || !confirm('Supprimer ce professeur ?')) return;
        try {
            await backendFetch(token, `/directory/teachers/${id}`, { method: 'DELETE' });
            await load();
        } catch (e) {
            alert(
                e instanceof ApiError
                    ? e.message
                    : 'Suppression impossible : des réservations sont liées à ce profil.',
            );
        }
    };

    if (role !== 'ADMIN') {
        return <div className="p-8 text-slate-600">Administrateurs uniquement.</div>;
    }

    if (status === 'loading') return null;

    return (
        <div className="p-4 lg:p-8">
            <h1 className="mb-2 text-2xl font-semibold text-primary-900">
                Professeurs (liste de réservation)
            </h1>
            <p className="mb-6 max-w-2xl text-sm text-slate-600">
                Les professeurs n&apos;ont pas de mot de passe par défaut : ils sont choisis sur le
                calendrier public. Chaque réservation est liée au profil sélectionné.
            </p>

            <form
                onSubmit={submit}
                className="mb-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
            >
                <div className="md:col-span-2 font-medium text-slate-800">
                    {editing ? `Modifier : ${editing.name}` : 'Nouveau professeur'}
                </div>
                <label className="flex flex-col gap-1 text-sm">
                    Nom affiché
                    <input
                        required
                        className="rounded border px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Email (unique)
                    <input
                        type="email"
                        required
                        className="rounded border px-3 py-2"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>
                <div className="flex gap-2 md:col-span-2">
                    {editing ? (
                        <button
                            type="button"
                            className="rounded border px-4 py-2 text-sm"
                            onClick={() => {
                                setEditing(null);
                                setName('');
                                setEmail('');
                            }}
                        >
                            Annuler édition
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: 'bg-primary-900' }}
                    >
                        {editing ? 'Mettre à jour' : 'Créer'}
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-600">
                        <tr>
                            <th className="px-4 py-3">Nom</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Réservations</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((t) => (
                            <tr key={t.id} className="border-b border-slate-100">
                                <td className="px-4 py-2">{t.name}</td>
                                <td className="px-4 py-2">{t.email}</td>
                                <td className="px-4 py-2">{t._count.reservations}</td>
                                <td className="flex gap-2 px-4 py-2">
                                    <button
                                        type="button"
                                        className="text-xs underline"
                                        onClick={() => startEdit(t)}
                                    >
                                        Éditer
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-red-700 underline"
                                        onClick={() => void remove(t.id)}
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
