'use client';

import { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import {
    DrawerActions,
    DrawerForm,
    DrawerScrollContent,
} from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType } from '@/Enum/Enum';
import type { RoomRecord } from '@/lib/room-api';

export interface RoomFormValues {
    name: string;
    capacity: string;
    pricePerHour: string;
}

interface RoomFormModalProps {
    mode: 'create' | 'edit';
    room?: RoomRecord | null;
    onSubmit: (values: RoomFormValues) => Promise<void>;
    isLoading?: boolean;
}

export default function RoomFormModal({
    mode,
    room,
    onSubmit,
    isLoading = false,
}: Readonly<RoomFormModalProps>) {
    const t = useTranslations('admin.rooms');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const form = useForm({
        defaultValues: {
            name: room?.name ?? '',
            capacity: room ? String(room.capacity) : '1',
            pricePerHour: room ? String(room.pricePerHour) : '0',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as RoomFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (!room) return;
        form.setFieldValue('name', room.name);
        form.setFieldValue('capacity', String(room.capacity));
        form.setFieldValue('pricePerHour', String(room.pricePerHour));
    }, [room, form]);

    return (
        <Modal
            title={isEdit ? t('edit') : t('create')}
            subTitle={t('subtitle')}
            canClose
            canCloseOnClickOutisde
            isDrawer
        >
            <DrawerForm
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <DrawerScrollContent className="gap-0 space-y-4 p-6">
                    <form.Field
                        name="name"
                        validators={{
                            onSubmit: ({ value }) => (value?.trim() ? undefined : t('name')),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('name')}
                                value={state.value}
                                id="room-name"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>
                    <form.Field
                        name="capacity"
                        validators={{
                            onSubmit: ({ value }) =>
                                Number(value) >= 1 ? undefined : t('capacity'),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('capacity')}
                                value={state.value}
                                id="room-capacity"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                                {...({ type: 'number' } as object)}
                            />
                        )}
                    </form.Field>
                    <form.Field
                        name="pricePerHour"
                        validators={{
                            onSubmit: ({ value }) =>
                                Number(value) >= 0 ? undefined : t('pricePerHour'),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('pricePerHour')}
                                value={state.value}
                                id="room-price-per-hour"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                                {...({ type: 'number', step: '0.01' } as object)}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="room-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="room-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={tCommon('save')}
                        isLoading={isLoading}
                        onClick={() => form.handleSubmit()}
                        className="flex-1"
                    />
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
}
