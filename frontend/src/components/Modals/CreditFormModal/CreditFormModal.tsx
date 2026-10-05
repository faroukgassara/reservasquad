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
import Label from '@/components/Primitives/Label/Label';
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField';
import Button from '@/components/Primitives/Button/Button';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import { toDateInputValue } from '@/lib/daily-income-api';
import { todayDateInputValue, type CreditRecord } from '@/lib/credit-api';

export interface CreditFormValues {
    date: string;
    amount: string;
    description: string;
}

interface CreditFormModalProps {
    clientName: string;
    credit?: CreditRecord | null;
    onSubmit: (values: CreditFormValues) => Promise<void>;
    isLoading?: boolean;
}

export default function CreditFormModal({
    clientName,
    credit,
    onSubmit,
    isLoading = false,
}: Readonly<CreditFormModalProps>) {
    const t = useTranslations('admin.credits');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();

    const form = useForm({
        defaultValues: {
            date: credit ? toDateInputValue(credit.date) : todayDateInputValue(),
            amount: credit ? String(credit.amount) : '',
            description: credit?.description ?? '',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value);
            closeModal();
        },
    });

    return (
        <Modal
            title={credit ? t('editCredit') : t('createCredit')}
            subTitle={clientName}
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
                            onSubmit: ({ value }) =>
                                value ? undefined : t('fieldRequired', { field: t('date') }),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <div>
                                <DatePickerField
                                    id="credit-date"
                                    label={t('date')}
                                    required
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
                        name="amount"
                        validators={{
                            onSubmit: ({ value }) => {
                                const amount = Number(value);
                                if (!value.trim() || Number.isNaN(amount) || amount <= 0) {
                                    return t('amountInvalid');
                                }
                                if (credit && amount < credit.totalPaid) {
                                    return t('amountBelowPaid');
                                }
                                return undefined;
                            },
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('amount')}
                                value={state.value}
                                id="credit-amount"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>
                    <form.Field name="description">
                        {({ state, handleChange }) => (
                            <Input
                                label={t('description')}
                                value={state.value}
                                id="credit-description"
                                isTextArea
                                onChange={(e) => handleChange(e.target.value)}
                                placeholder={t('descriptionPlaceholder')}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="credit-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="credit-submit"
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
