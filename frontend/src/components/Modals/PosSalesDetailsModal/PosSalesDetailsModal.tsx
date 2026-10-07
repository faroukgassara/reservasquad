'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import { useCurrentModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { usePosPdfLabels } from '@/hooks/usePosPdfLabels';
import { fetchSalesDetails } from '@/lib/pos-api';
import { printSalesDetailsPdf } from '@/lib/pos-documents-pdf';
import { EButtonSize, EButtonType, EInputType, ESize, EToastType, IconComponentsEnum } from '@/Enum/Enum';

interface PosSalesDetailsModalProps {
    /** Pre-fills the period with this session; the report then covers exactly its orders. */
    session?: { id: string; openedAt: string; closedAt: string | null };
}

function toLocalInput(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function PosSalesDetailsModal({ session }: Readonly<PosSalesDetailsModalProps>) {
    const t = useTranslations('pos.reports');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const { openToast } = useToast();
    const pdfLabels = usePosPdfLabels();

    const [{ defaultFrom, defaultTo }] = useState(() => ({
        defaultFrom: toLocalInput(session ? new Date(session.openedAt) : startOfToday()),
        defaultTo: toLocalInput(session?.closedAt ? new Date(session.closedAt) : new Date()),
    }));

    const printMutation = useMutation({
        mutationFn: async ({ from, to }: { from: string; to: string }) => {
            const bySession = session && from === defaultFrom && to === defaultTo;
            const report = await fetchSalesDetails(
                bySession
                    ? { sessionId: session.id }
                    : { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
            );
            await printSalesDetailsPdf(report, pdfLabels);
        },
        onSuccess: closeModal,
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const form = useForm({
        defaultValues: { from: defaultFrom, to: defaultTo },
        onSubmit: async ({ value }) => {
            await printMutation.mutateAsync(value);
        },
    });

    return (
        <Modal title={t('title')} subTitle={t('subtitle')} canClose canCloseOnClickOutisde className="w-[min(94vw,520px)]">
            <Div className="space-y-4">
                <form.Field name="from" validators={{ onSubmit: ({ value }) => (value ? undefined : t('dateRequired')) }}>
                    {({ state, handleChange }) => (
                        <Input
                            id="sales-details-from"
                            label={t('from')}
                            type={EInputType.datetimeLocal}
                            value={state.value}
                            onChange={(e) => handleChange(e.target.value)}
                            required
                            hintText={state.meta.errors?.[0] ? String(state.meta.errors[0]) : undefined}
                            error={!!state.meta.errors?.length}
                        />
                    )}
                </form.Field>
                <form.Field
                    name="to"
                    validators={{
                        onSubmit: ({ value, fieldApi }) => {
                            if (!value) return t('dateRequired');
                            return value < fieldApi.form.getFieldValue('from') ? t('invalidRange') : undefined;
                        },
                    }}
                >
                    {({ state, handleChange }) => (
                        <Input
                            id="sales-details-to"
                            label={t('to')}
                            type={EInputType.datetimeLocal}
                            value={state.value}
                            onChange={(e) => handleChange(e.target.value)}
                            required
                            hintText={state.meta.errors?.[0] ? String(state.meta.errors[0]) : undefined}
                            error={!!state.meta.errors?.length}
                        />
                    )}
                </form.Field>
                <Div className="flex gap-3 pt-2">
                    <Button
                        id="sales-details-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="sales-details-print"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.printer, size: ESize.sm, color: 'text-white' }}
                        text={t('print')}
                        isLoading={printMutation.isPending}
                        onClick={() => form.handleSubmit()}
                        className="flex-1"
                    />
                </Div>
            </Div>
        </Modal>
    );
}
