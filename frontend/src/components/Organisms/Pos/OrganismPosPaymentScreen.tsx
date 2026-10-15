'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import PosNumpad, { type PosNumpadKey } from '@/components/Organisms/Pos/PosNumpad';
import { usePosCart } from '@/contexts/PosCartContext';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { round3, type PosPaymentMethod } from '@/lib/pos-api';
import {
    applyNumpadKey,
    NUMPAD_BACKSPACE,
    NUMPAD_DECIMAL,
    parseNumpadBuffer,
} from '@/lib/pos-numpad';

interface PaymentLine {
    id: string;
    method: PosPaymentMethod;
    amount: number;
    /** Deposit rest: always covers what the other lines leave unpaid. */
    isRest?: boolean;
}

type PaymentOption = 'CASH' | 'CREDIT' | 'DEPOSIT';

interface IOrganismPosPaymentScreen {
    isSubmitting: boolean;
    onBack: () => void;
    onPickClient: () => void;
    onValidate: (payments: { method: PosPaymentMethod; amount: number }[]) => void;
}

const CLEAR_KEY = 'clear';
const OPTIONS: PaymentOption[] = ['CASH', 'CREDIT', 'DEPOSIT'];

const OPTION_CONFIG: Record<
    PaymentOption,
    {
        icon: IconComponentsEnum;
        borderClass: string;
        bgClass: string;
        badgeClass: string;
        badgeText: string;
    }
> = {
    CASH: {
        icon: IconComponentsEnum.layers,
        borderClass: 'border-success-200 hover:border-success-400 hover:shadow-success-500/10',
        bgClass: 'bg-gradient-to-br from-success-50/70 via-white to-white',
        badgeClass: 'bg-success-500 text-white shadow-success-500/25',
        badgeText: 'Comptant / Cash',
    },
    CREDIT: {
        icon: IconComponentsEnum.user,
        borderClass: 'border-warning-200 hover:border-warning-400 hover:shadow-warning-500/10',
        bgClass: 'bg-gradient-to-br from-warning-50/70 via-white to-white',
        badgeClass: 'bg-warning-500 text-white shadow-warning-500/25',
        badgeText: 'Compte client',
    },
    DEPOSIT: {
        icon: IconComponentsEnum.clock,
        borderClass: 'border-primary-200 hover:border-primary-400 hover:shadow-primary-500/10',
        bgClass: 'bg-gradient-to-br from-primary-50/70 via-white to-white',
        badgeClass: 'bg-primary-500 text-white shadow-primary-500/25',
        badgeText: 'Avance + reste',
    },
};

