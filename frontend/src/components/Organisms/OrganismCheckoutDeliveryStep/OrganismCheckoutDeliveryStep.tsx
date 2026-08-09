'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import {
    EButtonSize,
    EButtonType,
    EInputType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { useToast } from '@/contexts/ToastContext';
import type { CheckoutDeliveryValues } from '@/types/checkout';

type LockedAccountFields = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

type OrganismCheckoutDeliveryStepProps = Readonly<{
    isAuthenticated: boolean;
    lockedFields: LockedAccountFields;
    initialValues?: Partial<CheckoutDeliveryValues>;
    onContinue: (values: CheckoutDeliveryValues) => void;
}>;

export default function OrganismCheckoutDeliveryStep({
    isAuthenticated,
    lockedFields,
    initialValues,
    onContinue,
}: OrganismCheckoutDeliveryStepProps) {
    const t = useTranslations('checkout');
    const { openToast } = useToast();

    const deliverySchema = useMemo(
        () =>
            z.object({
                firstName: z.string().min(1, t('errors.required')),
                lastName: z.string().min(1, t('errors.required')),
                email: z.string().email(t('errors.email')),
                phone: z.string().min(4, t('errors.phone')),
                address: z.string().min(3, t('errors.required')),
                city: z.string().min(1, t('errors.required')),
                governorate: z.string().min(1, t('errors.required')),
                postalCode: z.string().min(1, t('errors.required')),
            }),
        [t],
    );

    const form = useForm({
        defaultValues: {
            firstName: lockedFields.firstName || initialValues?.firstName || '',
            lastName: lockedFields.lastName || initialValues?.lastName || '',
            email: lockedFields.email || initialValues?.email || '',
            phone: lockedFields.phone || initialValues?.phone || '',
            address: initialValues?.address || '',
            city: initialValues?.city || '',
            governorate: initialValues?.governorate || '',
            postalCode: initialValues?.postalCode || '',
        } satisfies CheckoutDeliveryValues,
        onSubmit: async ({ value }) => {
            const parsed = deliverySchema.safeParse(value);
            if (!parsed.success) {
                openToast(
                    t('errors.title'),
                    parsed.error.issues[0]?.message ?? t('errors.required'),
                    { type: EToastType.ERROR },
                );
                return;
            }

            onContinue({
                ...parsed.data,
                firstName: isAuthenticated ? lockedFields.firstName : parsed.data.firstName,
                lastName: isAuthenticated ? lockedFields.lastName : parsed.data.lastName,
                email: isAuthenticated ? lockedFields.email : parsed.data.email,
                phone: isAuthenticated ? lockedFields.phone : parsed.data.phone,
            });
        },
    });

    useEffect(() => {
        if (!isAuthenticated) return;
        if (lockedFields.firstName) form.setFieldValue('firstName', lockedFields.firstName);
        if (lockedFields.lastName) form.setFieldValue('lastName', lockedFields.lastName);
        if (lockedFields.email) form.setFieldValue('email', lockedFields.email);
        if (lockedFields.phone) form.setFieldValue('phone', lockedFields.phone);
    }, [isAuthenticated, lockedFields, form]);

    const lockedHint = isAuthenticated ? t('fields.lockedHint') : undefined;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
            }}
            className="space-y-5"
        >
            <Label variant={EVariantLabel.h5} color="text-primary-500" className="block">
                {t('deliveryTitle')}
            </Label>

            <Div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="firstName">
                    {({ state, handleChange }) => (
                        <Input
                            id="checkout-firstName"
                            label={t('fields.firstName')}
                            required
                            value={state.value}
                            onChange={(e) => handleChange(e.target.value)}
                            readOnly={isAuthenticated}
                            disabled={isAuthenticated}
                            error={state.meta.errors.length > 0}
                            hintText={
                                lockedHint ?? (state.meta.errors[0] as string | undefined)
                            }
                        />
                    )}
                </form.Field>
                <form.Field name="lastName">
                    {({ state, handleChange }) => (
                        <Input
                            id="checkout-lastName"
                            label={t('fields.lastName')}
                            required
                            value={state.value}
                            onChange={(e) => handleChange(e.target.value)}
                            readOnly={isAuthenticated}
                            disabled={isAuthenticated}
                            error={state.meta.errors.length > 0}
                            hintText={
                                lockedHint ?? (state.meta.errors[0] as string | undefined)
                            }
                        />
                    )}
                </form.Field>
            </Div>

            <form.Field name="email">
                {({ state, handleChange }) => (
                    <Input
                        id="checkout-email"
                        label={t('fields.email')}
                        type={EInputType.email}
                        required
                        value={state.value}
                        onChange={(e) => handleChange(e.target.value)}
                        readOnly={isAuthenticated}
                        disabled={isAuthenticated}
                        error={state.meta.errors.length > 0}
                        hintText={lockedHint ?? (state.meta.errors[0] as string | undefined)}
                    />
                )}
            </form.Field>

            <form.Field name="phone">
                {({ state, handleChange }) => (
                    <Input
                        id="checkout-phone"
                        label={t('fields.phone')}
                        required
                        value={state.value}
                        onChange={(e) => handleChange(e.target.value)}
                        readOnly={isAuthenticated}
                        disabled={isAuthenticated}
                        error={state.meta.errors.length > 0}
                        hintText={lockedHint ?? (state.meta.errors[0] as string | undefined)}
                    />
                )}
            </form.Field>

            <form.Field name="address">
                {({ state, handleChange }) => (
                    <Input
                        id="checkout-address"
                        label={t('fields.address')}
                        required
                        value={state.value}
                        onChange={(e) => handleChange(e.target.value)}
                        error={state.meta.errors.length > 0}
                        hintText={state.meta.errors[0] as string | undefined}
                    />
                )}
            </form.Field>

            <Div className="grid gap-4 sm:grid-cols-3">
                <form.Field name="city">
                    {({ state, handleChange }) => (
                        <Input
                            id="checkout-city"
                            label={t('fields.city')}
                            required
                            value={state.value}
                            onChange={(e) => handleChange(e.target.value)}
                            error={state.meta.errors.length > 0}
                            hintText={state.meta.errors[0] as string | undefined}
                        />
                    )}
                </form.Field>
                <form.Field name="governorate">
                    {({ state, handleChange }) => (
                        <Input
                            id="checkout-governorate"
                            label={t('fields.governorate')}
                            required
                            value={state.value}
                            onChange={(e) => handleChange(e.target.value)}
                            error={state.meta.errors.length > 0}
                            hintText={state.meta.errors[0] as string | undefined}
                        />
                    )}
                </form.Field>
                <form.Field name="postalCode">
                    {({ state, handleChange }) => (
                        <Input
                            id="checkout-postalCode"
                            label={t('fields.postalCode')}
                            required
                            value={state.value}
                            onChange={(e) => handleChange(e.target.value)}
                            error={state.meta.errors.length > 0}
                            hintText={state.meta.errors[0] as string | undefined}
                        />
                    )}
                </form.Field>
            </Div>

            <Div className="flex items-center justify-between gap-4 pt-2">
                <Link
                    href={Routes.Cart}
                    className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-primary-500 hover:underline"
                >
                    {t('backToCart')}
                </Link>
                <Button
                    id="checkout-delivery-continue"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    text={t('continue')}
                    icon={{
                        name: IconComponentsEnum.arrowRight,
                        size: ESize.sm,
                        color: 'text-white',
                    }}
                    iconPosition="right"
                    onClick={() => void form.handleSubmit()}
                />
            </Div>
        </form>
    );
}
