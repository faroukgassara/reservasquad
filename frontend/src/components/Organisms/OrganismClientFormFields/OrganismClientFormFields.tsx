'use client';

import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import type { CreditClientInput, CreditClientRecord } from '@/lib/credit-api';

export interface CreditClientFormValues {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    cin: string;
    taxId: string;
    address: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CIN_PATTERN = /^\d{8}$/;

/** Trimmed payload; empty strings clear optional fields on update. */
export function toClientInput(values: CreditClientFormValues): CreditClientInput {
    return {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        cin: values.cin.trim(),
        taxId: values.taxId.trim(),
        address: values.address.trim(),
    };
}

export function useClientForm(
    client: CreditClientRecord | null | undefined,
    onSubmit: (values: CreditClientFormValues) => Promise<void>,
) {
    return useForm({
        defaultValues: {
            firstName: client?.firstName ?? '',
            lastName: client?.lastName ?? '',
            phone: client?.phone ?? '',
            email: client?.email ?? '',
            cin: client?.cin ?? '',
            taxId: client?.taxId ?? '',
            address: client?.address ?? '',
        } satisfies CreditClientFormValues,
        onSubmit: async ({ value }) => onSubmit(value),
    });
}

export type ClientForm = ReturnType<typeof useClientForm>;

export default function OrganismClientFormFields({ form, idPrefix }: Readonly<{ form: ClientForm; idPrefix: string }>) {
    const t = useTranslations('admin.credits');
    const required = (field: string) => (value: string) =>
        value.trim() ? undefined : t('fieldRequired', { field });

    return (
        <Div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="firstName" validators={{ onSubmit: ({ value }) => required(t('firstName'))(value) }}>
                {({ state, handleChange }) => (
                    <Input
                        id={`${idPrefix}-first-name`}
                        label={t('firstName')}
                        value={state.value}
                        onChange={(e) => handleChange(e.target.value)}
                        required
                        hintText={state.meta.errors?.[0]}
                        error={!!state.meta.errors?.length}
                    />
                )}
            </form.Field>
            <form.Field name="lastName" validators={{ onSubmit: ({ value }) => required(t('lastName'))(value) }}>
                {({ state, handleChange }) => (
                    <Input
                        id={`${idPrefix}-last-name`}
                        label={t('lastName')}
                        value={state.value}
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
                        id={`${idPrefix}-phone`}
                        label={t('phone')}
                        value={state.value}
                        onChange={(e) => handleChange(e.target.value)}
                    />
                )}
            </form.Field>
            <form.Field
                name="email"
                validators={{
                    onSubmit: ({ value }) =>
                        !value.trim() || EMAIL_PATTERN.test(value.trim()) ? undefined : t('invalidEmail'),
                }}
            >
                {({ state, handleChange }) => (
                    <Input
                        id={`${idPrefix}-email`}
                        label={t('email')}
                        value={state.value}
                        onChange={(e) => handleChange(e.target.value)}
                        hintText={state.meta.errors?.[0]}
                        error={!!state.meta.errors?.length}
                    />
                )}
            </form.Field>
            <form.Field
                name="cin"
                validators={{
                    onSubmit: ({ value }) => (!value.trim() || CIN_PATTERN.test(value.trim()) ? undefined : t('invalidCin')),
                }}
            >
                {({ state, handleChange }) => (
                    <Input
                        id={`${idPrefix}-cin`}
                        label={t('cin')}
                        value={state.value}
                        placeholder="01234567"
                        onChange={(e) => handleChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        hintText={state.meta.errors?.[0]}
                        error={!!state.meta.errors?.length}
                    />
                )}
            </form.Field>
            <form.Field name="taxId">
                {({ state, handleChange }) => (
                    <Input
                        id={`${idPrefix}-tax-id`}
                        label={t('taxId')}
                        value={state.value}
                        placeholder="0000000X/A/M/000"
                        onChange={(e) => handleChange(e.target.value.toUpperCase())}
                    />
                )}
            </form.Field>
            <form.Field name="address">
                {({ state, handleChange }) => (
                    <Input
                        id={`${idPrefix}-address`}
                        label={t('address')}
                        value={state.value}
                        onChange={(e) => handleChange(e.target.value)}
                        containerClassName="sm:col-span-2"
                    />
                )}
            </form.Field>
        </Div>
    );
}
