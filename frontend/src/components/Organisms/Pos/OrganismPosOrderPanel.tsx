'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import PosNumpad, { type PosNumpadKey } from '@/components/Organisms/Pos/PosNumpad';
import { cartLineTotal, usePosCart, type PosCartLine } from '@/contexts/PosCartContext';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { round3 } from '@/lib/pos-api';
import {
    applyNumpadKey,
    NUMPAD_BACKSPACE,
    NUMPAD_DECIMAL,
    NUMPAD_SIGN,
    parseNumpadBuffer,
} from '@/lib/pos-numpad';

type NumpadMode = 'quantity' | 'discount' | 'price';

const MODE_KEY_PREFIX = 'mode:';

const MODE_FIELD: Record<NumpadMode, keyof Pick<PosCartLine, 'quantity' | 'discountPct' | 'unitPrice'>> = {
    quantity: 'quantity',
    discount: 'discountPct',
    price: 'unitPrice',
};

interface IOrganismPosOrderPanel {
    onPay: () => void;
    onPickClient?: () => void;
    onPickInvoice: () => void;
    onPickSubscription: () => void;
    onPickCreditPayment: () => void;
}

export default function OrganismPosOrderPanel({
    onPay,
    onPickInvoice,
    onPickSubscription,
    onPickCreditPayment,
}: Readonly<IOrganismPosOrderPanel>) {
    const t = useTranslations('pos.register');
    const cart = usePosCart();
    const [mode, setMode] = useState<NumpadMode>('quantity');
    const [buffer, setBuffer] = useState('');
    const [fresh, setFresh] = useState(true);
    const listRef = useRef<HTMLDivElement>(null);

    const selectedLine = cart.lines.find((l) => l.id === cart.selectedLineId) ?? null;

    useEffect(() => {
        setBuffer(selectedLine ? String(selectedLine[MODE_FIELD[mode]]) : '');
        setFresh(true);
        // Only reset when the selection or mode changes, not on every value edit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart.selectedLineId, mode]);

    useEffect(() => {
        const selected = listRef.current?.querySelector('[data-selected="true"]');
        selected?.scrollIntoView({ block: 'nearest' });
    }, [cart.selectedLineId, cart.lines.length]);

    const numpadRows: PosNumpadKey[][] = [
        [
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: `${MODE_KEY_PREFIX}quantity`, label: t('modeQuantity'), accent: true },
        ],
        [
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: '6', label: '6' },
            { value: `${MODE_KEY_PREFIX}discount`, label: t('modeDiscount'), accent: true },
        ],
        [
            { value: '7', label: '7' },
            { value: '8', label: '8' },
            { value: '9', label: '9' },
            { value: `${MODE_KEY_PREFIX}price`, label: t('modePrice'), accent: true },
        ],
        [
            { value: NUMPAD_SIGN, label: '+/-' },
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

    const handleKey = (key: string) => {
        if (key.startsWith(MODE_KEY_PREFIX)) {
            setMode(key.slice(MODE_KEY_PREFIX.length) as NumpadMode);
            return;
        }
        if (!selectedLine) return;
        if (selectedLine.creditId) {
            if (key === NUMPAD_BACKSPACE) cart.removeLine(selectedLine.id);
            return;
        }
        if ((selectedLine.saleOrderId || selectedLine.subscriptionId || selectedLine.invoiceId) && mode !== 'price') {
            if (key === NUMPAD_BACKSPACE) cart.removeLine(selectedLine.id);
            return;
        }
        if (key === NUMPAD_SIGN && mode !== 'quantity') return;

        const next = applyNumpadKey(buffer, key, fresh);
        if (key === NUMPAD_BACKSPACE && next === '' && mode === 'quantity' && selectedLine.quantity === 0) {
            cart.removeLine(selectedLine.id);
            return;
        }

        const value = parseNumpadBuffer(next);
        setBuffer(next);
        setFresh(false);
        if (mode === 'quantity') {
            cart.updateLine(selectedLine.id, { quantity: round3(value) });
        } else if (mode === 'discount') {
            cart.updateLine(selectedLine.id, { discountPct: Math.min(100, Math.max(0, round3(value))) });
        } else {
            cart.updateLine(selectedLine.id, { unitPrice: Math.max(0, round3(value)) });
        }
    };

    const hasInvalidLine = cart.lines.some((l) => l.quantity === 0);
    const canPay = cart.lines.length > 0 && !hasInvalidLine && cart.total >= 0;

    return (
        <Div className="flex h-full min-h-0 flex-col bg-white">
            {/* Phones scroll the lines and the controls together so the pinned pay bar never squeezes the cart. */}
            <Div className="flex min-h-0 flex-1 flex-col overflow-y-auto tablet:overflow-hidden">
                <div ref={listRef} className="min-h-[220px] tablet:min-h-[260px] tablet:flex-1 tablet:overflow-y-auto">
                    {cart.lines.length === 0 ? (
                        <Div className="flex h-full min-h-[220px] tablet:min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-12 tablet:py-10">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/60 border border-primary-200/60 shadow-2xs">
                                <Icon name={IconComponentsEnum.shoppingCart} size={ESize.lg} color="text-primary-500" />
                            </div>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="text-center font-semibold">
                                {t('emptyOrder')}
                            </Label>
                        </Div>
                    ) : (
                        <ul>
                            {cart.lines.map((line) => {
                                const selected = line.id === cart.selectedLineId;
                                return (
                                    <li key={line.id}>
                                        <button
                                            type="button"
                                            data-selected={selected}
                                            onClick={() => cart.selectLine(line.id)}
                                            className={twMerge(
                                                'flex w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-2.5 text-start transition-colors hover:bg-gray-50',
                                                selected && 'bg-primary-50/70 border-s-4 border-s-primary-500',
                                            )}
                                        >
                                            <Div className="flex min-w-0 flex-col">
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold">
                                                    {line.name}
                                                </Label>
                                                <Label variant={EVariantLabel.caption} color="text-gray-500" className="tabular-nums">
                                                    {t('lineDetail', {
                                                        quantity: line.quantity,
                                                        price: formatMoney(line.unitPrice),
                                                    })}
                                                </Label>
                                                {line.discountPct > 0 ? (
                                                    <Label variant={EVariantLabel.caption} color="text-success-700">
                                                        {t('lineDiscount', { value: line.discountPct })}
                                                    </Label>
                                                ) : null}
                                            </Div>
                                            <Label
                                                variant={EVariantLabel.bodySmall}
                                                color="text-gray-900"
                                                className="shrink-0 font-semibold tabular-nums"
                                            >
                                                {formatMoney(cartLineTotal(line))}
                                            </Label>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <Div className="shrink-0 space-y-2.5 border-t border-gray-200 bg-white p-3 tablet:space-y-2">
                    <Div className="hidden items-baseline justify-between gap-3 tablet:flex">
                        <Label variant={EVariantLabel.subtitle} color="text-gray-700">
                            {t('total')}
                        </Label>
                        <span className="text-2xl font-black text-gray-900 tabular-nums">
                            {formatMoney(cart.total)}
                        </span>
                    </Div>

                    {/* Distinct colorful document buttons: Crédit, Facture, Abonnement */}
                    <Div className="flex items-center gap-2">
                        <button
                            id="pos-order-credit-payment"
                            type="button"
                            onClick={onPickCreditPayment}
                            className="min-w-0 flex-1 truncate rounded-xl border-2 border-primary-300 bg-primary-50/80 px-2 py-2 text-xs font-bold text-primary-900 shadow-2xs transition-colors hover:border-primary-400 hover:bg-primary-100 flex items-center justify-center gap-1.5 tablet:px-2.5 tablet:text-sm cursor-pointer"
                        >
                            <Icon name={IconComponentsEnum.userCheck} size={ESize.sm} color="text-primary-600" />
                            <span className="truncate">{t('creditPaymentButton')}</span>
                        </button>
                        <button
                            id="pos-order-invoice"
                            type="button"
                            onClick={onPickInvoice}
                            className="min-w-0 flex-1 truncate rounded-xl border-2 border-primary-300 bg-primary-50/80 px-2 py-2 text-xs font-bold text-primary-900 shadow-2xs transition-colors hover:border-primary-400 hover:bg-primary-100 flex items-center justify-center gap-1.5 tablet:px-2.5 tablet:text-sm cursor-pointer"
                        >
                            <Icon name={IconComponentsEnum.filetext} size={ESize.sm} color="text-primary-600" />
                            <span className="truncate">{t('invoiceButton')}</span>
                        </button>
                        <button
                            id="pos-order-subscription"
                            type="button"
                            onClick={onPickSubscription}
                            className="min-w-0 flex-1 truncate rounded-xl border-2 border-primary-300 bg-primary-50/80 px-2 py-2 text-xs font-bold text-primary-900 shadow-2xs transition-colors hover:border-primary-400 hover:bg-primary-100 flex items-center justify-center gap-1.5 tablet:px-2.5 tablet:text-sm cursor-pointer"
                        >
                            <Icon name={IconComponentsEnum.calendar} size={ESize.sm} color="text-primary-600" />
                            <span className="truncate">{t('subscriptionButton')}</span>
                        </button>
                        {cart.lines.length > 0 ? (
                            <button
                                id="pos-order-clear"
                                type="button"
                                aria-label={t('clearOrder')}
                                onClick={cart.clear}
                                className="shrink-0 rounded-xl border-2 border-danger-200 bg-danger-50 p-2 text-danger-600 transition-colors hover:border-danger-300 hover:bg-danger-100 cursor-pointer"
                            >
                                <Icon name={IconComponentsEnum.trash} size={ESize.sm} color="text-danger-600" />
                            </button>
                        ) : null}
                    </Div>

                    <PosNumpad
                        id="pos-order-numpad"
                        rows={numpadRows}
                        activeValue={`${MODE_KEY_PREFIX}${mode}`}
                        onKey={handleKey}
                    />
                </Div>
            </Div>

            {/* Bottom Pay CTA */}
            <Div className="flex shrink-0 items-center gap-3 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] tablet:border-t-0 tablet:pt-0 tablet:shadow-none">
                <Div className="flex min-w-0 flex-col tablet:hidden">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('total')}
                    </Label>
                    <Label variant={EVariantLabel.h5} color="text-gray-900" className="truncate tabular-nums font-bold">
                        {formatMoney(cart.total)}
                    </Label>
                </Div>
                {canPay ? (
                    <button
                        id="pos-order-pay"
                        type="button"
                        onClick={onPay}
                        className="group relative flex h-13 min-w-0 flex-1 items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 px-5 text-white shadow-lg shadow-accent-500/25 transition-all hover:from-accent-600 hover:to-accent-700 active:scale-[0.99] cursor-pointer"
                    >
                        <span className="text-base font-bold sm:text-lg">{t('payment')}</span>
                        <div className="flex items-center gap-2.5">
                            <span className="text-lg font-black tabular-nums sm:text-xl">
                                {formatMoney(cart.total)}
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                                <Icon name={IconComponentsEnum.arrowRight} size={ESize.xs} color="text-white" />
                            </div>
                        </div>
                    </button>
                ) : (
                    <button
                        id="pos-order-pay"
                        type="button"
                        disabled
                        className="flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-100 px-4 text-sm font-semibold text-gray-400 cursor-not-allowed"
                    >
                        <span>{t('payment')}</span>
                        <Icon name={IconComponentsEnum.arrowRight} size={ESize.xs} color="text-gray-400" />
                    </button>
                )}
            </Div>
        </Div>
    );
}
