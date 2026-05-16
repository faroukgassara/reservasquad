'use client';

import { ApiError, backendFetch } from '@/lib/reservasquad-api';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

type Room = {
    id: string;
    name: string;
    capacity: number;
    color: string;
    description: string | null;
    equipment: string[];
};

export default function AdminRoomsPage() {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const role = session?.user?.role;

    const [rooms, setRooms] = useState<Room[]>([]);
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState(8);
    const [color, setColor] = useState('#22c55e');
    const [description, setDescription] = useState('');
    const [equipment, setEquipment] = useState('projector, whiteboard');
    const [editing, setEditing] = useState<Room | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        try {
            const list = await backendFetch<Room[]>(token, '/rooms');
            setRooms(Array.isArray(list) ? list : []);
        } catch {
            setRooms([]);
        }
    }, [token]);

    useEffect(() => {
        void load();
    }, [load]);

    const equipArray = (): string[] =>
        equipment
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        const body = {
            name: name.trim(),
            capacity,
            color,
            description: description.trim() || undefined,
            equipment: equipArray(),
        };
        try {
            if (editing) {
                await backendFetch(token, `/rooms/${editing.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(body),
                });
            } else {
                await backendFetch(token, '/rooms', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
            }
            setName('');
            setDescription('');
            setEditing(null);
            await load();
        } catch (err) {
            alert(err instanceof ApiError ? err.message : 'Erreur');
        }
    };

    const startEdit = (r: Room) => {
        setEditing(r);
        setName(r.name);
        setCapacity(r.capacity);
        setColor(r.color);
        setDescription(r.description || '');
        setEquipment(r.equipment.join(', '));
    };

    const remove = async (id: string) => {
        if (!token || !confirm('Supprimer cette salle ?')) return;
        try {
            await backendFetch(token, `/rooms/${id}`, { method: 'DELETE' });
            await load();
        } catch (e) {
            alert(e instanceof ApiError ? e.message : 'Suppression impossible (réservations liées)');
        }
    };

    if (role !== 'ADMIN') {
        return <div className="p-8 text-slate-600">Administrateurs uniquement.</div>;
    }

    if (status === 'loading') return null;

    return (
        <div className="p-4 lg:p-8">
            <h1 className="mb-6 text-2xl font-semibold text-primary-900">
                Gestion des salles
            </h1>

            <form
                onSubmit={submit}
                className="mb-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
            >
                <div className="md:col-span-2 font-medium text-slate-800">
                    {editing ? `Modifier : ${editing.name}` : 'Nouvelle salle'}
                </div>
                <label className="flex flex-col gap-1 text-sm">
                    Nom
                    <input
                        required
                        className="rounded border px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Capacité
                    <input
                        type="number"
                        min={1}
                        max={200}
                        className="rounded border px-3 py-2"
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Couleur (hex badge)
                    <input
                        type="text"
                        pattern="^#([0-9A-Fa-f]{6})$"
                        title="#RRGGBB"
                        className="rounded border px-3 py-2 font-mono"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    Description
                    <input
                        className="rounded border px-3 py-2"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    Équipement (virgules)
                    <input
                        className="rounded border px-3 py-2"
                        value={equipment}
                        onChange={(e) => setEquipment(e.target.value)}
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
                                setDescription('');
                                setEquipment('projector, whiteboard');
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
                            <th className="px-4 py-3">Cap.</th>
                            <th className="px-4 py-3">Couleur</th>
                            <th className="px-4 py-3">Équipements</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((r) => (
                            <tr key={r.id} className="border-b border-slate-100">
                                <td className="px-4 py-2">{r.name}</td>
                                <td className="px-4 py-2">{r.capacity}</td>
                                <td className="px-4 py-2">
                                    <span
                                        className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                                        style={{
                                            borderLeft: `4px solid ${r.color}`,
                                            backgroundColor: `${r.color}20`,
                                        }}
                                    >
                                        {r.color}
                                    </span>
                                </td>
                                <td className="max-w-xs truncate px-4 py-2">{r.equipment.join(', ')}</td>
                                <td className="flex gap-2 px-4 py-2">
                                    <button
                                        type="button"
                                        className="text-xs underline"
                                        onClick={() => startEdit(r)}
                                    >
                                        Éditer
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-red-700 underline"
                                        onClick={() => void remove(r.id)}
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
