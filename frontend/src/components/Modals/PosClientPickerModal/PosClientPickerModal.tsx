'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import OrganismClientFormFields, {
    toClientInput,
    useClientForm,
} from '@/components/Organisms/OrganismClientFormFields/OrganismClientFormFields';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useCurrentModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { createCreditClient, fetchCreditClients } from '@/lib/credit-api';
import { formatMoney } from '@/lib/daily-income-api';
import type { PosClientRef } from '@/lib/pos-api';
import { EButtonSize, EButtonType, ESize, EToastType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

interface PosClientPickerModalProps {
    selectedId?: string | null;
    onSelect: (client: PosClientRef | null) => void;
}

function useDebouncedValue(value: string, delay: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export default function PosClientPickerModal({ selectedId, onSelect }: Readonly<PosClientPickerModalProps>) {
    const t = useTranslations('pos.client');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const { openToast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const debouncedSearch = useDebouncedValue(search.trim(), 250);

    const { data, isLoading } = useQuery({
        queryKey: ['credit-clients', 'pos-picker', debouncedSearch],
        queryFn: () => fetchCreditClients({ page: 1, perPage: 30, search: debouncedSearch || undefined }),
    });

    const select = (client: PosClientRef | null) => {
        onSelect(client);
        closeModal();
    };

    const createMutation = useMutation({
        mutationFn: createCreditClient,
        onSuccess: (client) => {
            void queryClient.invalidateQueries({ queryKey: ['credit-clients'] });
            select({ id: client.id, firstName: client.firstName, lastName: client.lastName, phone: client.phone });
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const form = useClientForm(null, async (values) => {
        await createMutation.mutateAsync(toClientInput(values));
    });

    const clients = data?.data ?? [];

    return (
        <Modal title={t('title')} subTitle={t('subtitle')} canClose canCloseOnClickOutisde className="w-[min(94vw,560px)]">
            <Div className="flex flex-col gap-4">
                {creating ? (
                    <Div className="space-y-5">
                        <OrganismClientFormFields form={form} idPrefix="pos-client" />
                        <Div className="flex gap-3">
                            <Button
                                id="pos-client-create-cancel"
                                type={EButtonType.secondary}
                                size={EButtonSize.medium}
                                text={tCommon('cancel')}
                                onClick={() => setCreating(false)}
                                className="flex-1"
                            />
                            <Button
                                id="pos-client-create-submit"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={t('createAndSelect')}
                                isLoading={createMutation.isPending}
                                onClick={() => form.handleSubmit()}
                                className="flex-1"
                            />
                        </Div>
                    </Div>
                ) : (
                    <>
                        <Div className="flex gap-2">
                            <Input
                                id="pos-client-search"
                                leftIcon="search"
                                placeholder={t('search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Button
                                id="pos-client-new"
                                type={EButtonType.secondary}
                                size={EButtonSize.medium}
                                iconPosition="left"
                                icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-primary-500' }}
                                text={t('new')}
                                onClick={() => setCreating(true)}
                                className="shrink-0"
                            />
                        </Div>

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
                            {clients.map((client) => (
                                <button
                                    key={client.id}
                                    type="button"
                                    onClick={() =>
                                        select({
                                            id: client.id,
                                            firstName: client.firstName,
                                            lastName: client.lastName,
                                            phone: client.phone,
                                        })
                                    }
                                    className={twMerge(
                                        'flex w-full items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50',
                                        client.id === selectedId && 'border-primary-300 bg-primary-50 hover:bg-primary-50',
                                    )}
                                >
                                    <Div className="flex min-w-0 flex-col">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-medium">
                                            {`${client.firstName} ${client.lastName}`}
                                        </Label>
                                        {client.phone || client.cin ? (
                                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                                {[client.phone, client.cin ? t('cinValue', { value: client.cin }) : null]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </Label>
                                        ) : null}
                                    </Div>
                                    {client.remaining > 0 ? (
                                        <Label variant={EVariantLabel.caption} color="text-warning-600" className="shrink-0 tabular-nums">
                                            {t('balance', { value: formatMoney(client.remaining) })}
                                        </Label>
                                    ) : null}
                                </button>
                            ))}
                        </Div>

                        {selectedId ? (
                            <Button
                                id="pos-client-clear"
                                type={EButtonType.secondary}
                                size={EButtonSize.medium}
                                text={t('removeClient')}
                                onClick={() => select(null)}
                                className="w-full"
                            />
                        ) : null}
                    </>
                )}
            </Div>
        </Modal>
    );
}
