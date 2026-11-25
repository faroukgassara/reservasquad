'use client';

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import {
    DrawerActions,
    DrawerForm,
    DrawerScrollContent,
} from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField';
import Button from '@/components/Primitives/Button/Button';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import ChargeCategoriesManageModal from '@/components/Modals/ChargeCategoriesManageModal/ChargeCategoriesManageModal';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import {
    fetchChargeCategories,
    isIncomeLineType,
    toDateInputValue,
    type IncomeLineRecord,
    type IncomeLineType,
} from '@/lib/daily-income-api';

export interface IncomeLineFormValues {
    date: string;
    type: IncomeLineType;
    categoryId: string;
    description: string;
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
    const [manageOpen, setManageOpen] = useState(false);

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['charge-categories'],
        queryFn: fetchChargeCategories,
    });

    const form = useForm({
        defaultValues: {
            date: line ? toDateInputValue(line.date) : '',
            type: (line?.type ?? defaultType) as IncomeLineType,
            categoryId: line?.categoryId ?? line?.category?.id ?? '',
            description: line?.description ?? '',
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
        form.setFieldValue('categoryId', line.categoryId ?? line.category?.id ?? '');
        form.setFieldValue('description', line.description ?? '');
        form.setFieldValue('amount', String(line.amount));
    }, [line, form]);

    const categoryOptions = categories.map((category) => ({
        value: category.id,
        label: category.name,
    }));

    return (
        <>
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
                    <DrawerScrollContent>
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
                                    <DatePickerField
                                        id="income-line-date"
                                        value={state.value}
                                        error={!!state.meta.errors?.length}
                                        onChange={handleChange}
                                    />
                                    {state.meta.errors?.[0] ? (
                                        <Label
                                            variant={EVariantLabel.hint}
                                            color="text-danger-500"
                                            className="mt-1.5 block"
                                        >
                                            {state.meta.errors[0]}
                                        </Label>
                                    ) : null}
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
                                        { value: 'ECOFACTURE', label: t('ecofacture') },
                                        { value: 'FAROUK', label: t('farouk') },
                                        { value: 'MAJDI', label: t('majdi') },
                                    ]}
                                    value={state.value}
                                    onChange={(value) => {
                                        if (!isIncomeLineType(value)) return;
                                        handleChange(value);
                                        if (value !== 'CHARGE') {
                                            form.setFieldValue('categoryId', '');
                                        }
                                    }}
                                />
                            )}
                        </form.Field>

                        <form.Subscribe selector={(s) => s.values.type}>
                            {(type) =>
                                type === 'CHARGE' ? (
                                    <form.Field
                                        name="categoryId"
                                        validators={{
                                            onSubmit: ({ value }) =>
                                                value?.trim() ? undefined : t('categoryRequired'),
                                        }}
                                    >
                                        {({ state, handleChange }) => (
                                            <div className="flex flex-col gap-2">
                                                {/* Remount when the manage modal closes so any open menu cannot stack above it. */}
                                                <Dropdown
                                                    key={manageOpen ? 'category-paused' : 'category-ready'}
                                                    label={t('category')}
                                                    options={categoryOptions}
                                                    value={state.value}
                                                    onChange={(value) => handleChange(String(value))}
                                                    searchable
                                                    required
                                                    disabled={categoriesLoading || manageOpen}
                                                    error={!!state.meta.errors?.length}
                                                    hintText={
                                                        state.meta.errors?.[0]
                                                            ? String(state.meta.errors[0])
                                                            : undefined
                                                    }
                                                />
                                                <Button
                                                    id="income-line-manage-categories"
                                                    type={EButtonType.secondary}
                                                    size={EButtonSize.small}
                                                    text={t('manageCategories')}
                                                    iconPosition="left"
                                                    icon={{
                                                        name: IconComponentsEnum.settings,
                                                        size: ESize.sm,
                                                        color: 'text-gray-700',
                                                    }}
                                                    onClick={() => setManageOpen(true)}
                                                    className="w-full justify-center"
                                                />
                                            </div>
                                        )}
                                    </form.Field>
                                ) : null
                            }
                        </form.Subscribe>

                        <form.Field name="description">
                            {({ state, handleChange }) => (
                                <Input
                                    label={t('description')}
                                    value={state.value}
                                    id="income-line-description"
                                    onChange={(e) => handleChange(e.target.value)}
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
                            className="flex-1"
                        />
                        <Button
                            id="income-line-submit"
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

            {manageOpen ? (
                <ChargeCategoriesManageModal
                    onClose={() => setManageOpen(false)}
                    onCreated={(category) => {
                        form.setFieldValue('categoryId', category.id);
                        setManageOpen(false);
                    }}
                />
            ) : null}
        </>
    );
}
