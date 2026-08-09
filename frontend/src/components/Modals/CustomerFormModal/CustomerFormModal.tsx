'use client';

import { useMemo, useState } from 'react';
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
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import type { CustomerRecord, CustomerType } from '@/lib/sales-api';

export interface CustomerFormValues {
    type: CustomerType;
    name: string;
    email: string;
    phone: string;
    company: string;
    vatNumber: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
}

const CUSTOMER_TYPES: CustomerType[] = ['COMPANY', 'INDIVIDUAL'];

function isCustomerType(value: string | number | (string | number)[]): value is CustomerType {
    return typeof value === 'string' && CUSTOMER_TYPES.includes(value as CustomerType);
}

interface CustomerFormModalProps {
    mode: 'create' | 'edit';
    customer?: CustomerRecord | null;
    onSubmit: (values: CustomerFormValues) => Promise<void>;
    isLoading?: boolean;
}

function toFormValues(customer?: CustomerRecord | null): CustomerFormValues {
    return {
        type: customer?.type ?? 'COMPANY',
        name: customer?.name ?? '',
        email: customer?.email ?? '',
        phone: customer?.phone ?? '',
        company: customer?.company ?? '',
        vatNumber: customer?.vatNumber ?? '',
        address: customer?.address ?? '',
        city: customer?.city ?? '',
        postalCode: customer?.postalCode ?? '',
        country: customer?.country ?? 'Tunisie',
    };
}

export default function CustomerFormModal({
    mode,
    customer,
    onSubmit,
    isLoading = false,
}: Readonly<CustomerFormModalProps>) {
    const t = useTranslations('sales.clients');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';
    const [values, setValues] = useState<CustomerFormValues>(() => toFormValues(customer));
    const [error, setError] = useState<string | null>(null);

    const typeOptions = useMemo(
        () =>
            CUSTOMER_TYPES.map((value) => ({
                value,
                label: t(`types.${value}`),
            })),
        [t],
    );

    const set = (patch: Partial<CustomerFormValues>) => setValues((v) => ({ ...v, ...patch }));

    const handleSubmit = async () => {
        if (!values.name.trim()) {
            setError(t('name'));
            return;
        }
        setError(null);
        try {
            await onSubmit(values);
            closeModal();
        } catch {
            // Parent mutation shows toast
        }
    };

    let submitLabel = tCommon('create');
    if (isLoading) {
        submitLabel = tCommon('loading');
    } else if (isEdit) {
        submitLabel = tCommon('save');
    }

    return (
        <Modal
            title={isEdit ? tCommon('edit') : t('add')}
            subTitle={t('subtitle')}
            canClose
            canCloseOnClickOutisde
            isDrawer
        >
            <DrawerForm
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit();
                }}
            >
                <DrawerScrollContent className="gap-4 p-6">
                    <Dropdown
                        label={t('type')}
                        options={typeOptions}
                        value={values.type}
                        onChange={(value) => {
                            if (isCustomerType(value)) set({ type: value });
                        }}
                        placeholder={t('type')}
                    />
                    <Input
                        id="customer-name"
                        label={t('name')}
                        value={values.name}
                        onChange={(e) => set({ name: e.target.value })}
                        required
                    />
                    <Input
                        id="customer-company"
                        label={t('company')}
                        value={values.company}
                        onChange={(e) => set({ company: e.target.value })}
                    />
                    <Input
                        id="customer-email"
                        label={t('email')}
                        type={EInputType.email}
                        value={values.email}
                        onChange={(e) => set({ email: e.target.value })}
                    />
                    <Input
                        id="customer-phone"
                        label={t('phone')}
                        value={values.phone}
                        onChange={(e) => set({ phone: e.target.value })}
                    />
                    <Input
                        id="customer-vat"
                        label={t('taxId')}
                        value={values.vatNumber}
                        onChange={(e) => set({ vatNumber: e.target.value })}
                    />
                    <Input
                        id="customer-address"
                        label={t('address')}
                        value={values.address}
                        onChange={(e) => set({ address: e.target.value })}
                    />
                    <Div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input
                            id="customer-city"
                            label={t('address')}
                            value={values.city}
                            onChange={(e) => set({ city: e.target.value })}
                        />
                        <Input
                            id="customer-postal"
                            label={t('address')}
                            value={values.postalCode}
                            onChange={(e) => set({ postalCode: e.target.value })}
                        />
                    </Div>
                    <Input
                        id="customer-country"
                        label={t('address')}
                        value={values.country}
                        onChange={(e) => set({ country: e.target.value })}
                    />
                    {error && (
                        <Label variant={EVariantLabel.bodySmall} color="text-danger-600">
                            {error}
                        </Label>
                    )}
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="customer-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="customer-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={submitLabel}
                        disabled={isLoading}
                        onClick={() => void handleSubmit()}
                        className="flex-1"
                    />
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
}
