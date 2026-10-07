'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import CreditClientFormModal from '@/components/Modals/CreditClientFormModal/CreditClientFormModal';
import {
    toClientInput,
    type CreditClientFormValues,
} from '@/components/Organisms/OrganismClientFormFields/OrganismClientFormFields';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { createCreditClient, fetchCreditClients, fetchCreditSummary, type CreditClientListItem } from '@/lib/credit-api';
import { formatMoney } from '@/lib/daily-income-api';
import { Routes } from '@/lib/routes';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

const PER_PAGE = 30;

function ClientCard({ client }: Readonly<{ client: CreditClientListItem }>) {
    const t = useTranslations('admin.credits');

    return (
        <Link
            href={Routes.Pos.client(client.id)}
            className="flex items-stretch gap-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-colors hover:border-primary-200 hover:bg-gray-25"
        >
            <Div className="flex w-20 shrink-0 items-center justify-center bg-gray-100">
                <Icon name={IconComponentsEnum.user} size={ESize.xl} color="text-gray-400" />
            </Div>
            <Div className="flex min-w-0 flex-1 flex-col gap-1 py-3 pr-3">
                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-semibold">
                    {`${client.firstName} ${client.lastName}`}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                    {client.phone || t('noPhone')}
                </Label>
                <Div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
                    <Badge
                        id={`pos-client-remaining-${client.id}`}
                        text={client.remaining > 0 ? formatMoney(client.remaining) : t('settled')}
                        type={client.remaining > 0 ? EBadgeType.warning : EBadgeType.success}
                        size={EBadgeSize.small}
                    />
                    {client.creditCount > 0 ? (
                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                            {t('creditCount', { count: client.creditCount })}
                        </Label>
                    ) : null}
                </Div>
            </Div>
        </Link>
    );
}

export default function PosClientsPage() {
    const t = useTranslations('pos.clients');
    const tCredits = useTranslations('admin.credits');
    const tCommon = useTranslations('common');
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ['credit-clients', page, debouncedSearch],
        queryFn: () => fetchCreditClients({ page, perPage: PER_PAGE, search: debouncedSearch || undefined }),
    });

    const { data: summary } = useQuery({
        queryKey: ['credit-summary'],
        queryFn: fetchCreditSummary,
    });

    const createMutation = useMutation({
        mutationFn: createCreditClient,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['credit-clients'] });
            void queryClient.invalidateQueries({ queryKey: ['credit-summary'] });
            openToast(tCommon('success'), tCredits('createClient'), { type: EToastType.SUCCESS });
            closeModal();
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const handleCreate = async (values: CreditClientFormValues) => {
        await createMutation.mutateAsync(toClientInput(values));
    };

    const clients = data?.data ?? [];
    const total = data?.meta?.total ?? 0;
    const lastPage = data?.meta?.lastPage ?? 1;
    const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
    const to = Math.min(page * PER_PAGE, total);

    return (
        <>
            {modalPortal(
                <CreditClientFormModal client={null} onSubmit={handleCreate} isLoading={createMutation.isPending} />,
            )}
            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                rightActions={
                    <Button
                        id="pos-client-add-btn"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                        text={tCredits('createClient')}
                        onClick={() => openModal()}
                    />
                }
                mainSection={
                    <Div className="space-y-4">
                        <Div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                icon={IconComponentsEnum.alert}
                                iconBg="bg-warning-50"
                                iconColor="text-warning-600"
                                label={tCredits('totalRemaining')}
                                value={summary ? formatMoney(summary.remaining) : '—'}
                            />
                            <StatCard
                                icon={IconComponentsEnum.layers}
                                iconBg="bg-primary-50"
                                iconColor="text-primary-600"
                                label={tCredits('totalCredit')}
                                value={summary ? formatMoney(summary.totalCredit) : '—'}
                            />
                            <StatCard
                                icon={IconComponentsEnum.checkCircle}
                                iconBg="bg-success-50"
                                iconColor="text-success-600"
                                label={tCredits('totalPaid')}
                                value={summary ? formatMoney(summary.totalPaid) : '—'}
                            />
                            <StatCard
                                icon={IconComponentsEnum.users}
                                iconBg="bg-gray-100"
                                iconColor="text-gray-600"
                                label={tCredits('clientsWithBalance')}
                                value={summary ? String(summary.clientsWithBalance) : '—'}
                            />
                        </Div>

                        <Div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Input
                                id="pos-clients-search"
                                leftIcon="search"
                                placeholder={t('searchPlaceholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                containerClassName="w-full sm:max-w-sm"
                            />
                            <Div className="flex items-center justify-end gap-2 sm:ml-auto">
                                <Label variant={EVariantLabel.caption} color="text-gray-600" className="tabular-nums">
                                    {tCommon('showingRange', { from, to, total })}
                                </Label>
                                <Icon
                                    name={IconComponentsEnum.chevronLeft}
                                    size={ESize.md}
                                    color={page > 1 ? 'text-gray-700' : 'text-gray-300'}
                                    handleClick={page > 1 ? () => setPage(page - 1) : undefined}
                                    className={page > 1 ? 'cursor-pointer' : 'cursor-not-allowed'}
                                />
                                <Icon
                                    name={IconComponentsEnum.chevronRight}
                                    size={ESize.md}
                                    color={page < lastPage ? 'text-gray-700' : 'text-gray-300'}
                                    handleClick={page < lastPage ? () => setPage(page + 1) : undefined}
                                    className={page < lastPage ? 'cursor-pointer' : 'cursor-not-allowed'}
                                />
                            </Div>
                        </Div>

                        {isLoading ? (
                            <Div className="flex justify-center py-16">
                                <Spinner size={ESize.lg} color="text-primary-500" />
                            </Div>
                        ) : null}

                        {!isLoading && clients.length === 0 ? (
                            <Div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                    {tCredits('emptyClients')}
                                </Label>
                            </Div>
                        ) : null}

                        <Div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {clients.map((client) => (
                                <ClientCard key={client.id} client={client} />
                            ))}
                        </Div>
                    </Div>
                }
            />
        </>
    );
}
