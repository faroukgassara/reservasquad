'use client';

import { useState } from 'react';
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
const OPTION_ICON: Record<PaymentOption, IconComponentsEnum> = {
    CASH: IconComponentsEnum.layers,
    CREDIT: IconComponentsEnum.user,
    DEPOSIT: IconComponentsEnum.clock,
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
    const canValidate = paid + 0.0005 >= total && !nonCashTooHigh && !needsClient && !isSubmitting;

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
            { value: '+10', label: '+10', accent: true },
        ],
        [
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: '6', label: '6' },
            { value: '+20', label: '+20', accent: true },
        ],
        [
            { value: '7', label: '7' },
            { value: '8', label: '8' },
            { value: '9', label: '9' },
            { value: '+50', label: '+50', accent: true },
        ],
        [
            { value: CLEAR_KEY, label: 'C', accent: true },
            { value: '0', label: '0' },
            { value: NUMPAD_DECIMAL, label: ',' },
            { value: NUMPAD_BACKSPACE, label: '⌫', accent: true },
        ],
    ];

    const validate = () =>
        onValidate(
            payments
                .filter((l) => l.amount > 0)
                .map((l) => ({ method: l.method, amount: round3(l.amount) })),
        );

    return (
        <Div className="flex min-h-0 flex-1 flex-col bg-gray-25">
            <Div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
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
                <Label variant={EVariantLabel.h5} color="text-gray-900" className="truncate">
                    {t('title')}
                </Label>
                <Button
                    id="pos-payment-validate"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    iconPosition="right"
                    icon={{ name: IconComponentsEnum.check, size: ESize.sm, color: 'text-white' }}
                    text={t('validate')}
                    disabled={!canValidate}
                    isLoading={isSubmitting}
                    onClick={validate}
                    className="hidden sm:flex"
                />
            </Div>

            <Div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-3 sm:p-4 tablet:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[280px_minmax(0,1fr)_340px]">
                <Div className="grid grid-cols-2 gap-2 tablet:col-start-1 tablet:row-start-1 lg:grid-cols-1 lg:content-start">
                    <Label variant={EVariantLabel.overline} color="text-gray-500" className="col-span-full">
                        {t('methods')}
                    </Label>
                    {options.map((option) => (
                        <Button
                            key={option}
                            id={`pos-payment-option-${option}`}
                            type={EButtonType.secondary}
                            size={EButtonSize.large}
                            iconPosition="left"
                            icon={{ name: OPTION_ICON[option], size: ESize.sm, color: 'text-primary-500' }}
                            text={t(`options.${option}`)}
                            onClick={() => addOption(option)}
                            className="h-14 w-full min-w-0 justify-start rounded-lg px-3 sm:px-4"
                        />
                    ))}
                </Div>

                <Div className="flex min-w-0 flex-col gap-4 tablet:col-start-1 tablet:row-start-2 lg:col-start-2 lg:row-start-1">
                    <Div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm sm:p-6">
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                            {t('totalDue')}
                        </Label>
                        <Label variant={EVariantLabel.h3} color="text-primary-600" className="block tabular-nums tablet:hidden">
                            {formatMoney(total)}
                        </Label>
                        <Label variant={EVariantLabel.h1} color="text-primary-600" className="hidden tabular-nums tablet:block">
                            {formatMoney(total)}
                        </Label>
                        <Div className="mt-3 flex justify-center gap-6">
                            <Div className="flex flex-col">
                                <Label variant={EVariantLabel.caption} color="text-gray-500">
                                    {t('remaining')}
                                </Label>
                                <Label
                                    variant={EVariantLabel.h6}
                                    color={remaining > 0 ? 'text-danger-600' : 'text-gray-900'}
                                    className="tabular-nums"
                                >
                                    {formatMoney(remaining)}
                                </Label>
                            </Div>
                            <Div className="flex flex-col">
                                <Label variant={EVariantLabel.caption} color="text-gray-500">
                                    {t('change')}
                                </Label>
                                <Label
                                    variant={EVariantLabel.h6}
                                    color={change > 0 ? 'text-success-700' : 'text-gray-900'}
                                    className="tabular-nums"
                                >
                                    {formatMoney(change)}
                                </Label>
                            </Div>
                        </Div>
                    </Div>

                    <Div className="space-y-2">
                        {lines.length === 0 ? (
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                {t('pickMethod')}
                            </Label>
                        ) : null}
                        {payments.map((line) => (
                            <Div
                                key={line.id}
                                className={twMerge(
                                    'flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3',
                                    line.id === selectedId && 'border-primary-400 bg-primary-50',
                                    line.isRest && 'border-dashed bg-gray-50',
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => selectLine(line)}
                                    className={twMerge(
                                        'flex min-w-0 flex-1 items-center justify-between gap-3 text-start',
                                        line.isRest && 'cursor-default',
                                    )}
                                >
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                        {line.isRest ? t('depositRest') : tMethod(line.method)}
                                    </Label>
                                    <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="tabular-nums">
                                        {formatMoney(line.amount)}
                                    </Label>
                                </button>
                                <Icon
                                    name={IconComponentsEnum.close}
                                    size={ESize.sm}
                                    color="text-gray-500"
                                    className="-m-3 box-content shrink-0 cursor-pointer p-3"
                                    handleClick={() => removeLine(line.id)}
                                />
                            </Div>
                        ))}
                        {needsClient ? (
                            <Label variant={EVariantLabel.caption} color="text-danger-600">
                                {t('clientRequired')}
                            </Label>
                        ) : null}
                        {nonCashTooHigh ? (
                            <Label variant={EVariantLabel.caption} color="text-danger-600">
                                {t('nonCashTooHigh')}
                            </Label>
                        ) : null}
                    </Div>
                </Div>

                <Div className="space-y-3 tablet:col-start-2 tablet:row-span-2 tablet:row-start-1 lg:col-start-3 lg:row-span-1">
                    <Button
                        id="pos-payment-client"
                        type={EButtonType.secondary}
                        size={EButtonSize.large}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.user, size: ESize.sm, color: 'text-primary-500' }}
                        text={cart.client ? `${cart.client.firstName} ${cart.client.lastName}` : t('client')}
                        onClick={onPickClient}
                        className="h-12 w-full rounded-lg"
                    />
                    <PosNumpad id="pos-payment-numpad" rows={numpadRows} onKey={handleKey} disabled={!selectedId} />
                </Div>
            </Div>

            <Div className="flex shrink-0 items-center gap-3 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
                <Div className="flex min-w-0 flex-col">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('remaining')}
                    </Label>
                    <Label
                        variant={EVariantLabel.h6}
                        color={remaining > 0 ? 'text-danger-600' : 'text-gray-900'}
                        className="truncate tabular-nums"
                    >
                        {formatMoney(remaining)}
                    </Label>
                </Div>
                <Button
                    id="pos-payment-validate-mobile"
                    type={EButtonType.primary}
                    size={EButtonSize.large}
                    iconPosition="right"
                    icon={{ name: IconComponentsEnum.check, size: ESize.sm, color: 'text-white' }}
                    text={t('validate')}
                    disabled={!canValidate}
                    isLoading={isSubmitting}
                    onClick={validate}
                    className="h-14 min-w-0 flex-1 rounded-lg"
                />
            </Div>
        </Div>
    );
}
