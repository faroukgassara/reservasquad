'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import RoomFormModal, { type RoomFormValues } from '@/components/Modals/RoomFormModal/RoomFormModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import {
    createRoom,
    deleteRoom,
    fetchRooms,
    updateRoom,
    type RoomRecord,
} from '@/lib/room-api';
import {
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | { type: 'form'; room: RoomRecord | null }
    | { type: 'delete'; room: RoomRecord }
    | null;

function formatPrice(value: number | string): string {
    const amount = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(amount)) return String(value);
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function RoomsAdminPage() {
    const t = useTranslations('admin.rooms');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const canManage = isAllowed({ anyRoles: ['ADMIN', 'USER'] });
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    useEffect(() => {
        if (!canManage) router.replace(Routes.Dashboard);
    }, [canManage, router]);

    const { data, isLoading } = useQuery({
        queryKey: ['rooms', page, searchValue],
        queryFn: () => fetchRooms({ page, perPage: 10, search: searchValue || undefined }),
        enabled: canManage,
    });

    const invalidateRooms = () => {
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        queryClient.invalidateQueries({ queryKey: ['rooms-options'] });
    };

    const createMutation = useMutation({
        mutationFn: createRoom,
        onSuccess: () => {
            invalidateRooms();
            openToast(tCommon('success'), t('create'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateRoom>[1] }) =>
            updateRoom(id, body),
        onSuccess: () => {
            invalidateRooms();
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteRoom,
        onSuccess: () => {
            invalidateRooms();
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const handleFormSubmit = useCallback(
        async (values: RoomFormValues) => {
            const payload = {
                name: values.name.trim(),
                capacity: Number(values.capacity),
                pricePerHour: Number(values.pricePerHour),
            };
            if (modalState?.type === 'form' && modalState.room) {
                await updateMutation.mutateAsync({ id: modalState.room.id, body: payload });
                return;
            }
            await createMutation.mutateAsync(payload);
        },
        [createMutation, modalState, updateMutation],
    );

    const columns = useMemo(
        (): ITableColumn<RoomRecord>[] => [
            {
                headerElement: {
                    value: 'name',
                    label: t('name'),
                    render: (_: unknown, row: RoomRecord) => (
                        <OrganismTable.Cell mainText={row.name} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'capacity',
                    label: t('capacity'),
                    render: (_: unknown, row: RoomRecord) => (
                        <OrganismTable.Cell mainText={String(row.capacity)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'pricePerHour',
                    label: t('pricePerHour'),
                    render: (_: unknown, row: RoomRecord) => (
                        <OrganismTable.Cell mainText={formatPrice(row.pricePerHour)} />
                    ),
                },
            },
        ],
        [t],
    );

    const actions = useMemo((): ITableAction<RoomRecord>[] => {
        const items: ITableAction<RoomRecord>[] = [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'form', room: row });
                    openModal();
                },
            },
        ];
        if (isAdmin) {
            items.push({
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'delete', room: row });
                    openModal();
                },
            });
        }
        return items;
    }, [isAdmin, openModal, tCommon]);

    const renderModalContent = () => {
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deleteConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteMutation.mutate(modalState.room.id)}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        if (modalState?.type === 'form') {
            return (
                <RoomFormModal
                    mode={modalState.room ? 'edit' : 'create'}
                    room={modalState.room}
                    onSubmit={handleFormSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            );
        }
        return null;
    };

    if (!canManage) return null;

    return (
        <>
            {modalPortal(renderModalContent())}
            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <div className="min-h-full">
                        <OrganismTable<RoomRecord>
                            columns={columns}
                            rows={rows}
                            pageSize={10}
                            searchable
                            searchValue={searchValue}
                            onSearchChange={(value) => {
                                setSearchValue(value);
                                setPage(1);
                            }}
                            placeholder={tCommon('search')}
                            actions={actions}
                            isLoading={isLoading}
                            emptyMessage={tCommon('empty')}
                            page={page}
                            totalRows={totalRows}
                            onPageChange={setPage}
                            primaryAction={
                                <Button
                                    id="rooms-add-btn"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    iconPosition="left"
                                    icon={{
                                        name: IconComponentsEnum.plus,
                                        size: ESize.sm,
                                        color: 'text-white',
                                    }}
                                    text={t('create')}
                                    onClick={() => {
                                        setModalState({ type: 'form', room: null });
                                        openModal();
                                    }}
                                />
                            }
                        />
                    </div>
                }
            />
        </>
    );
}
