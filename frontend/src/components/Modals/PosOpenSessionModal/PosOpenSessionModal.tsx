'use client';

import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType } from '@/Enum/Enum';

interface PosOpenSessionModalProps {
    defaultOpeningCash?: number;
    onSubmit: (openingCash: number) => Promise<void>;
    isLoading?: boolean;
}

export default function PosOpenSessionModal({
    defaultOpeningCash = 0,
    onSubmit,
    isLoading = false,
}: Readonly<PosOpenSessionModalProps>) {
    const t = useTranslations('pos.session');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();

    const form = useForm({
        defaultValues: { openingCash: String(defaultOpeningCash) },
        onSubmit: async ({ value }) => {
            await onSubmit(Number(value.openingCash.replace(',', '.')));
        },
    });

    return (
        <Modal title={t('openTitle')} subTitle={t('openSubtitle')} canClose canCloseOnClickOutisde>
            <Div className="space-y-4">
                <form.Field
                    name="openingCash"
                    validators={{
                        onSubmit: ({ value }) => {
                            const amount = Number(value.replace(',', '.'));
                            return Number.isFinite(amount) && amount >= 0 ? undefined : t('invalidAmount');
                        },
                    }}
                >
                    {({ state, handleChange }) => (
                        <Input
                            id="pos-opening-cash"
                            label={t('openingCash')}
                            value={state.value}
                            type={EInputType.number}
                            onChange={(e) => handleChange(e.target.value)}
                            required
                            hintText={state.meta.errors?.[0] ? String(state.meta.errors[0]) : undefined}
                            error={!!state.meta.errors?.length}
                        />
                    )}
                </form.Field>
                <Div className="flex gap-3 pt-2">
                    <Button
                        id="pos-open-session-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="pos-open-session-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={t('open')}
                        isLoading={isLoading}
                        onClick={() => form.handleSubmit()}
                        className="flex-1"
                    />
                </Div>
            </Div>
        </Modal>
    );
}
