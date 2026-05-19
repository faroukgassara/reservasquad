'use client';

import { useToast } from '@/contexts/ToastContext';
import { EToastType } from '@/Enum/Enum';
import { ApiError, backendFetch } from '@/lib/reservasquad-api';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import { useTranslations } from 'next-intl';

type TeacherRow = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { reservations: number };
};

export default function AdminTeachersPage() {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const role = session?.user?.role;
    const { openToast } = useToast();
    const t = useTranslations();
    const [rows, setRows] = useState<TeacherRow[]>([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
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
                        phone: phone.trim(),
                    }),
                });
            } else {
                await backendFetch(token, '/directory/teachers', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim(),
                        ...(phone.trim() ? { phone: phone.trim() } : {}),
                    }),
                });
            }
            setName('');
            setEmail('');
            setPhone('');
            setEditing(null);
            await load();
            openToast(
                t('common.success'),
                editing ? t('admin.teachers.updated') : t('admin.teachers.created'),
                { type: EToastType.SUCCESS },
            );
        } catch (err) {
            openToast(t('common.error'), err instanceof ApiError ? err.message : t('errors.generic'), {
                type: EToastType.ERROR,
            });
        }
    };

    const startEdit = (teacher: TeacherRow) => {
        setEditing(teacher);
        setName(teacher.name);
        setEmail(teacher.email);
        setPhone(teacher.phone ?? '');
    };

    const remove = async (id: string) => {
        if (!token || !confirm(t('admin.teachers.deleteConfirm'))) return;
        try {
            await backendFetch(token, `/directory/teachers/${id}`, { method: 'DELETE' });
            await load();
        } catch (e) {
            openToast(
                t('common.error'),
                e instanceof ApiError ? e.message : t('admin.teachers.deleteFailed'),
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
            title={t('admin.teachers.title')}
            subTitle={t('admin.teachers.subtitle')}
            mainSection={
                <>
            <p className="mb-6 max-w-2xl text-sm text-slate-600">
                {t('admin.teachers.description')}
            </p>

            <form
                onSubmit={submit}
                className="mb-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
            >
                <div className="md:col-span-2 font-medium text-slate-800">
                    {editing ? t('admin.teachers.editTeacher', { name: editing.name }) : t('admin.teachers.newTeacher')}
                </div>
                <label className="flex flex-col gap-1 text-sm">
                    {t('admin.teachers.displayName')}
                    <input
                        required
                        className="rounded border px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    {t('admin.teachers.emailUnique')}
                    <input
                        type="email"
                        required
                        className="rounded border px-3 py-2"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    {t('admin.teachers.phone')}
                    <input
                        type="tel"
                        className="rounded border px-3 py-2"
                        placeholder={t('admin.teachers.phonePlaceholder')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
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
                                setPhone('');
                            }}
                        >
                            {t('common.cancelEdit')}
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        className="rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
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
                            <th className="px-4 py-3">{t('auth.email')}</th>
                            <th className="px-4 py-3">{t('admin.teachers.phone')}</th>
                            <th className="px-4 py-3">{t('admin.teachers.reservations')}</th>
                            <th className="px-4 py-3">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((teacher) => (
                            <tr key={teacher.id} className="border-b border-slate-100">
                                <td className="px-4 py-2">{teacher.name}</td>
                                <td className="px-4 py-2">{teacher.email}</td>
                                <td className="px-4 py-2 text-slate-600">{teacher.phone ?? t('common.dash')}</td>
                                <td className="px-4 py-2">{teacher._count.reservations}</td>
                                <td className="flex gap-2 px-4 py-2">
                                    <button
                                        type="button"
                                        className="text-xs underline"
                                        onClick={() => startEdit(teacher)}
                                    >
                                        {t('common.edit')}
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-red-700 underline"
                                        onClick={() => void remove(teacher.id)}
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
