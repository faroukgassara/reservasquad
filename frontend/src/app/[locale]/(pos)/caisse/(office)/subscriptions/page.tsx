'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import { twMerge } from 'tailwind-merge';
import { usePosSubscriptionColumns } from '@/hooks/usePosSubscriptionColumns';
import {
    fetchSubscriptions,
    fetchSubscriptionSummary,
    type Subscription,
    type SubscriptionState,
    type SubscriptionStatus,
} from '@/lib/pos-api';
import { Routes } from '@/lib/routes';
import { EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';

const PER_PAGE = 20;

type Filter = 'all' | 'DRAFT' | SubscriptionState | 'CANCELLED';

const FILTERS: { value: Filter; status?: SubscriptionStatus; state?: SubscriptionState }[] = [
    { value: 'all' },
    { value: 'DRAFT', status: 'DRAFT' },
    { value: 'running', state: 'running' },
    { value: 'expiring', state: 'expiring' },
    { value: 'expired', state: 'expired' },
    { value: 'CANCELLED', status: 'CANCELLED' },
];

export default function PosSubscriptionsPage() {
    const t = useTranslations('pos.subscriptions');
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const columns = usePosSubscriptionColumns({ withClient: true });

    const { status, state } = FILTERS.find((item) => item.value === filter) ?? FILTERS[0];

    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['subscriptions-summary'],
        queryFn: fetchSubscriptionSummary,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['subscriptions', page, search, filter],
        queryFn: () =>
            fetchSubscriptions({ page, perPage: PER_PAGE, search: search || undefined, status, state }),
    });

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            rightActions={
                <Button
                    id="subscription-new"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                    text={t('new')}
                    onClick={() => router.push(Routes.Pos.subscription('new'))}
                />
            }
            mainSection={
                <Div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setFilter('all');
                                setPage(1);
                            }}
                            className={twMerge(
                                'text-start rounded-2xl transition-all focus:outline-none cursor-pointer',
                                filter === 'all'
                                    ? 'ring-2 ring-primary-500 shadow-md'
                                    : 'hover:border-gray-300 hover:shadow-xs',
                            )}
                        >
                            <StatCard
                                icon={IconComponentsEnum.layers}
                                iconBg="bg-primary-50 dark:bg-primary-950/40"
                                iconColor="text-primary-600"
                                label={t('filter_all')}
                                value={summary?.all != null ? String(summary.all) : data?.meta?.total != null && filter === 'all' ? String(data.meta.total) : '—'}
                                isLoading={isSummaryLoading && !summary}
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFilter('running');
                                setPage(1);
                            }}
                            className={twMerge(
                                'text-start rounded-2xl transition-all focus:outline-none cursor-pointer',
                                filter === 'running'
                                    ? 'ring-2 ring-success-500 shadow-md'
                                    : 'hover:border-gray-300 hover:shadow-xs',
                            )}
                        >
                            <StatCard
                                icon={IconComponentsEnum.checkCircle}
                                iconBg="bg-success-50 dark:bg-success-950/40"
                                iconColor="text-success-600"
                                label={t('filter_running')}
                                value={summary?.running != null ? String(summary.running) : data?.meta?.total != null && filter === 'running' ? String(data.meta.total) : '—'}
                                isLoading={isSummaryLoading && !summary}
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFilter('expiring');
                                setPage(1);
                            }}
                            className={twMerge(
                                'text-start rounded-2xl transition-all focus:outline-none cursor-pointer',
                                filter === 'expiring'
                                    ? 'ring-2 ring-warning-500 shadow-md'
                                    : 'hover:border-gray-300 hover:shadow-xs',
                            )}
                        >
                            <StatCard
                                icon={IconComponentsEnum.alert}
                                iconBg="bg-warning-50 dark:bg-warning-950/40"
                                iconColor="text-warning-600"
                                label={t('filter_expiring')}
                                value={summary?.expiring != null ? String(summary.expiring) : data?.meta?.total != null && filter === 'expiring' ? String(data.meta.total) : '—'}
                                isLoading={isSummaryLoading && !summary}
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFilter('expired');
                                setPage(1);
                            }}
                            className={twMerge(
                                'text-start rounded-2xl transition-all focus:outline-none cursor-pointer',
                                filter === 'expired'
                                    ? 'ring-2 ring-danger-500 shadow-md'
                                    : 'hover:border-gray-300 hover:shadow-xs',
                            )}
                        >
                            <StatCard
                                icon={IconComponentsEnum.clock}
                                iconBg="bg-danger-50 dark:bg-danger-950/40"
                                iconColor="text-danger-600"
                                label={t('filter_expired')}
                                value={summary?.expired != null ? String(summary.expired) : data?.meta?.total != null && filter === 'expired' ? String(data.meta.total) : '—'}
                                isLoading={isSummaryLoading && !summary}
                            />
                        </button>
                    </div>
                    <Div className="flex justify-end">
                        <Dropdown
                            leftIcon="filter"
                            options={FILTERS.map((item) => ({ value: item.value, label: t(`filter_${item.value}`) }))}
                            value={filter}
                            onChange={(value) => {
                                setFilter(value as Filter);
                                setPage(1);
                            }}
                            containerClassName="w-full sm:w-56"
                        />
                    </Div>
                    <OrganismTable<Subscription>
                        columns={columns}
                        rows={data?.data ?? []}
                        pageSize={PER_PAGE}
                        searchable
                        searchValue={search}
                        onSearchChange={(value) => {
                            setSearch(value);
                            setPage(1);
                        }}
                        placeholder={t('searchPlaceholder')}
                        isLoading={isLoading}
                        emptyMessage={t('empty')}
                        page={page}
                        totalRows={data?.meta?.total ?? 0}
                        onPageChange={setPage}
                        onClickRow={(row) => router.push(Routes.Pos.subscription(row.id))}
                    />
                </Div>
            }
        />
    );
}
