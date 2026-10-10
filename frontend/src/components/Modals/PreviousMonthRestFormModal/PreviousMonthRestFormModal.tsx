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

interface PreviousMonthRestFormModalProps {
    periodLabel: string;
    amount: number;
    onSubmit: (amount: number) => Promise<void>;
    isLoading?: boolean;
}

export default function PreviousMonthRestFormModal({
    periodLabel,
    amount,
    onSubmit,
    isLoading = false,
}: Readonly<PreviousMonthRestFormModalProps>) {
    const t = useTranslations('admin.dailyIncome');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();

    const form = useForm({
        defaultValues: { amount: amount ? String(amount) : '' },
        onSubmit: async ({ value }) => {
            await onSubmit(Number(value.amount));
            closeModal();
        },
    });

    return (
        <Modal
            title={t('previousMonthRest')}
            subTitle={t('previousMonthRestHint', { period: periodLabel })}
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
                        name="amount"
                        validators={{
                            onSubmit: ({ value }) =>
                                value.trim() && !Number.isNaN(Number(value))
                                    ? undefined
                                    : t('amountInvalid'),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('amount')}
                                value={state.value}
                                id="previous-month-rest-amount"
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
                        id="previous-month-rest-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="previous-month-rest-submit"
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
