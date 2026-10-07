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
import { formatMoney } from '@/lib/daily-income-api';
import { todayDateInputValue, type CreditRecord } from '@/lib/credit-api';

export interface CreditPaymentFormValues {
    date: string;
    amount: string;
    note: string;
}

interface CreditPaymentFormModalProps {
    credit: CreditRecord;
    onSubmit: (values: CreditPaymentFormValues) => Promise<void>;
    isLoading?: boolean;
}

export default function CreditPaymentFormModal({
    credit,
    onSubmit,
    isLoading = false,
}: Readonly<CreditPaymentFormModalProps>) {
    const t = useTranslations('admin.credits');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();

    const form = useForm({
        defaultValues: {
            date: todayDateInputValue(),
            amount: String(credit.remaining),
            note: '',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value);
            closeModal();
        },
    });

    return (
        <Modal
            title={t('addPayment')}
            subTitle={t('paymentFormHint', { remaining: formatMoney(credit.remaining) })}
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
                            onSubmit: ({ value }) =>
                                value ? undefined : t('fieldRequired', { field: t('date') }),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <div>
                                <DatePickerField
                                    id="credit-payment-date"
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
                                if (amount > credit.remaining) {
                                    return t('paymentExceeds');
                                }
                                return undefined;
                            },
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('amount')}
                                value={state.value}
                                id="credit-payment-amount"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>
                    <form.Field name="note">
                        {({ state, handleChange }) => (
                            <Input
                                label={t('note')}
                                value={state.value}
                                id="credit-payment-note"
                                onChange={(e) => handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="credit-payment-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="credit-payment-submit"
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
