'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
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
    onPickClient: () => void;
    onPickInvoice: () => void;
    onPickSubscription: () => void;
    onPickCreditPayment: () => void;
}

export default function OrganismPosOrderPanel({
    onPay,
    onPickClient,
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
            { value: NUMPAD_BACKSPACE, label: '⌫', accent: true },
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
            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
                {cart.lines.length === 0 ? (
                    <Div className="flex h-full flex-col items-center justify-center gap-2 p-6">
                        <Icon name={IconComponentsEnum.shoppingCart} size={ESize.xl} color="text-gray-300" />
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
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
                                            'flex w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-2.5 text-left transition-colors hover:bg-gray-50',
                                            selected && 'bg-primary-50 hover:bg-primary-50',
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
                                                <Label variant={EVariantLabel.caption} color="text-success-600">
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

            <Div className="shrink-0 space-y-3 border-t border-gray-200 p-3">
                <Div className="flex items-baseline justify-between gap-3">
                    <Label variant={EVariantLabel.subtitle} color="text-gray-700">
                        {t('total')}
                    </Label>
                    <Label variant={EVariantLabel.h4} color="text-gray-900" className="tabular-nums">
                        {formatMoney(cart.total)}
                    </Label>
                </Div>

                <Div className="flex gap-2">
                    <Button
                        id="pos-order-client"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.user, size: ESize.sm, color: 'text-primary-500' }}
                        text={cart.client ? `${cart.client.firstName} ${cart.client.lastName}` : t('client')}
                        onClick={onPickClient}
                        className="min-w-0 flex-1 truncate rounded-lg"
                    />
                    <Button
                        id="pos-order-credit-payment"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.userCheck, size: ESize.sm, color: 'text-primary-500' }}
                        text={t('creditPaymentButton')}
                        onClick={onPickCreditPayment}
                        className="shrink-0 rounded-lg"
                    />
                    {cart.lines.length > 0 ? (
                        <Button
                            id="pos-order-clear"
                            type={EButtonType.secondary}
                            size={EButtonSize.medium}
                            iconPosition="only"
                            icon={{ name: IconComponentsEnum.trash, size: ESize.sm, color: 'text-danger-600' }}
                            aria-label={t('clearOrder')}
                            onClick={cart.clear}
                        />
                    ) : null}
                </Div>

                <Div className="grid grid-cols-2 gap-2">
                    <Button
                        id="pos-order-invoice"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.filetext, size: ESize.sm, color: 'text-primary-500' }}
                        text={t('invoiceButton')}
                        onClick={onPickInvoice}
                        className="min-w-0 truncate rounded-lg"
                    />
                    <Button
                        id="pos-order-subscription"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.calendar, size: ESize.sm, color: 'text-primary-500' }}
                        text={t('subscriptionButton')}
                        onClick={onPickSubscription}
                        className="min-w-0 truncate rounded-lg"
                    />
                </Div>

                <Input
                    id="pos-order-note"
                    placeholder={t('notePlaceholder')}
                    value={cart.note}
                    onChange={(e) => cart.setNote(e.target.value)}
                    leftIcon="message"
                />

                <PosNumpad
                    id="pos-order-numpad"
                    rows={numpadRows}
                    activeValue={`${MODE_KEY_PREFIX}${mode}`}
                    onKey={handleKey}
                />

                <Button
                    id="pos-order-pay"
                    type={EButtonType.primary}
                    size={EButtonSize.large}
                    iconPosition="right"
                    icon={{ name: IconComponentsEnum.arrowRight, size: ESize.sm, color: 'text-white' }}
                    text={t('payment')}
                    disabled={!canPay}
                    onClick={onPay}
                    className="h-14 w-full rounded-lg"
                />
            </Div>
        </Div>
    );
}
