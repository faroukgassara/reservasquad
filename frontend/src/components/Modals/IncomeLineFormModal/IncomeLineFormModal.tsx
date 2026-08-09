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
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import {
    toDateInputValue,
    type IncomeLineRecord,
    type IncomeLineType,
} from '@/lib/daily-income-api';

export interface IncomeLineFormValues {
    date: string;
    type: IncomeLineType;
    label: string;
    amount: string;
}

interface IncomeLineFormModalProps {
    mode: 'create' | 'edit';
    line?: IncomeLineRecord | null;
    defaultType?: IncomeLineType;
    onSubmit: (values: IncomeLineFormValues) => Promise<void>;
    isLoading?: boolean;
}

export default function IncomeLineFormModal({
    mode,
    line,
    defaultType = 'CHARGE',
    onSubmit,
    isLoading = false,
}: Readonly<IncomeLineFormModalProps>) {
    const t = useTranslations('admin.dailyIncome');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const form = useForm({
        defaultValues: {
            date: line ? toDateInputValue(line.date) : '',
            type: (line?.type ?? defaultType) as IncomeLineType,
            label: line?.label ?? '',
            amount: line ? String(line.amount) : '',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as IncomeLineFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (!line) return;
        form.setFieldValue('date', toDateInputValue(line.date));
        form.setFieldValue('type', line.type);
        form.setFieldValue('label', line.label);
        form.setFieldValue('amount', String(line.amount));
    }, [line, form]);

    return (
        <Modal
            title={isEdit ? t('editLine') : t('createLine')}
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
                        name="date"
                        validators={{
                            onSubmit: ({ value }) => (value ? undefined : t('date')),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <div>
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-700"
                                    className="mb-1.5 block"
                                >
                                    {t('date')}
                                </Label>
                                <input
                                    id="income-line-date"
                                    type="date"
                                    className="ds-input-field h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900"
                                    value={state.value}
                                    onChange={(e) => handleChange(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                    </form.Field>
                    <form.Field name="type">
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={t('type')}
                                options={[
                                    { value: 'CHARGE', label: t('charge') },
                                    { value: 'INVESTMENT', label: t('investment') },
                                ]}
                                value={state.value}
                                onChange={(value) => {
                                    if (value === 'CHARGE' || value === 'INVESTMENT') {
                                        handleChange(value);
                                    }
                                }}
                            />
                        )}
                    </form.Field>
                    <form.Field
                        name="label"
                        validators={{
                            onSubmit: ({ value }) => (value?.trim() ? undefined : t('label')),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('label')}
                                value={state.value}
                                id="income-line-label"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>
                    <form.Field
                        name="amount"
                        validators={{
                            onSubmit: ({ value }) => {
                                const n = Number(value);
                                if (!value?.trim() || Number.isNaN(n) || n < 0) {
                                    return t('amountInvalid');
                                }
                                return undefined;
                            },
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('amount')}
                                value={state.value}
                                id="income-line-amount"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="income-line-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                    />
                    <Button
                        id="income-line-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={tCommon('save')}
                        isLoading={isLoading}
                        onClick={() => form.handleSubmit()}
                    />
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
}
