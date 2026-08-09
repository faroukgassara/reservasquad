'use client';

import { useEffect, useMemo } from 'react';
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
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType } from '@/Enum/Enum';
import type { UserRecord, UserRole, UserStatus } from '@/lib/user-api';

export interface UserFormValues {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    status: UserStatus;
}

const USER_ROLES: UserRole[] = ['USER', 'ADMIN'];

function isUserRole(value: string | number | (string | number)[]): value is UserRole {
    return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

function isUserStatus(value: string | number | (string | number)[]): value is UserStatus {
    return value === 'ACTIVE' || value === 'INACTIVE';
}

interface UserFormModalProps {
    mode: 'create' | 'edit';
    user?: UserRecord | null;
    onSubmit: (values: UserFormValues) => Promise<void>;
    isLoading?: boolean;
}

const UserFormModal = ({
    mode,
    user,
    onSubmit,
    isLoading = false,
}: Readonly<UserFormModalProps>) => {
    const t = useTranslations('admin.users');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';
    const isAdminAccount = isEdit && user?.role === 'ADMIN';

    const roleOptions = useMemo(
        () =>
            USER_ROLES.map((value) => ({
                value,
                label: t(`roles.${value}`),
            })),
        [t],
    );

    const statusOptions = useMemo(() => {
        const options: { value: UserStatus; label: string }[] = [
            { value: 'ACTIVE', label: tStatus('active') },
        ];
        if (!isAdminAccount) {
            options.push({ value: 'INACTIVE', label: tStatus('inactive') });
        }
        return options;
    }, [isAdminAccount, tStatus]);

    const form = useForm({
        defaultValues: {
            firstName: user?.firstName ?? '',
            lastName: user?.lastName ?? '',
            email: user?.email ?? '',
            phone: user?.phone ?? '',
            password: '',
            role: (user?.role ?? 'USER') as UserRole,
            status: (user?.status ?? 'ACTIVE') as UserStatus,
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as UserFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (!user) return;
        form.setFieldValue('firstName', user.firstName);
        form.setFieldValue('lastName', user.lastName);
        form.setFieldValue('email', user.email);
        form.setFieldValue('phone', user.phone);
        form.setFieldValue('password', '');
        form.setFieldValue('role', user.role);
        form.setFieldValue('status', user.status);
    }, [user, form]);

    return (
        <Modal
            title={isEdit ? t('modalEditTitle') : t('modalCreateTitle')}
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
                            onSubmit: ({ value }) =>
                                value?.trim() ? undefined : 'Le prénom est requis',
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label="Prénom"
                                placeholder={t('placeholders.firstName')}
                                value={state.value}
                                id="user-first-name"
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
                            onSubmit: ({ value }) =>
                                value?.trim() ? undefined : 'Le nom est requis',
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label="Nom"
                                placeholder={t('placeholders.lastName')}
                                value={state.value}
                                id="user-last-name"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="email"
                        validators={{
                            onSubmit: ({ value }) =>
                                value?.trim() ? undefined : "L'e-mail est requis",
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label="E-mail"
                                type={EInputType.email}
                                placeholder={t('placeholders.email')}
                                value={state.value}
                                id="user-email"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                disabled={isEdit}
                                readOnly={isEdit}
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="phone"
                        validators={{
                            onSubmit: ({ value }) =>
                                value?.trim() ? undefined : 'Le téléphone est requis',
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label="Téléphone"
                                placeholder="+216 XX XXX XXX"
                                value={state.value}
                                id="user-phone"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="password"
                        validators={{
                            onSubmit: ({ value }) => {
                                if (!isEdit && !value?.trim()) {
                                    return 'Le mot de passe est requis';
                                }
                                if (value && value.length < 6) {
                                    return 'Le mot de passe doit contenir au moins 6 caractères';
                                }
                                return undefined;
                            },
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={isEdit ? 'Nouveau mot de passe' : 'Mot de passe'}
                                isPassword
                                placeholder={isEdit ? 'Laisser vide pour ne pas changer' : '••••••••'}
                                value={state.value}
                                id="user-password"
                                onChange={(e) => handleChange(e.target.value)}
                                required={!isEdit}
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>

                    <form.Field name="role">
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={t('fields.role')}
                                options={roleOptions}
                                value={state.value}
                                onChange={(value) => {
                                    if (isUserRole(value)) handleChange(value);
                                }}
                                placeholder={t('fields.role')}
                            />
                        )}
                    </form.Field>

                    <form.Field name="status">
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={tCommon('status')}
                                options={statusOptions}
                                value={state.value}
                                onChange={(value) => {
                                    if (isUserStatus(value)) handleChange(value);
                                }}
                                placeholder={tCommon('status')}
                                disabled={isAdminAccount}
                                hintText={isAdminAccount ? t('adminCannotDeactivate') : undefined}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>

                <DrawerActions>
                    <Button
                        id="user-form-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                        {([canSubmit, isSubmitting]) => {
                            let submitLabel = tCommon('create');
                            if (isSubmitting || isLoading) {
                                submitLabel = tCommon('loading');
                            } else if (isEdit) {
                                submitLabel = tCommon('save');
                            }

                            return (
                                <Button
                                    id="user-form-submit"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    text={submitLabel}
                                    disabled={!canSubmit || isSubmitting || isLoading}
                                    onClick={() => form.handleSubmit()}
                                    className="flex-1"
                                />
                            );
                        }}
                    </form.Subscribe>
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
};

export default UserFormModal;
