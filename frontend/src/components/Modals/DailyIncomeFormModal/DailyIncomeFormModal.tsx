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
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField';
import Div from '@/components/Primitives/Div/Div';
import Button from '@/components/Primitives/Button/Button';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import {
    formatMoney,
    toDateInputValue,
    type DailyIncomeRecord,
} from '@/lib/daily-income-api';

export interface DailyIncomeFormValues {
    date: string;
    totalIncome: string;
}

interface DailyIncomeFormModalProps {
    mode: 'create' | 'edit';
    entry?: DailyIncomeRecord | null;
    /** Auto totals by YYYY-MM-DD from charge/investment lines */
    linesTotalsByDate?: Record<string, { charges: number; investments: number }>;
    onSubmit: (values: DailyIncomeFormValues) => Promise<void>;
    isLoading?: boolean;
}

function AutoField({ label, value }: Readonly<{ label: string; value: string }>) {
    return (
        <Div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                {label}
            </Label>
            <Label
                variant={EVariantLabel.bodySmall}
                color="text-primary-700"
                className="mt-0.5 block font-semibold"
            >
                {value}
            </Label>
        </Div>
    );
}

export default function DailyIncomeFormModal({
    mode,
    entry,
    linesTotalsByDate = {},
    onSubmit,
    isLoading = false,
}: Readonly<DailyIncomeFormModalProps>) {
    const t = useTranslations('admin.dailyIncome');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const form = useForm({
        defaultValues: {
            date: entry ? toDateInputValue(entry.date) : '',
            totalIncome: entry ? String(entry.totalIncome) : '',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as DailyIncomeFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (!entry) return;
        form.setFieldValue('date', toDateInputValue(entry.date));
        form.setFieldValue('totalIncome', String(entry.totalIncome));
    }, [entry, form]);

    return (
        <Modal
            title={isEdit ? t('editDay') : t('createDay')}
            subTitle={t('dayFormHint')}
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
                                <DatePickerField
                                    id="daily-income-date"
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
                    <form.Field
                        name="totalIncome"
                        validators={{
                            onSubmit: ({ value }) => {
                                const n = Number(value);
                                if (!value?.trim() || Number.isNaN(n) || n < 0) {
                                    return t('totalIncomeInvalid');
                                }
                                return undefined;
                            },
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('totalIncome')}
                                value={state.value}
                                id="daily-income-total"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>

                    <form.Subscribe selector={(s) => [s.values.date, s.values.totalIncome]}>
                        {([date, totalIncome]) => {
                            const income = Number(totalIncome);
                            const share =
                                totalIncome && !Number.isNaN(income)
                                    ? Math.round(income * 0.2)
                                    : null;
                            const fromEntry =
                                entry && toDateInputValue(entry.date) === date
                                    ? {
                                        charges: entry.charges ?? 0,
                                        investments: entry.investments ?? 0,
                                    }
                                    : null;
                            const fromLines = date ? linesTotalsByDate[date] : undefined;
                            const charges = fromEntry?.charges ?? fromLines?.charges ?? 0;
                            const investments =
                                fromEntry?.investments ?? fromLines?.investments ?? 0;
                            const chargesInvestment =
                                Math.round((charges + investments) * 100) / 100;

                            return (
                                <Div className="space-y-2">
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color="text-gray-500"
                                        className="block"
                                    >
                                        {t('autoCalculated')}
                                    </Label>
                                    <Div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <AutoField
                                            label={t('savings')}
                                            value={
                                                share === null ? '—' : formatMoney(share)
                                            }
                                        />
                                        <AutoField
                                            label={t('benefits')}
                                            value={
                                                share === null ? '—' : formatMoney(share)
                                            }
                                        />
                                        <AutoField
                                            label={t('chargesInvestment')}
                                            value={formatMoney(chargesInvestment)}
                                        />
                                        <AutoField
                                            label={t('charge')}
                                            value={formatMoney(charges)}
                                        />
                                        <AutoField
                                            label={t('investment')}
                                            value={formatMoney(investments)}
                                        />
                                    </Div>
                                </Div>
                            );
                        }}
                    </form.Subscribe>
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="daily-income-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="daily-income-submit"
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
