'use client';

import { useMemo, useState, type ReactNode } from 'react';
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
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { fetchPosSessionSummary, round3 } from '@/lib/pos-api';
import type { ELabelColor } from '@/theme/labelColors';

interface PosCloseSessionModalProps {
    sessionId: string;
    onSubmit: (values: { countedCash: number; note?: string }) => void;
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
];

const STEPPER_BUTTON =
    'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border text-lg font-semibold transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:size-9';

function differenceColor(value: number): ELabelColor {
    if (value === 0) return 'text-success-700';
    return value > 0 ? 'text-primary-600' : 'text-danger-600';
}

function StepBadge({ step, className }: Readonly<{ step: number; className: string }>) {
    return (
        <Div className={twMerge('flex size-6 shrink-0 items-center justify-center rounded-full', className)}>
            <Label variant={EVariantLabel.caption} color="text-white" className="font-bold leading-none">
                {step}
            </Label>
        </Div>
    );
}

function StepHeader({
    step,
    badgeClassName,
    title,
    subtitle,
    aside,
}: Readonly<{ step: number; badgeClassName: string; title: string; subtitle: string; aside: ReactNode }>) {
    return (
        <Div className="flex items-start justify-between gap-3">
            <Div className="flex min-w-0 items-start gap-2.5">
                <StepBadge step={step} className={badgeClassName} />
                <Div className="flex min-w-0 flex-col">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold">
                        {title}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {subtitle}
                    </Label>
                </Div>
            </Div>
            <Div className="shrink-0 text-end">{aside}</Div>
        </Div>
    );
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
        });
    };

    const renderDifference = () => {
        if (difference === null) return null;
        let boxClassName = 'border-success-200 bg-success-50';
        let status = t('differencePerfect');
        if (difference > 0) {
            boxClassName = 'border-primary-200 bg-primary-50';
            status = t('differenceSurplus');
        } else if (difference < 0) {
            boxClassName = 'border-danger-200 bg-danger-50';
            status = t('differenceDeficit');
        }
        const color = differenceColor(difference);
        return (
            <Div
                role="status"
                className={twMerge('flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5', boxClassName)}
            >
                <Div className="flex min-w-0 items-center gap-2">
                    <Icon
                        name={difference === 0 ? IconComponentsEnum.checkCircle : IconComponentsEnum.alert}
                        size={ESize.sm}
                        color={color}
                        className="shrink-0"
                    />
                    <Div className="flex min-w-0 flex-col">
                        <Label variant={EVariantLabel.caption} color="text-gray-600">
                            {t('differenceOnFloat')}
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color={color} className="font-semibold">
                            {status}
                        </Label>
                    </Div>
                </Div>
                <Label variant={EVariantLabel.subtitle} color={color} className="shrink-0 font-semibold tabular-nums">
                    {difference > 0 ? `+${formatMoney(difference)}` : formatMoney(difference)}
                </Label>
            </Div>
        );
    };

    const renderDenomination = (d: CashDenomination) => {
        const count = counts[d.id] || 0;
        const subtotal = (count * d.millimes) / 1000;
        return (
            <Div
                key={d.id}
                className={twMerge(
                    'flex items-center gap-2 rounded-xl border bg-white p-2 transition-colors',
                    count > 0 ? 'border-primary-300 bg-primary-50/40' : 'border-gray-200',
                )}
            >
                <Div className="flex min-w-0 flex-1 flex-col">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-semibold">
                        {d.label}
                    </Label>
                    <Label
                        variant={EVariantLabel.caption}
                        color={count > 0 ? 'text-primary-700' : 'text-gray-400'}
                        className="tabular-nums"
                    >
                        {formatMoney(subtotal)}
                    </Label>
                </Div>
                <Div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={() => updateCount(d.id, -1)}
                        disabled={count <= 0}
                        aria-label={t('decrease', { label: d.label })}
                        className={twMerge(STEPPER_BUTTON, 'border-gray-200 bg-gray-50 text-gray-700 enabled:hover:bg-gray-100')}
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
                        aria-label={t('quantity', { label: d.label })}
                        className="h-11 w-14 rounded-lg border border-gray-200 bg-white text-center text-base font-semibold tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:h-9 sm:w-12 sm:text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => updateCount(d.id, 1)}
                        aria-label={t('increase', { label: d.label })}
                        className={twMerge(STEPPER_BUTTON, 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100')}
                    >
                        +
                    </button>
                </Div>
            </Div>
        );
    };

    const denominationGroups = [
        { key: 'bills', title: t('bills'), items: TUNISIAN_DENOMINATIONS.filter((d) => d.type === 'bill') },
        { key: 'coins', title: t('coins'), items: TUNISIAN_DENOMINATIONS.filter((d) => d.type === 'coin') },
    ];

    return (
        <Modal
            title={t('title')}
            subTitle={t('subtitle')}
            canClose
            canCloseOnClickOutisde
            className="w-[min(94vw,620px)] max-h-[min(92dvh,820px)]"
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:p-0"
        >
            <Div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6 sm:px-6 sm:pt-5 sm:pb-8 space-y-4">
                {summaryLoading || !summary ? (
                    <Div className="flex justify-center py-10">
                        <Spinner size={ESize.lg} color="text-primary-500" />
                    </Div>
                ) : (
                    <>
                        <Div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                            <Div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                                <Icon name={IconComponentsEnum.layers} size={ESize.sm} color="text-primary-600" />
                            </Div>
                            <Div className="flex min-w-0 flex-1 flex-col">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold">
                                    {t('cashInDrawer')}
                                </Label>
                                <Label variant={EVariantLabel.caption} color="text-gray-500" className="tabular-nums">
                                    {`${t('openingPlusCash')} : ${formatMoney(summary.openingCash)} + ${formatMoney(summary.cashPayments)}`}
                                </Label>
                            </Div>
                            <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="shrink-0 font-semibold tabular-nums">
                                {formatMoney(summary.expectedCash)}
                            </Label>
                        </Div>

                        <Div className="rounded-xl border border-warning-200 bg-warning-50 p-3">
                            <StepHeader
                                step={1}
                                badgeClassName="bg-warning-600"
                                title={t('cashToSetAsideTitle')}
                                subtitle={t('cashToSetAsideSubtitle')}
                                aside={
                                    <Label variant={EVariantLabel.subtitle} color="text-warning-800" className="font-semibold tabular-nums">
                                        {`+ ${formatMoney(summary.cashPayments)}`}
                                    </Label>
                                }
                            />
                        </Div>

                        <Div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                            <StepHeader
                                step={2}
                                badgeClassName="bg-primary-600"
                                title={t('floatRemainingTitle')}
                                subtitle={t('floatRemainingSubtitle')}
                                aside={
                                    <>
                                        <Label variant={EVariantLabel.overline} color="text-gray-500" className="block">
                                            {t('expectedFloat')}
                                        </Label>
                                        <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="font-semibold tabular-nums">
                                            {formatMoney(summary.openingCash)}
                                        </Label>
                                    </>
                                }
                            />

                            <Input
                                id="pos-close-counted"
                                label={t('countedFloat')}
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

                            {renderDifference()}

                            <button
                                type="button"
                                id="pos-toggle-cash-calculator"
                                aria-expanded={showCalculator}
                                aria-controls="pos-cash-calculator"
                                onClick={() => setShowCalculator((prev) => !prev)}
                                className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed border-primary-300 px-3 py-2 text-start transition-colors hover:bg-primary-50 sm:min-h-10"
                            >
                                <Div className="flex items-center gap-2">
                                    <Icon name={IconComponentsEnum.squaresFour} size={ESize.sm} color="text-primary-600" />
                                    <Label variant={EVariantLabel.bodySmall} color="text-primary-700" className="font-semibold">
                                        {showCalculator ? t('calculatorToggleClose') : t('calculatorToggleOpen')}
                                    </Label>
                                </Div>
                                <Icon
                                    name={showCalculator ? IconComponentsEnum.chevronUp : IconComponentsEnum.chevronDown}
                                    size={ESize.sm}
                                    color="text-primary-600"
                                    className="shrink-0"
                                />
                            </button>

                            {showCalculator ? (
                                <Div id="pos-cash-calculator" className="space-y-4 rounded-xl bg-gray-50 p-3">
                                    <Div className="flex items-center justify-between gap-2">
                                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                                            {t('calculatorSubtitle')}
                                        </Label>
                                        {hasAnyCounts ? (
                                            <button
                                                type="button"
                                                onClick={resetCounts}
                                                className="min-h-11 shrink-0 cursor-pointer rounded-md px-2 transition-colors hover:bg-danger-50 sm:min-h-0 sm:py-1"
                                            >
                                                <Label variant={EVariantLabel.caption} color="text-danger-600" className="font-semibold">
                                                    {t('reset')}
                                                </Label>
                                            </button>
                                        ) : null}
                                    </Div>

                                    {denominationGroups.map((group) => (
                                        <Div key={group.key} className="space-y-2">
                                            <Label variant={EVariantLabel.overline} color="text-gray-500" className="block">
                                                {group.title}
                                            </Label>
                                            <Div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {group.items.map(renderDenomination)}
                                            </Div>
                                        </Div>
                                    ))}

                                    <Div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3">
                                        <Div className="flex items-baseline gap-2">
                                            <Label variant={EVariantLabel.caption} color="text-gray-600">
                                                {t('totalCalculated')}
                                            </Label>
                                            <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="font-semibold tabular-nums">
                                                {formatMoney(calculatedTotalDT)}
                                            </Label>
                                        </Div>
                                        <Button
                                            id="pos-close-apply-calculator"
                                            type={EButtonType.secondary}
                                            size={EButtonSize.small}
                                            text={t('applyCounted')}
                                            onClick={() => {
                                                setCounted(calculatedTotalDT.toFixed(3));
                                                if (error) setError(null);
                                            }}
                                        />
                                    </Div>
                                </Div>
                            ) : null}
                        </Div>


                        <Input
                            id="pos-close-note"
                            label={t('note')}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            isTextArea
                            rows={2}
                        />
                    </>
                )}
            </Div>

            <Div className="shrink-0 flex gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
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
        </Modal>
    );
}
