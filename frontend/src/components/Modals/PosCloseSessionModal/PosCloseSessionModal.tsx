'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType, ESize, EVariantLabel } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { fetchPosSessionSummary, round3 } from '@/lib/pos-api';
import type { ELabelColor } from '@/theme/labelColors';

interface PosCloseSessionModalProps {
    sessionId: string;
    onSubmit: (values: { countedCash: number; note?: string }) => void;
    isLoading?: boolean;
}

function SummaryRow({
    label,
    value,
    muted = false,
}: Readonly<{ label: string; value: string; muted?: boolean }>) {
    return (
        <Div className="flex items-center justify-between gap-3 py-1">
            <Label variant={EVariantLabel.bodySmall} color={muted ? 'text-gray-500' : 'text-gray-900'}>
                {label}
            </Label>
            <Label
                variant={EVariantLabel.bodySmall}
                color={muted ? 'text-gray-500' : 'text-gray-900'}
                className="tabular-nums"
            >
                {value}
            </Label>
        </Div>
    );
}

function differenceColor(value: number): ELabelColor {
    if (value === 0) return 'text-success-700';
    return value > 0 ? 'text-primary-600' : 'text-danger-600';
}

export default function PosCloseSessionModal({
    sessionId,
    onSubmit,
    isLoading = false,
}: Readonly<PosCloseSessionModalProps>) {
    const t = useTranslations('pos.close');
    const tMethod = useTranslations('pos.methods');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const [counted, setCounted] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['pos-session-summary', sessionId],
        queryFn: () => fetchPosSessionSummary(sessionId),
    });

    const countedValue = Number(counted.replace(',', '.'));
    const hasCounted = counted.trim() !== '' && Number.isFinite(countedValue) && countedValue >= 0;
    const difference = summary && hasCounted ? round3(countedValue - summary.expectedCash) : null;

    const handleSubmit = () => {
        if (!hasCounted) {
            setError(t('countedRequired'));
            return;
        }
        setError(null);
        onSubmit({ countedCash: countedValue, note: note.trim() || undefined });
    };

    return (
        <Modal title={t('title')} subTitle={t('subtitle')} canClose canCloseOnClickOutisde className="w-[min(94vw,600px)]">
            <Div className="space-y-5">
                {summaryLoading || !summary ? (
                    <Div className="flex justify-center py-10">
                        <Spinner size={ESize.lg} color="text-primary-500" />
                    </Div>
                ) : (
                    <>
                        <Div className="rounded-xl bg-gray-50 px-4 py-3">
                            <Label variant={EVariantLabel.subtitle} color="text-gray-900">
                                {t('ordersTotal', {
                                    count: summary.ordersCount,
                                    total: formatMoney(summary.ordersTotal),
                                })}
                            </Label>
                            {summary.refundsCount > 0 ? (
                                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                                    {t('refundsCount', { count: summary.refundsCount })}
                                </Label>
                            ) : null}
                        </Div>

                        <Div className="space-y-2 rounded-xl border border-gray-100 p-4">
                            <Div className="flex items-center justify-between gap-3">
                                <Label variant={EVariantLabel.subtitle} color="text-gray-900">
                                    {tMethod('CASH')}
                                </Label>
                                <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="tabular-nums">
                                    {formatMoney(summary.expectedCash)}
                                </Label>
                            </Div>
                            <Div className="border-s-2 border-gray-100 ps-3">
                                <SummaryRow label={t('opening')} value={formatMoney(summary.openingCash)} muted />
                                <SummaryRow
                                    label={t('cashPayments')}
                                    value={`+ ${formatMoney(summary.cashPayments)}`}
                                    muted
                                />
                            </Div>
                            <Div className="grid grid-cols-2 items-end gap-3 pt-2">
                                <Input
                                    id="pos-close-counted"
                                    label={t('counted')}
                                    value={counted}
                                    type={EInputType.number}
                                    onChange={(e) => setCounted(e.target.value)}
                                    required
                                    error={!!error}
                                    hintText={error ?? undefined}
                                />
                                <Div className="flex flex-col items-end pb-2 text-end">
                                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                                        {t('difference')}
                                    </Label>
                                    <Label
                                        variant={EVariantLabel.h6}
                                        color={difference === null ? 'text-gray-400' : differenceColor(difference)}
                                        className="tabular-nums"
                                    >
                                        {difference === null ? '—' : formatMoney(difference)}
                                    </Label>
                                </Div>
                            </Div>
                        </Div>

                        {summary.revenue > 0 ? (
                            <Div className="flex items-center justify-between gap-3 rounded-xl bg-primary-50 px-4 py-3">
                                <Label variant={EVariantLabel.bodySmall} color="text-primary-700">
                                    {t('dailyIncome')}
                                </Label>
                                <Label variant={EVariantLabel.subtitle} color="text-primary-700" className="tabular-nums">
                                    {formatMoney(summary.revenue)}
                                </Label>
                            </Div>
                        ) : null}

                        <Input
                            id="pos-close-note"
                            label={t('note')}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            isTextArea
                            rows={3}
                        />
                    </>
                )}

                <Div className="flex gap-3">
                    <Button
                        id="pos-close-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="pos-close-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={t('submit')}
                        isLoading={isLoading}
                        disabled={!summary}
                        onClick={handleSubmit}
                        className="flex-1"
                    />
                </Div>
            </Div>
        </Modal>
    );
}
