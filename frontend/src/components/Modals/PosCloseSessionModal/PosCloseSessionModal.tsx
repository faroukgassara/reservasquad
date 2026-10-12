'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Toggle from '@/components/Primitives/Toggle/Toggle';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { fetchPosSessionSummary, round3 } from '@/lib/pos-api';
import type { ELabelColor } from '@/theme/labelColors';

interface PosCloseSessionModalProps {
    sessionId: string;
    onSubmit: (values: { countedCash: number; note?: string; syncDailyIncome: boolean }) => void;
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
    const [syncDailyIncome, setSyncDailyIncome] = useState(false);
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
        onSubmit({
            countedCash: countedValue,
            note: note.trim() || undefined,
            syncDailyIncome,
        });
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
                        {/* Top Session Stats Banner */}
                        <Div className="flex items-center justify-between rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50/80 to-primary-100/60 p-4 shadow-2xs">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/25">
                                    <Icon name={IconComponentsEnum.filetext} size={ESize.sm} color="text-white" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">
                                        {t('ordersTotal', {
                                            count: summary.ordersCount,
                                            total: formatMoney(summary.ordersTotal),
                                        })}
                                    </div>
                                    {summary.refundsCount > 0 ? (
                                        <div className="text-xs font-semibold text-danger-600">
                                            {t('refundsCount', { count: summary.refundsCount })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500">Activité de la session en cours</div>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-xl bg-white px-3 py-1.5 shadow-2xs border border-primary-100">
                                <span className="text-sm font-black text-primary-900 tabular-nums">
                                    {formatMoney(summary.ordersTotal)}
                                </span>
                            </div>
                        </Div>

                        {/* Cash Drawer Reconciliation */}
                        <Div className="space-y-3 rounded-2xl border-2 border-success-100 bg-gradient-to-b from-white to-success-50/20 p-4 shadow-2xs">
                            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-success-500 text-white shadow-sm shadow-success-500/25">
                                        <Icon name={IconComponentsEnum.layers} size={ESize.sm} color="text-white" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">{tMethod('CASH')} attendu</div>
                                        <div className="text-xs text-gray-500">Tiroir-caisse théorique</div>
                                    </div>
                                </div>
                                <div className="text-xl font-black text-success-800 tabular-nums">
                                    {formatMoney(summary.expectedCash)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50/80 p-2.5 text-xs">
                                <div>
                                    <span className="text-gray-500">{t('opening')} :</span>
                                    <span className="ms-1 font-bold text-gray-900 tabular-nums">
                                        {formatMoney(summary.openingCash)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">{t('cashPayments')} :</span>
                                    <span className="ms-1 font-bold text-success-700 tabular-nums">
                                        + {formatMoney(summary.cashPayments)}
                                    </span>
                                </div>
                            </div>

                            <Div className="grid grid-cols-1 items-end gap-3 pt-1 min-[400px]:grid-cols-2">
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
                                <Div className="flex flex-col items-start pb-2 min-[400px]:items-end min-[400px]:text-end">
                                    <span className="text-xs font-semibold uppercase text-gray-500">{t('difference')}</span>
                                    {difference === null ? (
                                        <span className="mt-1 rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-400">
                                            —
                                        </span>
                                    ) : difference === 0 ? (
                                        <span className="mt-1 rounded-xl bg-success-100 border border-success-300 px-3 py-1 text-xs font-black text-success-800">
                                            0,000 DT · Parfait ✓
                                        </span>
                                    ) : difference > 0 ? (
                                        <span className="mt-1 rounded-xl bg-primary-100 border border-primary-300 px-3 py-1 text-xs font-black text-primary-800">
                                            +{formatMoney(difference)} · Excédent
                                        </span>
                                    ) : (
                                        <span className="mt-1 rounded-xl bg-danger-100 border border-danger-300 px-3 py-1 text-xs font-black text-danger-800">
                                            {formatMoney(difference)} · Déficit
                                        </span>
                                    )}
                                </Div>
                            </Div>
                        </Div>

                        <Div
                            className={twMerge(
                                'rounded-2xl border p-4 transition-colors',
                                syncDailyIncome
                                    ? 'border-primary-200 bg-primary-50/70 dark:border-primary-900/60 dark:bg-primary-950/40'
                                    : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50',
                            )}
                        >
                            <Div className="flex items-center justify-between gap-3">
                                <Div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <Label
                                        variant={EVariantLabel.subtitle}
                                        color={syncDailyIncome ? 'text-primary-900' : 'text-gray-700'}
                                    >
                                        {t('syncDailyIncome')}
                                    </Label>
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color={syncDailyIncome ? 'text-primary-700' : 'text-gray-500'}
                                    >
                                        {syncDailyIncome
                                            ? t('syncDailyIncomeActive', { total: formatMoney(summary.revenue) })
                                            : t('syncDailyIncomeInactive')}
                                    </Label>
                                </Div>
                                <Div className="flex shrink-0 items-center gap-3">
                                    <Label
                                        variant={EVariantLabel.subtitle}
                                        color={syncDailyIncome ? 'text-primary-700' : 'text-gray-400'}
                                        className="tabular-nums font-semibold"
                                    >
                                        {formatMoney(summary.revenue)}
                                    </Label>
                                    <Toggle
                                        id="pos-close-sync-daily-income"
                                        checked={syncDailyIncome}
                                        onChange={setSyncDailyIncome}
                                    />
                                </Div>
                            </Div>
                        </Div>

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

                <Div className="flex gap-3 pt-2">
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
                        className="flex-1 font-bold"
                    />
                </Div>
            </Div>
        </Modal>
    );
}
