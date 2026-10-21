'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import CreditClientFormModal from '@/components/Modals/CreditClientFormModal/CreditClientFormModal';
import {
    toClientInput,
    type CreditClientFormValues,
} from '@/components/Organisms/OrganismClientFormFields/OrganismClientFormFields';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
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
    EInputSize,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';
import { IDropdownOption } from '@/interfaces/IPrimitives/IDropdown/IDropdown';

const PER_PAGE = 10;
type ClientFilter = 'all' | 'with_balance' | 'settled';
type ClientSort = 'alpha_asc' | 'alpha_desc' | 'created_desc' | 'created_asc';

export default function PosClientsPage() {
    const t = useTranslations('pos.clients');
    const tCredits = useTranslations('admin.credits');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter] = useState<ClientFilter>('all');
    const [sortBy, setSortBy] = useState<string>('firstName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [sortSelection, setSortSelection] = useState<ClientSort>('alpha_asc');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ['credit-clients', page, debouncedSearch, filter, sortBy, sortOrder],
        queryFn: () =>
            fetchCreditClients({
                page,
                perPage: PER_PAGE,
                search: debouncedSearch || undefined,
                filter,
                sortBy,
                sortOrder,
            }),
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

    const filterOptions: IDropdownOption[] = useMemo(
        () => [
            {
                value: 'all',
                label: t('allClients'),
                icon: <Icon name={IconComponentsEnum.users} size={ESize.sm} color="text-gray-400" />,
            },
            {
                value: 'with_balance',
                label: `${t('withBalance')}${summary?.clientsWithBalance ? ` (${summary.clientsWithBalance})` : ''}`,
                icon: <Icon name={IconComponentsEnum.alert} size={ESize.sm} color="text-warning-600" />,
            },
            {
                value: 'settled',
                label: t('settled'),
                icon: <Icon name={IconComponentsEnum.checkCircle} size={ESize.sm} color="text-success-600" />,
            },
        ],
        [summary?.clientsWithBalance, t],
    );

    const sortOptions: IDropdownOption[] = useMemo(
        () => [
            {
                value: 'alpha_asc',
                label: t('sortAlphaAsc'),
                icon: <Icon name={IconComponentsEnum.arrowUp} size={ESize.sm} color="text-gray-500" />,
            },
            {
                value: 'alpha_desc',
                label: t('sortAlphaDesc'),
                icon: <Icon name={IconComponentsEnum.arrowDown} size={ESize.sm} color="text-gray-500" />,
            },
            {
                value: 'created_desc',
                label: t('sortDateDesc'),
                icon: <Icon name={IconComponentsEnum.clock} size={ESize.sm} color="text-gray-500" />,
            },
            {
                value: 'created_asc',
                label: t('sortDateAsc'),
                icon: <Icon name={IconComponentsEnum.clock} size={ESize.sm} color="text-gray-500" />,
            },
        ],
        [t],
    );

    const handleSortChange = (val: string | number | (string | number)[]) => {
        if (typeof val !== 'string') return;
        const next = val as ClientSort;
        setSortSelection(next);
        if (next === 'alpha_asc') {
            setSortBy('firstName');
            setSortOrder('asc');
        } else if (next === 'alpha_desc') {
            setSortBy('firstName');
            setSortOrder('desc');
        } else if (next === 'created_desc') {
            setSortBy('createdAt');
            setSortOrder('desc');
        } else if (next === 'created_asc') {
            setSortBy('createdAt');
            setSortOrder('asc');
        }
        setPage(1);
    };

    const columns = useMemo(
        (): ITableColumn<CreditClientListItem>[] => [
            {
                headerElement: {
                    value: 'name',
                    label: t('client'),
                    sortable: true,
                    mobile: 'primary',
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell
                            mainText={`${row.firstName} ${row.lastName}`}
                            supportingText={row.email || undefined}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'phone',
                    label: t('phone'),
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell
                            mainText={row.phone || tCredits('noPhone')}
                            supportingText={
                                row.cin
                                    ? t('cinValue', { value: row.cin })
                                    : row.taxId
                                      ? t('taxIdValue', { value: row.taxId })
                                      : undefined
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'totalCredit',
                    label: t('totalCredit'),
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell
                            mainText={formatMoney(row.totalCredit)}
                            supportingText={
                                row.creditCount > 0
                                    ? tCredits('creditCount', { count: row.creditCount })
                                    : undefined
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'totalPaid',
                    label: t('totalPaid'),
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell mainText={formatMoney(row.totalPaid)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'remaining',
                    label: t('balance'),
                    mobile: 'secondary',
                    render: (_: unknown, row: CreditClientListItem) => (
                        <Badge
                            id={`pos-client-remaining-${row.id}`}
                            text={row.remaining > 0 ? formatMoney(row.remaining) : tCredits('settled')}
                            type={row.remaining > 0 ? EBadgeType.warning : EBadgeType.success}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [t, tCredits],
    );

    const totalRows = data?.meta?.total ?? 0;
    const hasActiveFilters = filter !== 'all' || Boolean(debouncedSearch) || sortSelection !== 'alpha_asc';

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
                        {/* Summary KPI Cards with quick-filter click */}
                        <Div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setFilter('with_balance');
                                    setPage(1);
                                }}
                                className={twMerge(
                                    'text-start rounded-2xl transition-all focus:outline-none cursor-pointer',
                                    filter === 'with_balance'
                                        ? 'ring-2 ring-warning-500 shadow-md'
                                        : 'hover:border-gray-300 hover:shadow-xs',
                                )}
                            >
                                <StatCard
                                    icon={IconComponentsEnum.alert}
                                    iconBg="bg-warning-50"
                                    iconColor="text-warning-700"
                                    label={tCredits('totalRemaining')}
                                    value={summary ? formatMoney(summary.remaining) : '—'}
                                />
                            </button>
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
                                    iconBg="bg-primary-50"
                                    iconColor="text-primary-600"
                                    label={tCredits('totalCredit')}
                                    value={summary ? formatMoney(summary.totalCredit) : '—'}
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setFilter('settled');
                                    setPage(1);
                                }}
                                className={twMerge(
                                    'text-start rounded-2xl transition-all focus:outline-none cursor-pointer',
                                    filter === 'settled'
                                        ? 'ring-2 ring-success-500 shadow-md'
                                        : 'hover:border-gray-300 hover:shadow-xs',
                                )}
                            >
                                <StatCard
                                    icon={IconComponentsEnum.checkCircle}
                                    iconBg="bg-success-50"
                                    iconColor="text-success-700"
                                    label={tCredits('totalPaid')}
                                    value={summary ? formatMoney(summary.totalPaid) : '—'}
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setFilter((current) => (current === 'with_balance' ? 'all' : 'with_balance'));
                                    setPage(1);
                                }}
                                className={twMerge(
                                    'text-start rounded-2xl transition-all focus:outline-none cursor-pointer',
                                    filter === 'with_balance'
                                        ? 'ring-2 ring-warning-500 shadow-md'
                                        : 'hover:border-gray-300 hover:shadow-xs',
                                )}
                            >
                                <StatCard
                                    icon={IconComponentsEnum.users}
                                    iconBg="bg-gray-100"
                                    iconColor="text-gray-600"
                                    label={tCredits('clientsWithBalance')}
                                    value={summary ? String(summary.clientsWithBalance) : '—'}
                                />
                            </button>
                        </Div>

                        {/* Dedicated, Optimized Search & Dropdown Toolbar */}
                        <Div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                            <Div className="relative w-full lg:flex-1 lg:max-w-md">
                                <Input
                                    id="pos-clients-search"
                                    leftIcon={IconComponentsEnum.search}
                                    rightIcon={search ? IconComponentsEnum.close : undefined}
                                    onRightIconClick={() => {
                                        setSearch('');
                                        setDebouncedSearch('');
                                    }}
                                    placeholder={t('searchPlaceholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setSearch('');
                                            setDebouncedSearch('');
                                        }
                                        if (e.key === 'Enter') {
                                            setDebouncedSearch(search.trim());
                                        }
                                    }}
                                    size={EInputSize.medium}
                                    containerClassName="w-full"
                                />
                            </Div>

                            <Div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                <Dropdown
                                    id="pos-clients-filter-dropdown"
                                    leftIcon={
                                        filter === 'with_balance'
                                            ? IconComponentsEnum.alert
                                            : filter === 'settled'
                                              ? IconComponentsEnum.checkCircle
                                              : IconComponentsEnum.filter
                                    }
                                    options={filterOptions}
                                    value={filter}
                                    onChange={(val) => {
                                        setFilter(val as ClientFilter);
                                        setPage(1);
                                    }}
                                    size={EInputSize.medium}
                                    className={
                                        filter === 'with_balance'
                                            ? 'border-warning-300 bg-warning-50/25'
                                            : filter === 'settled'
                                              ? 'border-success-300 bg-success-50/25'
                                              : ''
                                    }
                                    containerClassName="w-full sm:w-56"
                                />
                                <Dropdown
                                    id="pos-clients-sort-dropdown"
                                    leftIcon={
                                        sortSelection.startsWith('created')
                                            ? IconComponentsEnum.clock
                                            : sortSelection === 'alpha_desc'
                                              ? IconComponentsEnum.arrowDown
                                              : IconComponentsEnum.arrowUp
                                    }
                                    options={sortOptions}
                                    value={sortSelection}
                                    onChange={handleSortChange}
                                    size={EInputSize.medium}
                                    className={sortSelection !== 'alpha_asc' ? 'border-primary-300 bg-primary-50/25' : ''}
                                    containerClassName="w-full sm:w-56"
                                />
                                {hasActiveFilters ? (
                                    <Button
                                        id="pos-clients-reset-filters"
                                        type={EButtonType.secondary}
                                        size={EButtonSize.medium}
                                        iconPosition="left"
                                        icon={{ name: IconComponentsEnum.rotate, size: ESize.sm, color: 'text-gray-500' }}
                                        text={tCommon('reset')}
                                        onClick={() => {
                                            setSearch('');
                                            setDebouncedSearch('');
                                            setFilter('all');
                                            setSortSelection('alpha_asc');
                                            setSortBy('firstName');
                                            setSortOrder('asc');
                                            setPage(1);
                                        }}
                                    />
                                ) : null}
                            </Div>
                        </Div>

                        {/* Active Filter Chips / Result Counts */}
                        {hasActiveFilters ? (
                            <Div className="flex flex-wrap items-center gap-2 px-1">
                                <Label variant={EVariantLabel.caption} color="text-gray-500">
                                    {tCommon('filter')}:
                                </Label>
                                {debouncedSearch ? (
                                    <Badge
                                        id="pos-clients-active-search-badge"
                                        text={`"${debouncedSearch}"`}
                                        type={EBadgeType.primary}
                                        size={EBadgeSize.small}
                                        isDismissible
                                        onDismiss={() => {
                                            setSearch('');
                                            setDebouncedSearch('');
                                        }}
                                    />
                                ) : null}
                                {filter !== 'all' ? (
                                    <Badge
                                        id="pos-clients-active-filter-badge"
                                        text={filter === 'with_balance' ? t('withBalance') : t('settled')}
                                        type={filter === 'with_balance' ? EBadgeType.warning : EBadgeType.success}
                                        size={EBadgeSize.small}
                                        isDismissible
                                        onDismiss={() => {
                                            setFilter('all');
                                            setPage(1);
                                        }}
                                    />
                                ) : null}
                                {sortSelection !== 'alpha_asc' ? (
                                    <Badge
                                        id="pos-clients-active-sort-badge"
                                        text={
                                            sortSelection === 'alpha_desc'
                                                ? t('sortAlphaDesc')
                                                : sortSelection === 'created_desc'
                                                  ? t('sortDateDesc')
                                                  : t('sortDateAsc')
                                        }
                                        type={EBadgeType.revprimary}
                                        size={EBadgeSize.small}
                                        isDismissible
                                        onDismiss={() => {
                                            setSortSelection('alpha_asc');
                                            setSortBy('firstName');
                                            setSortOrder('asc');
                                            setPage(1);
                                        }}
                                    />
                                ) : null}
                                <Label variant={EVariantLabel.caption} color="text-gray-500" className="ms-auto tabular-nums">
                                    {tCommon('showingRange', {
                                        from: totalRows === 0 ? 0 : (page - 1) * PER_PAGE + 1,
                                        to: Math.min(page * PER_PAGE, totalRows),
                                        total: totalRows,
                                    })}
                                </Label>
                            </Div>
                        ) : null}

                        {/* Table */}
                        <OrganismTable<CreditClientListItem>
                            columns={columns}
                            rows={data?.data ?? []}
                            pageSize={PER_PAGE}
                            searchable={false}
                            sortConfig={{ key: sortBy === 'firstName' ? 'name' : sortBy, direction: sortOrder }}
                            onSort={(key, direction) => {
                                if (key === 'name') {
                                    setSortBy('firstName');
                                    setSortOrder(direction);
                                    setSortSelection(direction === 'asc' ? 'alpha_asc' : 'alpha_desc');
                                } else {
                                    setSortBy(key);
                                    setSortOrder(direction);
                                    if (key === 'createdAt') {
                                        setSortSelection(direction === 'desc' ? 'created_desc' : 'created_asc');
                                    }
                                }
                                setPage(1);
                            }}
                            isLoading={isLoading}
                            emptyMessage={hasActiveFilters ? t('noMatchingClients') : tCredits('emptyClients')}
                            page={page}
                            totalRows={totalRows}
                            onPageChange={setPage}
                            onClickRow={(row) => router.push(Routes.Pos.client(row.id))}
                        />
                    </Div>
                }
            />
        </>
    );
}
