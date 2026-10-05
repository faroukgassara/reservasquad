'use client';

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
import type { CreditClientRecord } from '@/lib/credit-api';

export interface CreditClientFormValues {
    firstName: string;
    lastName: string;
    phone: string;
}

interface CreditClientFormModalProps {
    client?: CreditClientRecord | null;
    onSubmit: (values: CreditClientFormValues) => Promise<void>;
    isLoading?: boolean;
}

export default function CreditClientFormModal({
    client,
    onSubmit,
    isLoading = false,
}: Readonly<CreditClientFormModalProps>) {
    const t = useTranslations('admin.credits');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();

    const form = useForm({
        defaultValues: {
            firstName: client?.firstName ?? '',
            lastName: client?.lastName ?? '',
            phone: client?.phone ?? '',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value);
            closeModal();
        },
    });

    return (
        <Modal
            title={client ? t('editClient') : t('createClient')}
            subTitle={t('clientFormHint')}
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
                                value.trim() ? undefined : t('fieldRequired', { field: t('firstName') }),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('firstName')}
                                value={state.value}
                                id="credit-client-first-name"
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
                                value.trim() ? undefined : t('fieldRequired', { field: t('lastName') }),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('lastName')}
                                value={state.value}
                                id="credit-client-last-name"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>
                    <form.Field name="phone">
                        {({ state, handleChange }) => (
                            <Input
                                label={t('phone')}
                                value={state.value}
                                id="credit-client-phone"
                                onChange={(e) => handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="credit-client-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="credit-client-submit"
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
