'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import AdminRoomModal from '@/components/Modals/AdminRoomModal/AdminRoomModal';
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

type Room = {
    id: string;
    name: string;
    capacity: number;
    color: string;
    description: string | null;
    equipment: string[];
    pricePerHour: number;
};

type AdminRoomTableRow = {
    room: Room;
    name: string;
    capacity: number;
    priceDisplay: string;
    color: string;
    equipmentDisplay: string;
};

const DEFAULT_CAPACITY = 8;
const DEFAULT_COLOR = '#22c55e';
const DEFAULT_EQUIPMENT = 'projector, whiteboard';

export default function AdminRoomsPage() {
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
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Room | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
    const [color, setColor] = useState(DEFAULT_COLOR);
    const [description, setDescription] = useState('');
    const [equipment, setEquipment] = useState(DEFAULT_EQUIPMENT);
    const [pricePerHour, setPricePerHour] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
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
        setCapacity(DEFAULT_CAPACITY);
        setColor(DEFAULT_COLOR);
        setDescription('');
        setEquipment(DEFAULT_EQUIPMENT);
        setPricePerHour(0);
    }, []);

    const openCreateModal = useCallback(() => {
        resetForm();
        openModal();
    }, [openModal, resetForm]);

    const openEditModal = useCallback(
        (room: Room) => {
            setEditing(room);
            setName(room.name);
            setCapacity(room.capacity);
            setColor(room.color);
            setDescription(room.description || '');
            setEquipment(room.equipment.join(', '));
            setPricePerHour(Number(room.pricePerHour ?? 0));
            openModal();
        },
        [openModal],
    );

    const equipArray = useCallback(
        (): string[] =>
            equipment
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
        [equipment],
    );

    const submit = async () => {
        if (!token) return;
        setSubmitting(true);
        const wasEditing = Boolean(editing);
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
            closeModal();
            resetForm();
            await load();
            openToast(
                t('common.success'),
                wasEditing ? t('admin.rooms.updated') : t('admin.rooms.created'),
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
            await backendFetch(token, `/rooms/${pendingDeleteId}`, { method: 'DELETE' });
            closeConfirmModal();
            setPendingDeleteId(null);
            await load();
            openToast(t('common.success'), t('admin.rooms.deleted'), { type: EToastType.SUCCESS });
        } catch (e) {
            openToast(
                t('common.error'),
                e instanceof ApiError ? e.message : t('admin.rooms.deleteFailed'),
                { type: EToastType.ERROR },
            );
        } finally {
            setDeleting(false);
        }
    }, [token, pendingDeleteId, closeConfirmModal, load, openToast, t]);

    const tableRows: AdminRoomTableRow[] = useMemo(
        () =>
            rooms.map((room) => ({
                room,
                name: room.name,
                capacity: room.capacity,
                priceDisplay: (room.pricePerHour ?? 0).toLocaleString('fr-TN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }),
                color: room.color,
                equipmentDisplay: room.equipment.join(', '),
            })),
        [rooms],
    );

    const roomColumns = useMemo<IMoleculeTableColumn<AdminRoomTableRow>[]>(
        () => [
            {
                headerElement: {
                    value: 'name',
                    label: t('admin.rooms.name'),
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomDiv
                            className="inline-flex max-w-[12rem] rounded px-2 py-0.5"
                            style={{ borderLeft: `3px solid ${row.room.color}` }}
                        >
                            <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-medium">
                                {row.name}
                            </AtomLabel>
                        </AtomDiv>
                    ),
                },
            },
            {
                headerElement: {
                    value: 'capacity',
                    label: t('admin.rooms.capacityShort'),
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                },
            },
            {
                headerElement: {
                    value: 'priceDisplay',
                    label: t('admin.rooms.tndPerHour'),
                    sortable: true,
                    headerClassName: 'uppercase text-xs text-right',
                    render: (_, row) => (
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="tabular-nums">
                            {row.priceDisplay}
                        </AtomLabel>
                    ),
                },
            },
            {
                headerElement: {
                    value: 'color',
                    label: t('admin.rooms.color'),
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomDiv
                            className="inline-flex items-center gap-2 rounded-full px-2 py-1"
                            style={{
                                borderLeft: `4px solid ${row.color}`,
                                backgroundColor: `${row.color}20`,
                            }}
                        >
                            <AtomLabel variant={EVariantLabel.caption} color="text-gray-700" className="font-mono">
                                {row.color}
                            </AtomLabel>
                        </AtomDiv>
                    ),
                },
            },
            {
                headerElement: {
                    value: 'equipmentDisplay',
                    label: t('admin.rooms.equipmentCol'),
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600" className="max-w-[12rem] truncate">
                            {row.equipmentDisplay}
                        </AtomLabel>
                    ),
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
                                id={`admin-room-edit-${row.room.id}`}
                                type={EButtonType.secondary}
                                className="rounded! px-2! py-1! text-[11px]!"
                                onClick={() => openEditModal(row.room)}
                                text={t('common.edit')}
                            />
                            <AtomButton
                                id={`admin-room-delete-${row.room.id}`}
                                type={EButtonType.primary}
                                className="rounded! px-2! py-1! text-[11px]! text-white!"
                                style={{ backgroundColor: '#dc2626' }}
                                onClick={() => openDeleteConfirm(row.room.id)}
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
            id="admin-rooms-create"
            type={EButtonType.primary}
            className="shrink-0 rounded-lg px-4! py-2.5! text-sm font-semibold text-white shadow-sm bg-primary-600 hover:bg-primary-700"
            onClick={openCreateModal}
            text={`+ ${t('admin.rooms.add')}`}
        />
    );

    return (
        <>
            <LayoutWrapper
                title={t('admin.rooms.title')}
                subTitle={t('admin.rooms.subtitle')}
                mainSection={
                    <AtomDiv className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <AtomDiv className="flex flex-col gap-4 px-6 py-6">
                            <OrganismTable<AdminRoomTableRow>
                                columns={roomColumns}
                                emptyMessage={t('admin.rooms.empty')}
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
                <AdminRoomModal
                    isEditing={Boolean(editing)}
                    name={name}
                    capacity={capacity}
                    color={color}
                    description={description}
                    equipment={equipment}
                    pricePerHour={pricePerHour}
                    submitting={submitting}
                    onNameChange={(e) => setName(e.target.value)}
                    onCapacityChange={(e) => setCapacity(Number(e.target.value))}
                    onColorChange={(e) => setColor(e.target.value)}
                    onDescriptionChange={(e) => setDescription(e.target.value)}
                    onEquipmentChange={(e) => setEquipment(e.target.value)}
                    onPricePerHourChange={(e) => setPricePerHour(Number(e.target.value))}
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
                    description={t('admin.rooms.deleteConfirm')}
                    isLoading={deleting}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-500"
                    onSubmit={confirmDelete}
                />,
            )}
        </>
    );
}
