'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import { usePosSubscriptionColumns } from '@/hooks/usePosSubscriptionColumns';
import {
    fetchSubscriptions,
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
                <Div className="space-y-3">
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
