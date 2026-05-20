'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import AdminTeacherModal from '@/components/Modals/AdminTeacherModal/AdminTeacherModal';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { EButtonType, EToastType, EVariantLabel } from '@/Enum/Enum';
import type { IMoleculeTableColumn } from '@/interfaces/Molecules/IMoleculeTableColumn/IMoleculeTableColumn';
import { ApiError, backendFetch } from '@/lib/reservasquad-api';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

type AdminTeacherTableRow = {
    teacher: TeacherRow;
    name: string;
    email: string;
    phoneDisplay: string;
    reservationsCount: number;
};

export default function AdminTeachersPage() {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const role = session?.user?.role;
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal();
    const {
        openModal: openConfirmModal,
        closeModal: closeConfirmModal,
        modalPortal: confirmModalPortal,
    } = useModal({ closeCallBack: () => setPendingDeleteId(null) });
    const t = useTranslations();
    const [rows, setRows] = useState<TeacherRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<TeacherRow | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const list = await backendFetch<TeacherRow[]>(token, '/directory/teachers');
            setRows(Array.isArray(list) ? list : []);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        void load();
    }, [load]);

    const resetForm = useCallback(() => {
        setEditing(null);
        setName('');
        setEmail('');
        setPhone('');
    }, []);

    const openCreateModal = useCallback(() => {
        resetForm();
        openModal();
    }, [openModal, resetForm]);

    const openEditModal = useCallback(
        (teacher: TeacherRow) => {
            setEditing(teacher);
            setName(teacher.name);
            setEmail(teacher.email);
            setPhone(teacher.phone ?? '');
            openModal();
        },
        [openModal],
    );

    const submit = async () => {
        if (!token) return;
        setSubmitting(true);
        const wasEditing = Boolean(editing);
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
            closeModal();
            resetForm();
            await load();
            openToast(
                t('common.success'),
                wasEditing ? t('admin.teachers.updated') : t('admin.teachers.created'),
                { type: EToastType.SUCCESS },
            );
        } catch (err) {
            openToast(t('common.error'), err instanceof ApiError ? err.message : t('errors.generic'), {
                type: EToastType.ERROR,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openDeleteConfirm = useCallback(
        (id: string) => {
            setPendingDeleteId(id);
            openConfirmModal();
        },
        [openConfirmModal],
    );

    const confirmDelete = useCallback(async () => {
        if (!token || !pendingDeleteId) return;
        setDeleting(true);
        try {
            await backendFetch(token, `/directory/teachers/${pendingDeleteId}`, { method: 'DELETE' });
            closeConfirmModal();
            setPendingDeleteId(null);
            await load();
            openToast(t('common.success'), t('admin.teachers.deleted'), { type: EToastType.SUCCESS });
        } catch (e) {
            openToast(
                t('common.error'),
                e instanceof ApiError ? e.message : t('admin.teachers.deleteFailed'),
                { type: EToastType.ERROR },
            );
        } finally {
            setDeleting(false);
        }
    }, [token, pendingDeleteId, closeConfirmModal, load, openToast, t]);

    const tableRows: AdminTeacherTableRow[] = useMemo(
        () =>
            rows.map((teacher) => ({
                teacher,
                name: teacher.name,
                email: teacher.email,
                phoneDisplay: teacher.phone ?? t('common.dash'),
                reservationsCount: teacher._count.reservations,
            })),
        [rows, t],
    );

    const teacherColumns = useMemo<IMoleculeTableColumn<AdminTeacherTableRow>[]>(
        () => [
            {
                headerElement: {
                    value: 'name',
                    label: t('admin.rooms.name'),
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                            {row.name}
                        </AtomLabel>
                    ),
                },
            },
            {
                headerElement: {
                    value: 'email',
                    label: t('auth.email'),
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600">
                            {row.email}
                        </AtomLabel>
                    ),
                },
            },
            {
                headerElement: {
                    value: 'phoneDisplay',
                    label: t('admin.teachers.phone'),
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                },
            },
            {
                headerElement: {
                    value: 'reservationsCount',
                    label: t('admin.teachers.reservations'),
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                },
            },
            {
                headerElement: {
                    value: '_actionsPlaceholder',
                    label: t('common.actions'),
                    sortable: false,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomDiv className="flex flex-wrap gap-1 py-2">
                            <AtomButton
                                id={`admin-teacher-edit-${row.teacher.id}`}
                                type={EButtonType.secondary}
                                className="rounded! px-2! py-1! text-[11px]!"
                                onClick={() => openEditModal(row.teacher)}
                                text={t('common.edit')}
                            />
                            <AtomButton
                                id={`admin-teacher-delete-${row.teacher.id}`}
                                type={EButtonType.primary}
                                className="rounded! px-2! py-1! text-[11px]! text-white!"
                                style={{ backgroundColor: '#dc2626' }}
                                onClick={() => openDeleteConfirm(row.teacher.id)}
                                text={t('common.delete')}
                            />
                        </AtomDiv>
                    ),
                },
            },
        ],
        [openDeleteConfirm, openEditModal, t],
    );

    if (role !== 'ADMIN') {
        return (
            <AtomDiv className="p-8">
                <AtomLabel variant={EVariantLabel.body} color="text-gray-600">
                    {t('admin.accessDenied')}
                </AtomLabel>
            </AtomDiv>
        );
    }

    if (status === 'loading' || status === 'unauthenticated') {
        return null;
    }

    const createButton = (
        <AtomButton
            id="admin-teachers-create"
            type={EButtonType.primary}
            className="shrink-0 rounded-lg px-4! py-2.5! text-sm font-semibold text-white shadow-sm bg-primary-600 hover:bg-primary-700"
            onClick={openCreateModal}
            text={`+ ${t('admin.teachers.add')}`}
        />
    );

    return (
        <>
            <LayoutWrapper
                title={t('admin.teachers.title')}
                subTitle={t('admin.teachers.subtitle')}
                mainSection={
                    <AtomDiv className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <AtomDiv className="flex flex-col gap-4 px-6 py-6">
                            <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600" className="max-w-2xl">
                                {t('admin.teachers.description')}
                            </AtomLabel>

                            <OrganismTable<AdminTeacherTableRow>
                                columns={teacherColumns}
                                emptyMessage={t('admin.teachers.empty')}
                                isLoading={loading}
                                pageSize={10}
                                rows={tableRows}
                                searchable
                                primaryAction={createButton}
                                placeholder={t('table.search')}
                                className="border-0 shadow-none"
                                tableClassName="text-sm"
                                badge={null}
                            />
                        </AtomDiv>
                    </AtomDiv>
                }
            />

            {modalPortal(
                <AdminTeacherModal
                    isEditing={Boolean(editing)}
                    teacherName={name}
                    email={email}
                    phone={phone}
                    submitting={submitting}
                    onNameChange={(e) => setName(e.target.value)}
                    onEmailChange={(e) => setEmail(e.target.value)}
                    onPhoneChange={(e) => setPhone(e.target.value)}
                    onClose={() => {
                        closeModal();
                        resetForm();
                    }}
                    onSubmit={submit}
                />,
            )}
            {confirmModalPortal(
                <ConfirmationModal
                    title={t('common.delete')}
                    description={t('admin.teachers.deleteConfirm')}
                    isLoading={deleting}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-500"
                    onSubmit={confirmDelete}
                />,
            )}
        </>
    );
}
