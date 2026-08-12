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
import { EButtonSize, EButtonType, EInputType } from '@/Enum/Enum';
import type { ProfessorRecord } from '@/lib/professor-api';

export interface ProfessorFormValues {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialty: string;
}

interface ProfessorFormModalProps {
    mode: 'create' | 'edit';
    professor?: ProfessorRecord | null;
    onSubmit: (values: ProfessorFormValues) => Promise<void>;
    isLoading?: boolean;
}

export default function ProfessorFormModal({
    mode,
    professor,
    onSubmit,
    isLoading = false,
}: Readonly<ProfessorFormModalProps>) {
    const t = useTranslations('admin.professors');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const form = useForm({
        defaultValues: {
            firstName: professor?.firstName ?? '',
            lastName: professor?.lastName ?? '',
            email: professor?.email ?? '',
            phone: professor?.phone ?? '',
            specialty: professor?.specialty ?? '',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as ProfessorFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (!professor) return;
        form.setFieldValue('firstName', professor.firstName);
        form.setFieldValue('lastName', professor.lastName);
        form.setFieldValue('email', professor.email ?? '');
        form.setFieldValue('phone', professor.phone ?? '');
        form.setFieldValue('specialty', professor.specialty ?? '');
    }, [professor, form]);

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
                        name="firstName"
                        validators={{
                            onSubmit: ({ value }) => (value?.trim() ? undefined : t('firstName')),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('firstName')}
                                value={state.value}
                                id="professor-first-name"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>
                    <form.Field
                        name="lastName"
                        validators={{
                            onSubmit: ({ value }) => (value?.trim() ? undefined : t('lastName')),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('lastName')}
                                value={state.value}
                                id="professor-last-name"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>
                    <form.Field name="email">
                        {({ state, handleChange }) => (
                            <Input
                                label={t('email')}
                                type={EInputType.email}
                                value={state.value}
                                id="professor-email"
                                onChange={(e) => handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                    <form.Field name="phone">
                        {({ state, handleChange }) => (
                            <Input
                                label={t('phone')}
                                value={state.value}
                                id="professor-phone"
                                onChange={(e) => handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                    <form.Field name="specialty">
                        {({ state, handleChange }) => (
                            <Input
                                label={t('specialty')}
                                value={state.value}
                                id="professor-specialty"
                                onChange={(e) => handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="professor-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="professor-submit"
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