function newLineId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function OrganismPosPaymentScreen({
    isSubmitting,
    onBack,
    onPickClient,
    onValidate,
}: Readonly<IOrganismPosPaymentScreen>) {
    const t = useTranslations('pos.payment');
    const tMethod = useTranslations('pos.methods');
    const cart = usePosCart();
    const [lines, setLines] = useState<PaymentLine[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [buffer, setBuffer] = useState('');
    const [fresh, setFresh] = useState(true);

    const total = cart.total;
    const hasCreditPayment = cart.lines.some((l) => l.creditId);
    const options = hasCreditPayment ? OPTIONS.filter((o) => o === 'CASH') : OPTIONS;
    const coveredByOthers = round3(lines.filter((l) => !l.isRest).reduce((sum, l) => sum + l.amount, 0));
    const restAmount = round3(Math.max(0, total - coveredByOthers));
    const payments = lines.map((l) => (l.isRest ? { ...l, amount: restAmount } : l));
    const paid = round3(payments.reduce((sum, l) => sum + l.amount, 0));
    const nonCash = round3(payments.filter((l) => l.method !== 'CASH').reduce((sum, l) => sum + l.amount, 0));
    const remaining = round3(Math.max(0, total - paid));
    const change = round3(Math.max(0, paid - total));
    const needsClient = payments.some((l) => l.method === 'CLIENT_ACCOUNT' && l.amount > 0) && !cart.client;
    const nonCashTooHigh = nonCash > total + 0.0005;
    const paymentReady = paid + 0.0005 >= total && !nonCashTooHigh && !needsClient;
    const canValidate = paymentReady && !isSubmitting;

    const selectLine = (line: PaymentLine) => {
        if (line.isRest) return;
        setSelectedId(line.id);
        setBuffer(String(line.amount));
        setFresh(true);
    };

    const addOption = (option: PaymentOption) => {
        if (option === 'DEPOSIT') {
            const cashLine: PaymentLine = { id: newLineId(), method: 'CASH', amount: 0 };
            const restLine: PaymentLine = { id: newLineId(), method: 'CLIENT_ACCOUNT', amount: 0, isRest: true };
            setLines((prev) => [...prev.filter((l) => l.method !== 'CLIENT_ACCOUNT'), cashLine, restLine]);
            selectLine(cashLine);
        } else {
            const method: PosPaymentMethod = option === 'CREDIT' ? 'CLIENT_ACCOUNT' : 'CASH';
            const line: PaymentLine = { id: newLineId(), method, amount: remaining };
            setLines((prev) => [...prev, line]);
            selectLine(line);
        }
        if (option !== 'CASH' && !cart.client) onPickClient();
    };

    const removeLine = (id: string) => {
        setLines((prev) => prev.filter((l) => l.id !== id));
        if (selectedId === id) {
            setSelectedId(null);
            setBuffer('');
        }
    };

    const handleKey = (key: string) => {
        if (!selectedId) return;
        const next = key === CLEAR_KEY ? '' : applyNumpadKey(buffer, key, fresh);
        setBuffer(next);
        setFresh(false);
        const amount = Math.max(0, round3(parseNumpadBuffer(next)));
        setLines((prev) => prev.map((l) => (l.id === selectedId ? { ...l, amount } : l)));
    };

    const numpadRows: PosNumpadKey[][] = [
        [
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            {
                value: '+10',
                label: '+10',
                accent: true,
                className: 'bg-success-50 hover:bg-success-100 focus:bg-success-100 text-success-800 focus:text-success-800 border border-success-200/80 font-bold',
            },
        ],
        [
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: '6', label: '6' },
            {
                value: '+20',
                label: '+20',
                accent: true,
                className: 'bg-success-50 hover:bg-success-100 focus:bg-success-100 text-success-800 focus:text-success-800 border border-success-200/80 font-bold',
            },
        ],
        [
            { value: '7', label: '7' },
            { value: '8', label: '8' },
            { value: '9', label: '9' },
            {
                value: '+50',
                label: '+50',
                accent: true,
                className: 'bg-success-50 hover:bg-success-100 focus:bg-success-100 text-success-800 focus:text-success-800 border border-success-200/80 font-bold',
            },
        ],
        [
            {
                value: CLEAR_KEY,
                label: 'C',
                accent: true,
                className: 'bg-danger-50 hover:bg-danger-100 focus:bg-danger-100 text-danger-700 focus:text-danger-700 border border-danger-200/80 font-bold',
            },
            { value: '0', label: '0' },
            { value: NUMPAD_DECIMAL, label: ',' },
            {
                value: NUMPAD_BACKSPACE,
                label: '⌫',
                type: EButtonType.primary,
                className: 'bg-accent-500 hover:bg-accent-600 active:bg-accent-700 focus:bg-accent-500 focus:text-white focus:border-0 focus:outline-none text-white border-0 font-bold shadow-2xs',
            },
        ],
    ];

    const validate = () =>
        onValidate(
            payments
                .filter((l) => l.amount > 0)
                .map((l) => ({ method: l.method, amount: round3(l.amount) })),
        );

    const [clicked, setClicked] = useState(false);
    const isLoading = isSubmitting || clicked;

    useEffect(() => {
        if (!isSubmitting && clicked) {
            const timer = setTimeout(() => setClicked(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isSubmitting, clicked]);

    const handleValidate = () => {
        if (!paymentReady || isLoading) return;
        setClicked(true);
        validate();
    };

    return (
        <Div className="flex min-h-0 flex-1 flex-col bg-gray-50/60">
            {/* Header with back, title and highlighted Valider button */}
            <Div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-2xs">
                <Button
                    id="pos-payment-back"
                    type={EButtonType.secondary}
                    size={EButtonSize.medium}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.sm, color: 'text-primary-500' }}
                    text={t('back')}
                    onClick={onBack}
                    className="rtl:[&_svg]:-scale-x-100"
                />
                <div className="flex items-center gap-2">
                    <Label variant={EVariantLabel.h5} color="text-gray-900" className="truncate font-bold">
                        {t('title')}
                    </Label>
                    <span className="hidden sm:inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 border border-primary-200">
                        {cart.lines.length} articles
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
                        Total
                    </span>
                    <span className="text-base sm:text-lg font-black text-gray-900 tabular-nums">
                        {formatMoney(total)}
                    </span>
                </div>
            </Div>

            <Div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-3 sm:p-5 tablet:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[280px_minmax(0,1fr)_340px]">
                {/* Column 1: Payment Methods with colorful cards */}
                <Div className="grid grid-cols-2 gap-2.5 tablet:col-start-1 tablet:row-start-1 lg:grid-cols-1 lg:content-start">
                    <Label variant={EVariantLabel.overline} color="text-gray-500" className="col-span-full font-bold uppercase tracking-wider">
                        {t('methods')}
                    </Label>
                    {options.map((option) => {
                        const cfg = OPTION_CONFIG[option];
                        return (
                            <button
                                key={option}
                                id={`pos-payment-option-${option}`}
                                type="button"
                                onClick={() => addOption(option)}
                                className={twMerge(
                                    'group relative flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-start shadow-2xs transition-all duration-200 hover:shadow-md active:scale-[0.99] cursor-pointer',
                                    cfg.borderClass,
                                    cfg.bgClass,
                                )}
                            >
                                <div
                                    className={twMerge(
                                        'flex size-11 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-105',
                                        cfg.badgeClass,
                                    )}
                                >
                                    <Icon name={cfg.icon} size={ESize.sm} color="text-white" />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-bold text-gray-900">
                                        {t(`options.${option}`)}
                                    </span>
                                    <span className="truncate text-xs font-medium text-gray-500">
                                        {cfg.badgeText}
                                    </span>
                                </div>
                                <div className="shrink-0 text-gray-400 group-hover:text-gray-700 rtl:-scale-x-100">
                                    <Icon name={IconComponentsEnum.chevronRight} size={ESize.sm} color="text-gray-400" />
                                </div>
                            </button>
                        );
                    })}
                </Div>

                {/* Column 2: Total due, payments summary, payment lines and PROMINENT VALIDER CTA */}
                <Div className="flex min-w-0 flex-col gap-4 tablet:col-start-1 tablet:row-start-2 lg:col-start-2 lg:row-start-1">
                    {/* Summary Card */}
                    <Div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 text-center shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            {t('totalDue')}
                        </span>
                        <div className="mt-1 text-3xl font-black text-gray-900 tabular-nums sm:text-5xl">
                            {formatMoney(total)}
                        </div>

                        {/* Status split cards: Remaining & Change */}
                        <Div className="mt-4 grid grid-cols-2 gap-3">
                            <Div
                                className={twMerge(
                                    'flex flex-col items-center justify-center rounded-xl p-3 border transition-colors',
                                    remaining > 0
                                        ? 'border-danger-200 bg-danger-50/70 text-danger-700'
                                        : 'border-success-200 bg-success-50/70 text-success-700',
                                )}
                            >
                                <span className="text-xs font-semibold uppercase tracking-wider">
                                    {t('remaining')}
                                </span>
                                <span className="mt-0.5 text-lg sm:text-2xl font-black tabular-nums">
                                    {remaining > 0 ? formatMoney(remaining) : '0,000 DT ✓'}
                                </span>
                            </Div>

                            <Div
                                className={twMerge(
                                    'flex flex-col items-center justify-center rounded-xl p-3 border transition-all',
                                    change > 0
                                        ? 'border-success-500 bg-gradient-to-br from-success-500 to-success-600 text-white shadow-lg shadow-success-500/25'
                                        : 'border-gray-200 bg-gray-50 text-gray-700',
                                )}
                            >
                                <span
                                    className={twMerge(
                                        'text-xs font-semibold uppercase tracking-wider',
                                        change > 0 ? 'text-success-100' : 'text-gray-500',
                                    )}
                                >
                                    {t('change')}
                                </span>
                                <span className="mt-0.5 text-lg sm:text-2xl font-black tabular-nums">
                                    {formatMoney(change)}
                                </span>
                            </Div>
                        </Div>
                    </Div>

                    {/* Payment Lines */}
                    <Div className="space-y-2">
                        {lines.length === 0 ? (
                            <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 p-4 text-center text-sm font-medium text-gray-500">
                                <span className="text-xl">👉</span>
                                <span>{t('pickMethod')}</span>
                            </div>
                        ) : null}

                        {payments.map((line) => {
                            const isCash = line.method === 'CASH';
                            const isCredit = line.method === 'CLIENT_ACCOUNT';
                            const isSelected = line.id === selectedId;

                            return (
                                <Div
                                    key={line.id}
                                    className={twMerge(
                                        'flex items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 shadow-2xs transition-all',
                                        isSelected && 'border-primary-500 bg-primary-50/30 ring-2 ring-primary-500/20 shadow-sm',
                                        !isSelected && 'border-gray-200 hover:border-gray-300',
                                        line.isRest && 'border-dashed bg-gray-50/80',
                                    )}
                                >
                                    <div
                                        className={twMerge(
                                            'flex size-9 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs',
                                            isCash && 'bg-success-500',
                                            isCredit && 'bg-warning-500',
                                            !isCash && !isCredit && 'bg-primary-500',
                                        )}
                                    >
                                        {isCash ? 'ES' : isCredit ? 'CR' : 'AC'}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => selectLine(line)}
                                        className={twMerge(
                                            'flex min-w-0 flex-1 items-center justify-between gap-3 text-start',
                                            line.isRest && 'cursor-default',
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">
                                                {line.isRest ? t('depositRest') : tMethod(line.method)}
                                            </span>
                                            {isSelected ? (
                                                <span className="text-xs font-semibold text-primary-600">
                                                    En cours de saisie...
                                                </span>
                                            ) : null}
                                        </div>
                                        <span className="text-lg font-black text-gray-900 tabular-nums">
                                            {formatMoney(line.amount)}
                                        </span>
                                    </button>

                                    <Icon
                                        name={IconComponentsEnum.close}
                                        size={ESize.sm}
                                        color="text-gray-400"
                                        className="-m-2 box-content shrink-0 cursor-pointer rounded-lg p-2 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                                        handleClick={() => removeLine(line.id)}
                                    />
                                </Div>
                            );
                        })}

                        {needsClient ? (
                            <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700">
                                {t('clientRequired')}
                            </div>
                        ) : null}

                        {nonCashTooHigh ? (
                            <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700">
                                {t('nonCashTooHigh')}
                            </div>
                        ) : null}
                    </Div>

                    {/* Status Summary Banner */}
                    <Div className="pt-1">
                        {paymentReady ? (
                            <Div className="flex items-center justify-between gap-3 rounded-2xl border border-success-200 bg-success-50/70 p-4 text-success-800 shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-600 text-white font-bold shadow-xs">
                                        <Icon name={IconComponentsEnum.check} size={ESize.sm} color="text-white" />
                                    </div>
                                    <div className="text-start">
                                        <div className="text-sm font-bold text-success-950">
                                            {t('fullPayment')}
                                        </div>
                                        <div className="text-xs text-success-700">
                                            {change > 0 ? (
                                                <span>
                                                    {t('changeToReturn')}{' '}
                                                    <strong className="font-extrabold tabular-nums">{formatMoney(change)}</strong>
                                                </span>
                                            ) : (
                                                <span>{t('readyToValidate')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-success-600/15 px-3 py-1.5 text-xs font-black text-success-800 tabular-nums">
                                    {formatMoney(paid)}
                                </div>
                            </Div>
                        ) : (
                            <Div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                                        <Icon name={IconComponentsEnum.layers} size={ESize.sm} color="text-gray-500" />
                                    </div>
                                    <div className="text-start">
                                        <div className="text-sm font-bold text-gray-900">
                                            {remaining > 0 ? t('pendingPayment') : t('validationDisabled')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {remaining > 0 ? (
                                                <span>
                                                    {t('remainingToCollect', { amount: formatMoney(remaining) })}
                                                </span>
                                            ) : needsClient ? (
                                                <span className="text-warning-700">{t('clientRequiredForCredit')}</span>
                                            ) : (
                                                <span>{t('selectPaymentMethod')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 tabular-nums">
                                    {formatMoney(paid)} / {formatMoney(total)}
                                </div>
                            </Div>
                        )}
                    </Div>
                </Div>

                {/* Column 3: Client card & Numpad with colored presets + Big Valider Button */}
                <Div className="space-y-3 tablet:col-start-2 tablet:row-span-2 tablet:row-start-1 lg:col-start-3 lg:row-span-1">
                    {cart.client ? (
                        <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50/70 to-primary-100/40 p-3 shadow-2xs">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 font-bold text-white shadow-sm">
                                    {cart.client.firstName.charAt(0)}{cart.client.lastName.charAt(0)}
                                </div>
                                <div className="min-w-0 text-start">
                                    <div className="text-[11px] font-semibold text-primary-700">
                                        Client sélectionné
                                    </div>
                                    <div className="truncate text-sm font-bold text-gray-900">
                                        {cart.client.firstName} {cart.client.lastName}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onPickClient}
                                className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primary-700 shadow-2xs border border-primary-200 hover:bg-primary-50 transition-colors cursor-pointer"
                            >
                                Changer
                            </button>
                        </div>
                    ) : (
                        <button
                            id="pos-payment-client"
                            type="button"
                            onClick={onPickClient}
                            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-4 text-sm font-bold text-gray-700 shadow-2xs transition-all hover:border-primary-400 hover:bg-primary-50/40 hover:text-primary-700 cursor-pointer"
                        >
                            <Icon name={IconComponentsEnum.user} size={ESize.sm} color="text-primary-500" />
                            <span>{t('client')}</span>
                        </button>
                    )}

                    <Div className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-sm">
                        <PosNumpad id="pos-payment-numpad" rows={numpadRows} onKey={handleKey} disabled={!selectedId} />
                    </Div>

                    {/* Big Valider button directly under numpad (in the yellow zone) */}
                    {paymentReady ? (
                        <button
                            id="pos-payment-validate"
                            type="button"
                            onClick={handleValidate}
                            disabled={isLoading}
                            className={twMerge(
                                "group flex h-16 sm:h-20 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-success-600 via-success-600 to-success-700 px-6 text-xl sm:text-2xl font-black text-white shadow-xl shadow-success-600/35 ring-4 ring-success-400/40 transition-all",
                                isLoading
                                    ? "cursor-wait opacity-90"
                                    : "hover:from-success-500 hover:via-success-500 hover:to-success-600 hover:shadow-2xl hover:shadow-success-600/50 active:scale-[0.98] cursor-pointer"
                            )}
                        >
                            {isLoading ? (
                                <svg
                                    className="size-7 animate-spin text-white shrink-0"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-90"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            ) : null}
                            <span className="tracking-wide">
                                {isLoading ? 'Validation...' : t('validate')}
                            </span>
                        </button>
                    ) : (
                        <button
                            id="pos-payment-validate"
                            type="button"
                            disabled
                            className="flex h-16 sm:h-20 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100/90 px-6 text-xl sm:text-2xl font-bold text-gray-400 cursor-not-allowed transition-all"
                        >
                            <span className="tracking-wide">{t('validate')}</span>
                        </button>
                    )}
                </Div>
            </Div>

            {/* Mobile sticky bottom bar */}
            <Div className="flex shrink-0 items-center gap-3 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg sm:hidden">
                <Div className="flex min-w-0 flex-col">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('remaining')}
                    </Label>
                    <Label
                        variant={EVariantLabel.h6}
                        color={remaining > 0 ? 'text-danger-600' : 'text-gray-900'}
                        className="truncate tabular-nums font-bold"
                    >
                        {formatMoney(remaining)}
                    </Label>
                </Div>
                {paymentReady ? (
                    <button
                        id="pos-payment-validate-mobile"
                        type="button"
                        onClick={handleValidate}
                        disabled={isLoading}
                        className={twMerge(
                            "flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-success-600 text-base font-bold text-white shadow-lg shadow-success-600/30 transition-all",
                            isLoading ? "cursor-wait opacity-90" : "active:scale-95"
                        )}
                    >
                        {isLoading ? (
                            <svg
                                className="size-5 animate-spin text-white shrink-0"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-90"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        ) : null}
                        <span>{isLoading ? 'Validation...' : `${t('validate')} (${formatMoney(paid)})`}</span>
                    </button>
                ) : (
                    <Button
                        id="pos-payment-validate-mobile"
                        type={EButtonType.primary}
                        size={EButtonSize.large}
                        text={t('validate')}
                        disabled
                        className="h-13 min-w-0 flex-1 rounded-xl"
                    />
                )}
            </Div>
        </Div>
    );
}
