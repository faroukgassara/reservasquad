'use client';

import { useToast } from '@/contexts/ToastContext';
import { EToastType } from '@/Enum/Enum';
import { ApiError, backendFetch } from '@/lib/reservasquad-api';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import { useTranslations } from 'next-intl';

type Room = {
    id: string;
    name: string;
    capacity: number;
    color: string;
    description: string | null;
    equipment: string[];
    pricePerHour: number;
};

export default function AdminRoomsPage() {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const role = session?.user?.role;
    const { openToast } = useToast();
    const t = useTranslations();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState(8);
    const [color, setColor] = useState('#22c55e');
    const [description, setDescription] = useState('');
    const [equipment, setEquipment] = useState('projector, whiteboard');
    const [pricePerHour, setPricePerHour] = useState(0);
    const [editing, setEditing] = useState<Room | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        try {
            const list = await backendFetch<Room[]>(token, '/rooms');
            const normalized =
                Array.isArray(list) ?
                    list.map((room) => ({
                        ...room,
                        pricePerHour: Number(room.pricePerHour ?? 0),
                    }))
                    : [];
            setRooms(normalized);
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
            pricePerHour,
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
            setPricePerHour(0);
            setEditing(null);
            await load();
            openToast(
                t('common.success'),
                editing ? t('admin.rooms.updated') : t('admin.rooms.created'),
                { type: EToastType.SUCCESS },
            );
        } catch (err) {
            openToast(t('common.error'), err instanceof ApiError ? err.message : t('errors.generic'), {
                type: EToastType.ERROR,
            });
        }
    };

    const startEdit = (r: Room) => {
        setEditing(r);
        setName(r.name);
        setCapacity(r.capacity);
        setColor(r.color);
        setDescription(r.description || '');
        setEquipment(r.equipment.join(', '));
        setPricePerHour(Number(r.pricePerHour ?? 0));
    };

    const remove = async (id: string) => {
        if (!token || !confirm(t('admin.rooms.deleteConfirm'))) return;
        try {
            await backendFetch(token, `/rooms/${id}`, { method: 'DELETE' });
            await load();
            openToast(t('common.success'), t('admin.rooms.deleted'), {
                type: EToastType.SUCCESS,
            });
        } catch (e) {
            openToast(
                t('common.error'),
                e instanceof ApiError ? e.message : t('admin.rooms.deleteFailed'),
                { type: EToastType.ERROR },
            );
        }
    };

    if (role !== 'ADMIN') {
        return <div className="p-8 text-slate-600">{t('admin.accessDenied')}</div>;
    }

    if (status === 'loading') return null;

    return (
        <LayoutWrapper
            title={t('admin.rooms.title')}
            subTitle={t('admin.rooms.subtitle')}
            mainSection={
                <>
            <form
                onSubmit={submit}
                className="mb-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
            >
                <div className="md:col-span-2 font-medium text-slate-800">
                    {editing ? t('admin.rooms.editRoom', { name: editing.name }) : t('admin.rooms.newRoom')}
                </div>
                <label className="flex flex-col gap-1 text-sm">
                    {t('admin.rooms.name')}
                    <input
                        required
                        className="rounded border px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    {t('admin.rooms.capacity')}
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
                    {t('admin.rooms.color')}
                    <input
                        type="text"
                        pattern="^#([0-9A-Fa-f]{6})$"
                        title="#RRGGBB"
                        className="rounded border px-3 py-2 font-mono"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    {t('admin.rooms.pricePerHour')}
                    <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="rounded border px-3 py-2"
                        value={pricePerHour}
                        onChange={(e) => setPricePerHour(Number(e.target.value))}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    {t('admin.rooms.description')}
                    <input
                        className="rounded border px-3 py-2"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    {t('admin.rooms.equipment')}
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
                                setPricePerHour(0);
                            }}
                        >
                            {t('common.cancelEdit')}
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: 'bg-primary-900' }}
                    >
                        {editing ? t('common.update') : t('common.create')}
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-600">
                        <tr>
                            <th className="px-4 py-3">{t('admin.rooms.name')}</th>
                            <th className="px-4 py-3">{t('admin.rooms.capacityShort')}</th>
                            <th className="px-4 py-3 text-right">{t('admin.rooms.tndPerHour')}</th>
                            <th className="px-4 py-3">{t('admin.rooms.color')}</th>
                            <th className="px-4 py-3">{t('admin.rooms.equipmentCol')}</th>
                            <th className="px-4 py-3">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((r) => (
                            <tr key={r.id} className="border-b border-slate-100">
                                <td className="px-4 py-2">{r.name}</td>
                                <td className="px-4 py-2">{r.capacity}</td>
                                <td className="px-4 py-2 text-right tabular-nums">
                                    {(r.pricePerHour ?? 0).toLocaleString('fr-TN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
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
                                        {t('common.edit')}
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-red-700 underline"
                                        onClick={() => void remove(r.id)}
                                    >
                                        {t('common.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
                </>
            }
        />
    );
}
