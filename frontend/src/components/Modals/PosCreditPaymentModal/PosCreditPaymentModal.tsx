'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useCurrentModal } from '@/contexts/ModalContext';
import {
    fetchCreditClient,
    fetchCreditClients,
    type CreditClientListItem,
    type CreditRecord,
} from '@/lib/credit-api';
import { formatMoney } from '@/lib/daily-income-api';
import { formatPosDate, personName, type PosClientRef } from '@/lib/pos-api';
import { EButtonSize, EButtonType, EInputType, ESize, EVariantLabel } from '@/Enum/Enum';

interface PosCreditPaymentModalProps {
    onSelect: (selection: { client: PosClientRef; credit: { id: string; label: string }; amount: number }) => void;
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

function creditLabel(credit: CreditRecord): string {
    return credit.description || formatPosDate(credit.date);
}

export default function PosCreditPaymentModal({ onSelect }: Readonly<PosCreditPaymentModalProps>) {
    const t = useTranslations('pos.creditPayment');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [client, setClient] = useState<CreditClientListItem | null>(null);
    const [credit, setCredit] = useState<CreditRecord | null>(null);
    const [amount, setAmount] = useState('');
    const [amountError, setAmountError] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ['credit-clients', 'pos-credit-payment', debouncedSearch],
        queryFn: () => fetchCreditClients({ page: 1, perPage: 50, search: debouncedSearch || undefined }),
    });
    const clients = (data?.data ?? []).filter((c) => c.remaining > 0);

    const { data: clientDetail, isLoading: creditsLoading } = useQuery({
        queryKey: ['credit-client', client?.id],
        queryFn: () => fetchCreditClient(client!.id),
        enabled: !!client,
    });
    const openCredits = (clientDetail?.credits ?? []).filter((c) => c.remaining > 0);

    const pickCredit = (next: CreditRecord) => {
        setCredit(next);
        setAmount(String(next.remaining));
        setAmountError(null);
    };

    const back = () => {
        setClient(null);
        setCredit(null);
    };

    const confirm = () => {
        if (!client || !credit) return;
        const value = Number(amount.replace(',', '.'));
        if (!Number.isFinite(value) || value <= 0) {
            setAmountError(t('invalidAmount'));
            return;
        }
        if (round2(value) > credit.remaining) {
            setAmountError(t('amountExceeds', { value: formatMoney(credit.remaining) }));
            return;
        }
        onSelect({
            client: { id: client.id, firstName: client.firstName, lastName: client.lastName, phone: client.phone },
            credit: { id: credit.id, label: creditLabel(credit) },
            amount: round2(value),
        });
        closeModal();
    };

    const renderCredits = () => (
        <Div className="space-y-4">
            <Div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="block font-semibold">
                    {personName(client)}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-600" className="tabular-nums">
                    {t('balance', { value: formatMoney(client?.remaining ?? 0) })}
                </Label>
            </Div>
            <Label variant={EVariantLabel.overline} color="text-gray-500" className="block">
                {t('pickCredit')}
            </Label>
            <Div className="max-h-[40dvh] space-y-1 overflow-y-auto">
                {creditsLoading ? (
                    <Div className="flex justify-center py-6">
                        <Spinner size={ESize.lg} color="text-primary-500" />
                    </Div>
                ) : null}
                {openCredits.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => pickCredit(item)}
                        className={twMerge(
                            'flex w-full items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50',
                            credit?.id === item.id && 'border-primary-500 bg-primary-50 hover:bg-primary-50',
                        )}
                    >
                        <Div className="flex min-w-0 flex-col">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-medium">
                                {creditLabel(item)}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-500" className="tabular-nums">
                                {t('creditCaption', { date: formatPosDate(item.date), total: formatMoney(item.totalCredit) })}
                            </Label>
                        </Div>
                        <Label variant={EVariantLabel.bodySmall} color="text-warning-600" className="shrink-0 font-semibold tabular-nums">
                            {formatMoney(item.remaining)}
                        </Label>
                    </button>
                ))}
            </Div>
            {credit ? (
                <Input
                    id="pos-credit-payment-amount"
                    label={t('amount')}
                    type={EInputType.number}
                    value={amount}
                    onChange={(e) => {
                        setAmount(e.target.value);
                        setAmountError(null);
                    }}
                    hintText={amountError ?? t('amountHint')}
                    error={!!amountError}
                />
            ) : null}
            <Div className="flex gap-3">
                <Button
                    id="pos-credit-payment-back"
                    type={EButtonType.secondary}
                    size={EButtonSize.medium}
                    text={tCommon('back')}
                    onClick={back}
                    className="flex-1"
                />
                <Button
                    id="pos-credit-payment-confirm"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    text={t('addToOrder')}
                    disabled={!credit}
                    onClick={confirm}
                    className="flex-1"
                />
            </Div>
        </Div>
    );

    const renderClients = () => (
        <>
            <Input
                id="pos-credit-payment-search"
                leftIcon="search"
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <Div className="max-h-[50dvh] min-h-40 space-y-1 overflow-y-auto">
                {isLoading ? (
                    <Div className="flex justify-center py-8">
                        <Spinner size={ESize.lg} color="text-primary-500" />
                    </Div>
                ) : null}
                {!isLoading && clients.length === 0 ? (
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="py-6">
                        {t('empty')}
                    </Label>
                ) : null}
                {clients.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setClient(item)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                    >
                        <Div className="flex min-w-0 flex-col">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-medium">
                                {personName(item)}
                            </Label>
                            {item.phone ? (
                                <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                    {item.phone}
                                </Label>
                            ) : null}
                        </Div>
                        <Label variant={EVariantLabel.bodySmall} color="text-warning-600" className="shrink-0 font-semibold tabular-nums">
                            {formatMoney(item.remaining)}
                        </Label>
                    </button>
                ))}
            </Div>
        </>
    );

    return (
        <Modal title={t('title')} subTitle={t('subtitle')} canClose canCloseOnClickOutisde className="w-[min(94vw,560px)]">
            <Div className="flex flex-col gap-4">{client ? renderCredits() : renderClients()}</Div>
        </Modal>
    );
}
