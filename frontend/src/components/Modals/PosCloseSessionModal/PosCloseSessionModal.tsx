'use client';

import { useMemo, useState } from 'react';
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

interface CashDenomination {
    id: string;
    label: string;
    millimes: number;
    type: 'bill' | 'coin';
}

const TUNISIAN_DENOMINATIONS: CashDenomination[] = [
    // Billets
    { id: 'b50', label: '50 DT', millimes: 50_000, type: 'bill' },
    { id: 'b20', label: '20 DT', millimes: 20_000, type: 'bill' },
    { id: 'b10', label: '10 DT', millimes: 10_000, type: 'bill' },
    { id: 'b5', label: '5 DT', millimes: 5_000, type: 'bill' },
    // Pièces
    { id: 'c2', label: '2 DT', millimes: 2_000, type: 'coin' },
    { id: 'c1', label: '1 DT', millimes: 1_000, type: 'coin' },
    { id: 'c05', label: '500 millimes', millimes: 500, type: 'coin' },
    { id: 'c02', label: '200 millimes', millimes: 200, type: 'coin' },
    { id: 'c01', label: '100 millimes', millimes: 100, type: 'coin' },
    { id: 'c005', label: '50 millimes', millimes: 50, type: 'coin' },
    { id: 'c002', label: '20 millimes', millimes: 20, type: 'coin' },
];

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
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const [counted, setCounted] = useState('');
    const [note, setNote] = useState('');
    const [syncDailyIncome, setSyncDailyIncome] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [showCalculator, setShowCalculator] = useState(false);

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['pos-session-summary', sessionId],
        queryFn: () => fetchPosSessionSummary(sessionId),
    });

    const calculatedTotalMillimes = useMemo(() => {
        return TUNISIAN_DENOMINATIONS.reduce(
            (sum, d) => sum + (counts[d.id] || 0) * d.millimes,
            0,
        );
    }, [counts]);

    const calculatedTotalDT = calculatedTotalMillimes / 1000;
    const hasAnyCounts = calculatedTotalMillimes > 0;

    const updateCount = (id: string, delta: number) => {
        setCounts((prev) => {
            const current = prev[id] || 0;
            const next = Math.max(0, current + delta);
            const updated = { ...prev, [id]: next };
            const totalM = TUNISIAN_DENOMINATIONS.reduce(
                (sum, d) => sum + (updated[d.id] || 0) * d.millimes,
                0,
            );
            setCounted((totalM / 1000).toFixed(3));
            if (error) setError(null);
            return updated;
        });
    };

    const setCountDirect = (id: string, valueStr: string) => {
        const clean = valueStr.replace(/\D/g, '');
        const parsed = clean === '' ? 0 : parseInt(clean, 10);
        const count = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
        setCounts((prev) => {
            const updated = { ...prev, [id]: count };
            const totalM = TUNISIAN_DENOMINATIONS.reduce(
                (sum, d) => sum + (updated[d.id] || 0) * d.millimes,
                0,
            );
            setCounted((totalM / 1000).toFixed(3));
            if (error) setError(null);
            return updated;
        });
    };

    const resetCounts = () => {
        setCounts({});
        setCounted('0.000');
        if (error) setError(null);
    };

    const countedValue = Number(counted.replace(',', '.'));
    const hasCounted = counted.trim() !== '' && Number.isFinite(countedValue) && countedValue >= 0;
    const difference = summary && hasCounted ? round3(countedValue - summary.openingCash) : null;

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
        <Modal
            title={t('title')}
            subTitle={t('subtitle')}
            canClose
            canCloseOnClickOutisde
            className="w-[min(94vw,620px)] max-h-[min(92dvh,820px)]"
        >
            <Div className="space-y-4">
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
                        <Div className="space-y-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                            {/* Step 1: Cash to put aside */}
                            <div className="flex items-center justify-between rounded-xl border border-warning-200 bg-warning-50/70 p-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-warning-600 text-white text-xs font-black shadow-2xs">
                                        1
                                    </span>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-900">
                                            {t('cashToSetAsideTitle')}
                                        </span>
                                        <span className="block text-[11px] text-gray-600">
                                            {t('cashToSetAsideSubtitle')}
                                        </span>
                                    </div>
                                </div>
                                <span className="rounded-lg bg-white border border-warning-300 px-2.5 py-1 text-sm font-black text-warning-800 tabular-nums shadow-2xs shrink-0">
                                    + {formatMoney(summary.cashPayments)}
                                </span>
                            </div>

                            {/* Step 2: Remaining float to count */}
                            <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-xs font-black shadow-2xs">
                                            2
                                        </span>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-900">
                                                {t('floatRemainingTitle')}
                                            </span>
                                            <span className="block text-[11px] text-gray-500">
                                                {t('floatRemainingSubtitle')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-end shrink-0">
                                        <span className="block text-[10px] uppercase font-bold text-gray-500">
                                            {t('expectedFloat')}
                                        </span>
                                        <span className="text-sm font-black text-primary-900 tabular-nums bg-white border border-primary-200 px-2.5 py-0.5 rounded-lg shadow-2xs inline-block">
                                            {formatMoney(summary.openingCash)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Counted input header with Calculator Toggle */}
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-bold text-gray-800">
                                    {t('countedFloat')} *
                                </span>
                                <button
                                    type="button"
                                    id="pos-toggle-cash-calculator"
                                    onClick={() => setShowCalculator((prev) => !prev)}
                                    className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50/70 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 hover:text-primary-800 transition-colors cursor-pointer shadow-2xs"
                                >
                                    <Icon
                                        name={showCalculator ? IconComponentsEnum.chevronUp : IconComponentsEnum.chevronDown}
                                        size={ESize.xs}
                                        color="text-primary-700"
                                    />
                                    {showCalculator ? t('calculatorToggleClose') : t('calculatorToggleOpen')}
                                </button>
                            </div>

                            <Div className="grid grid-cols-1 items-end gap-3 min-[400px]:grid-cols-2">
                                <Input
                                    id="pos-close-counted"
                                    value={counted}
                                    type={EInputType.number}
                                    onChange={(e) => {
                                        setCounted(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    required
                                    error={!!error}
                                    hintText={error ?? undefined}
                                />
                                <Div className="flex flex-col items-start pb-2 min-[400px]:items-end min-[400px]:text-end">
                                    <span className="text-xs font-semibold uppercase text-gray-500">{t('differenceOnFloat')}</span>
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

                            {/* Denominations Calculator Panel */}
                            {showCalculator && (
                                <div className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/20 p-3 sm:p-4 transition-all">
                                    <div className="flex items-center justify-between gap-2 border-b border-primary-100 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex size-7 items-center justify-center rounded-lg bg-primary-600 text-white shadow-2xs">
                                                <Icon name={IconComponentsEnum.squaresFour} size={ESize.xs} color="text-white" />
                                            </div>
                                            <div>
                                                <span className="block text-xs font-bold text-gray-900">{t('calculatorTitle')}</span>
                                                <span className="block text-[11px] text-gray-500">{t('calculatorSubtitle')}</span>
                                            </div>
                                        </div>
                                        {hasAnyCounts && (
                                            <button
                                                type="button"
                                                onClick={resetCounts}
                                                className="text-xs font-semibold text-danger-600 hover:text-danger-800 hover:bg-danger-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                            >
                                                {t('reset')}
                                            </button>
                                        )}
                                    </div>

                                    {/* Denominations List: 2-row layout per card prevents truncation and overlap */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pe-1">
                                        {TUNISIAN_DENOMINATIONS.map((d) => {
                                            const count = counts[d.id] || 0;
                                            const subtotal = (count * d.millimes) / 1000;
                                            const isBill = d.type === 'bill';

                                            return (
                                                <div
                                                    key={d.id}
                                                    className={twMerge(
                                                        'flex flex-col gap-2 rounded-xl border p-2.5 transition-all bg-white shadow-2xs',
                                                        count > 0
                                                            ? 'border-primary-400 bg-primary-50/40 ring-1 ring-primary-300'
                                                            : 'border-gray-200 hover:border-gray-300',
                                                    )}
                                                >
                                                    {/* Card Top: Denomination Badge & Subtotal */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span
                                                            className={twMerge(
                                                                'inline-flex items-center font-bold text-xs px-2.5 py-1 rounded-lg shrink-0 shadow-2xs',
                                                                isBill
                                                                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                                                    : 'bg-amber-50 text-amber-900 border border-amber-200',
                                                            )}
                                                        >
                                                            {d.label}
                                                        </span>
                                                        <span
                                                            className={twMerge(
                                                                'text-xs tabular-nums font-bold shrink-0',
                                                                count > 0 ? 'text-primary-800 font-extrabold' : 'text-gray-400 font-medium',
                                                            )}
                                                        >
                                                            {formatMoney(subtotal)}
                                                        </span>
                                                    </div>

                                                    {/* Card Bottom: Stepper Controls */}
                                                    <div className="flex items-center justify-center gap-1.5 pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCount(d.id, -1)}
                                                            disabled={count <= 0}
                                                            aria-label={`Diminuer ${d.label}`}
                                                            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-base font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors active:scale-95"
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            value={count === 0 ? '' : count}
                                                            placeholder="0"
                                                            onChange={(e) => setCountDirect(d.id, e.target.value)}
                                                            aria-label={`Quantité ${d.label}`}
                                                            className="h-8 flex-1 max-w-[80px] text-center font-black tabular-nums text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCount(d.id, 1)}
                                                            aria-label={`Augmenter ${d.label}`}
                                                            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary-200 bg-primary-50 text-base font-bold text-primary-700 hover:bg-primary-100 cursor-pointer transition-colors active:scale-95"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Calculator Summary Footer */}
                                    <div className="flex items-center justify-between border-t border-primary-100 pt-2 text-xs">
                                        <span className="text-gray-600 font-medium">
                                            {t('totalCalculated')} :{' '}
                                            <span className="font-black text-primary-900 text-sm tabular-nums">
                                                {formatMoney(calculatedTotalDT)}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCounted(calculatedTotalDT.toFixed(3));
                                                if (error) setError(null);
                                            }}
                                            className="text-xs font-bold text-primary-700 hover:text-primary-800 hover:underline cursor-pointer"
                                        >
                                            {t('applyCounted')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Div>

                        <Div
                            className={twMerge(
                                'rounded-2xl border p-4 transition-colors',
                                syncDailyIncome
                                    ? 'border-primary-200 bg-primary-50/70'
                                    : 'border-gray-200 bg-gray-50',
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
