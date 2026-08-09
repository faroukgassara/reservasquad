'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Button from '@/components/Primitives/Button/Button';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import DocumentLinesEditor, { EMPTY_LINE } from '@/components/Primitives/DocumentLinesEditor/DocumentLinesEditor';
import { EButtonSize, EButtonType, EInputType, ESize, EToastType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import {
    createQuote,
    fetchAllCustomers,
    type DocumentLineInput,
} from '@/lib/sales-api';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';

export default function NewQuotePage() {
    const t = useTranslations('sales.quotes');
    const tCommon = useTranslations('common');

    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const { openToast } = useToast();

    const [customerId, setCustomerId] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<DocumentLineInput[]>([{ ...EMPTY_LINE }]);

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Dashboard);
    }, [isAdmin, router]);

    const { data: customers = [], isLoading: customersLoading } = useQuery({
        queryKey: ['customers-all'],
        queryFn: fetchAllCustomers,
        enabled: isAdmin,
    });

    const customerOptions = useMemo(
        () =>
            customers.map((c) => ({
                value: c.id,
                label: c.company ? `${c.name} — ${c.company}` : c.name,
            })),
        [customers],
    );

    const createMutation = useMutation({
        mutationFn: createQuote,
        onSuccess: (quote) => {
            openToast(tCommon('success'), tCommon('create'), { type: EToastType.SUCCESS });
            router.push(Routes.Quotes.show(quote.id));
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    const handleSubmit = async () => {
        if (!customerId) {
            openToast(tCommon('error'), t('customer'), { type: EToastType.ERROR });
            return;
        }
        const validLines = lines.filter((l) => l.label.trim());
        if (validLines.length === 0) {
            openToast(tCommon('error'), tCommon('add'), { type: EToastType.ERROR });
            return;
        }
        await createMutation.mutateAsync({
            customerId,
            validUntil: validUntil || undefined,
            notes: notes.trim() || undefined,
            lines: validLines.map((l) => ({
                label: l.label.trim(),
                description: l.description?.trim() || undefined,
                quantity: Number(l.quantity) || 0,
                unitPrice: Number(l.unitPrice) || 0,
                taxRate: Number(l.taxRate) || 0,
            })),
        });
    };

    if (!isAdmin) return null;

    return (
        <LayoutWrapper
            title={t('add')}
            subTitle={t('subtitle')}
            leftActions={
                <Button
                    id="quote-back"
                    type={EButtonType.tertiary}
                    size={EButtonSize.medium}
                    iconPosition="only"
                    icon={{
                        name: IconComponentsEnum.arrowLeft,
                        size: ESize.sm,
                        color: 'text-gray-600',
                    }}
                    onClick={() => router.push(Routes.Quotes.index)}
                />
            }
            mainSection={
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                    className="mx-auto flex max-w-3xl flex-col gap-6"
                >
                    <Div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
                        <Div className="flex flex-col gap-4">
                            <Div className="flex flex-col gap-2">
                                <Dropdown
                                    label={t('customer')}
                                    required
                                    options={customerOptions}
                                    value={customerId}
                                    onChange={(value) => {
                                        if (typeof value === 'string') setCustomerId(value);
                                    }}
                                    disabled={customersLoading}
                                    placeholder={t('customer')}
                                    searchable
                                />
                                {customers.length === 0 && !customersLoading && (
                                    <Label variant={EVariantLabel.hint} color="text-gray-500">
                                        {t('empty')}
                                    </Label>
                                )}
                            </Div>
                            <Input
                                id="quote-valid-until"
                                label={t('validUntil')}
                                type={EInputType.date}
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                            />
                            <Input
                                id="quote-notes"
                                label={tCommon('notes')}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </Div>
                    </Div>

                    <Div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
                        <DocumentLinesEditor lines={lines} onChange={setLines} />
                    </Div>

                    <Div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button
                            id="quote-cancel"
                            type={EButtonType.secondary}
                            size={EButtonSize.medium}
                            text={tCommon('cancel')}
                            onClick={() => router.push(Routes.Quotes.index)}
                        />
                        <Button
                            id="quote-save"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            text={createMutation.isPending ? tCommon('loading') : tCommon('create')}
                            disabled={createMutation.isPending}
                            onClick={() => void handleSubmit()}
                        />
                    </Div>
                </form>
            }
        />
    );
}
