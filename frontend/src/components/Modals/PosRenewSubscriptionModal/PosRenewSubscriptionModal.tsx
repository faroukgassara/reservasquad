'use client';

import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import PosInfoRow from '@/components/Organisms/Pos/PosInfoRow';
import { useCurrentModal } from '@/contexts/ModalContext';
import {
    formatPosDate,
    personName,
    subscriptionEndDate,
    toDateInput,
    type Subscription,
} from '@/lib/pos-api';
import { EButtonSize, EButtonType, EInputType } from '@/Enum/Enum';

const DAY_MS = 24 * 60 * 60 * 1000;

interface PosRenewSubscriptionModalProps {
    subscription: Subscription;
    onSubmit: (startDate: string) => Promise<void>;
    isLoading?: boolean;
}

export default function PosRenewSubscriptionModal({
    subscription,
    onSubmit,
    isLoading = false,
}: Readonly<PosRenewSubscriptionModalProps>) {
    const t = useTranslations('pos.subscriptions');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();

    const dayAfterEnd = toDateInput(new Date(Date.parse(toDateInput(subscription.endDate)) + DAY_MS));

    const form = useForm({
        defaultValues: { startDate: dayAfterEnd },
        onSubmit: async ({ value }) => {
            await onSubmit(value.startDate);
        },
    });

    return (
        <Modal title={t('renewTitle')} subTitle={t('renewSubtitle')} canClose canCloseOnClickOutisde>
            <Div className="space-y-4">
                <Div className="space-y-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <PosInfoRow label={t('client')} value={personName(subscription.client)} />
                    <PosInfoRow label={t('product')} value={subscription.productName} />
                </Div>
                <form.Field
                    name="startDate"
                    validators={{ onSubmit: ({ value }) => (value ? undefined : t('startDateRequired')) }}
                >
                    {({ state, handleChange }) => (
                        <>
                            <Input
                                id="subscription-renew-start"
                                label={t('startDate')}
                                type={EInputType.date}
                                value={state.value}
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0] ? String(state.meta.errors[0]) : undefined}
                                error={!!state.meta.errors?.length}
                            />
                            <PosInfoRow
                                label={t('endDate')}
                                value={
                                    state.value
                                        ? formatPosDate(subscriptionEndDate(state.value, subscription.duration, subscription.unit))
                                        : '—'
                                }
                            />
                        </>
                    )}
                </form.Field>
                <Div className="flex gap-3 pt-2">
                    <Button
                        id="subscription-renew-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="subscription-renew-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={t('renew')}
                        isLoading={isLoading}
                        onClick={() => form.handleSubmit()}
                        className="flex-1"
                    />
                </Div>
            </Div>
        </Modal>
    );
}
