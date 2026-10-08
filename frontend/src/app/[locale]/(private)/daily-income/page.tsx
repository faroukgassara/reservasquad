'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Badge from '@/components/Primitives/Badge/Badge';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import DailyIncomeFormModal, {
    type DailyIncomeFormValues,
} from '@/components/Modals/DailyIncomeFormModal/DailyIncomeFormModal';
import IncomeLineFormModal, {
    type IncomeLineFormValues,
} from '@/components/Modals/IncomeLineFormModal/IncomeLineFormModal';
import PreviousMonthRestFormModal from '@/components/Modals/PreviousMonthRestFormModal/PreviousMonthRestFormModal';
import Icon from '@/components/Primitives/Icon/Icon';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import {
    createDailyIncome,
    createIncomeLine,
    deleteDailyIncome,
    deleteIncomeLine,
    fetchDailyIncomeSummary,
    fetchDailyIncomes,
    fetchIncomeLines,
    formatMoney,
    setPreviousMonthRest,
    updateDailyIncome,
    updateIncomeLine,
    type DailyIncomeRecord,
    type IncomeLineRecord,
    type IncomeLineType,
    type DailyIncomeScope,
    isIncomeLineType,
} from '@/lib/daily-income-api';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import { exportDailyIncomePdf } from '@/lib/export-daily-income-pdf';
import StatCard from '@/components/Primitives/StatCard/StatCard';
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
import type { ELabelColor } from '@/theme/labelColors';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | { type: 'day-form'; entry: DailyIncomeRecord | null }
    | { type: 'day-delete'; entry: DailyIncomeRecord }
    | { type: 'line-form'; line: IncomeLineRecord | null }
    | { type: 'line-delete'; line: IncomeLineRecord }
    | { type: 'previous-month-rest' }
    | null;

type LineFilter = 'all' | IncomeLineType;

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export default function DailyIncomePage() {
    const t = useTranslations('admin.dailyIncome');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [scope, setScope] = useState<DailyIncomeScope>('month');
    const isGlobal = scope === 'all';
    const [lineFilter, setLineFilter] = useState<LineFilter>('all');
    const [modalState, setModalState] = useState<ModalState>(null);
    const [isExporting, setIsExporting] = useState(false);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Today);
    }, [isAdmin, router]);

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['daily-income'] });
        queryClient.invalidateQueries({ queryKey: ['daily-income-summary'] });
        queryClient.invalidateQueries({ queryKey: ['income-lines'] });
    }, [queryClient]);

    const { data: listData, isLoading: daysLoading } = useQuery({
        queryKey: ['daily-income', scope, year, month],
        queryFn: () => fetchDailyIncomes({ year, month, scope }),
        enabled: isAdmin,
    });

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['daily-income-summary', scope, year, month],
        queryFn: () => fetchDailyIncomeSummary({ year, month, scope }),
        enabled: isAdmin,
    });

    const { data: linesData, isLoading: linesLoading } = useQuery({
        queryKey: ['income-lines', scope, year, month],
        queryFn: () => fetchIncomeLines({ year, month, scope }),
        enabled: isAdmin,
    });

    const dayCreateMutation = useMutation({
        mutationFn: createDailyIncome,
        onSuccess: () => {
            invalidateAll();
            openToast(tCommon('success'), t('createDay'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const dayUpdateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateDailyIncome>[1] }) =>
            updateDailyIncome(id, body),
        onSuccess: () => {
            invalidateAll();
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const dayDeleteMutation = useMutation({
        mutationFn: deleteDailyIncome,
        onSuccess: () => {
            invalidateAll();
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const lineCreateMutation = useMutation({
        mutationFn: createIncomeLine,
        onSuccess: () => {
            invalidateAll();
            openToast(tCommon('success'), t('createLine'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const lineUpdateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateIncomeLine>[1] }) =>
            updateIncomeLine(id, body),
        onSuccess: () => {
            invalidateAll();
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const lineDeleteMutation = useMutation({
        mutationFn: deleteIncomeLine,
        onSuccess: () => {
            invalidateAll();
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const previousMonthRestMutation = useMutation({
        mutationFn: setPreviousMonthRest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-income-summary'] });
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const days = listData?.data ?? [];
    const allLines = linesData?.data ?? [];
    const lines =
        lineFilter === 'all'
            ? allLines
            : allLines.filter((line) => line.type === lineFilter);

    const linesTotalsByDate = useMemo(() => {
        const map: Record<string, { charges: number; investments: number }> = {};
        for (const line of allLines) {
            const key = line.date.slice(0, 10);
            const bucket = map[key] ?? { charges: 0, investments: 0 };
            const amount = Number(line.amount);
            if (line.type === 'CHARGE') bucket.charges += amount;
            else if (line.type === 'INVESTMENT') bucket.investments += amount;
            map[key] = bucket;
        }
        return map;
    }, [allLines]);

    const yearOptions = useMemo(() => {
        const current = now.getFullYear();
        return Array.from({ length: 6 }, (_, i) => {
            const y = current - 2 + i;
            return { value: String(y), label: String(y) };
        });
    }, [now]);

    const monthOptions = useMemo(() => {
        const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
        return keys.map((m) => ({
            value: String(m),
            label: t(`months.${m}` as 'months.1'),
        }));
    }, [t]);

    const scopeOptions = useMemo(
        () => [
            { value: 'month', label: t('scopeMonth') },
            { value: 'all', label: t('scopeAll') },
        ],
        [t],
    );

    const lineFilterOptions = useMemo(
        () => [
            { value: 'all', label: t('allTypes') },
            { value: 'CHARGE', label: t('charge') },
            { value: 'INVESTMENT', label: t('investment') },
            { value: 'ECOFACTURE', label: t('ecofacture') },
            { value: 'FAROUK', label: t('farouk') },
            { value: 'MAJDI', label: t('majdi') },
        ],
        [t],
    );

    const handleDaySubmit = useCallback(
        async (values: DailyIncomeFormValues) => {
            const payload = {
                date: values.date,
                totalIncome: Number(values.totalIncome),
            };
            if (modalState?.type === 'day-form' && modalState.entry) {
                await dayUpdateMutation.mutateAsync({ id: modalState.entry.id, body: payload });
                return;
            }
            await dayCreateMutation.mutateAsync(payload);
        },
        [dayCreateMutation, dayUpdateMutation, modalState],
    );

    const handleLineSubmit = useCallback(
        async (values: IncomeLineFormValues) => {
            const payload = {
                date: values.date,
                type: values.type,
                label: values.label.trim(),
                amount: Number(values.amount),
            };
            if (modalState?.type === 'line-form' && modalState.line) {
                await lineUpdateMutation.mutateAsync({ id: modalState.line.id, body: payload });
                return;
            }
            await lineCreateMutation.mutateAsync(payload);
        },
        [lineCreateMutation, lineUpdateMutation, modalState],
    );

    const dayColumns = useMemo(
        (): ITableColumn<DailyIncomeRecord>[] => [
            {
                headerElement: {
                    value: 'date',
                    label: t('date'),
                    mobile: 'primary',
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell
                            mainText={formatDate(row.date)}
                            supportingText={
                                row.posSession ? t('posSession', { number: row.posSession.number }) : undefined
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'totalIncome',
                    label: t('totalIncome'),
                    mobile: 'primary',
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.totalIncome)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'chargesInvestment',
                    label: t('chargesInvestment'),
                    mobile: 'secondary',
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell
                            mainText={formatMoney(row.chargesInvestment ?? 0)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'savings',
                    label: t('savings'),
                    mobile: 'secondary',
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.savings)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'benefits',
                    label: t('benefits'),
                    mobile: 'secondary',
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.benefits ?? 0)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'savingsForCharges',
                    label: t('savingsForCharges'),
                    mobile: 'secondary',
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell
                            mainText={formatMoney(row.savingsForCharges ?? 0)}
                        />
                    ),
                },
            },
        ],
        [t],
    );

    const lineColumns = useMemo((): ITableColumn<IncomeLineRecord>[] => {
        const lineTypeLabels: Record<IncomeLineType, string> = {
            CHARGE: t('charge'),
            INVESTMENT: t('investment'),
            ECOFACTURE: t('ecofacture'),
            FAROUK: t('farouk'),
            MAJDI: t('majdi'),
        };
        const lineTypeBadges: Record<IncomeLineType, EBadgeType> = {
            CHARGE: EBadgeType.warning,
            INVESTMENT: EBadgeType.success,
            ECOFACTURE: EBadgeType.primary,
            FAROUK: EBadgeType.revprimary,
            MAJDI: EBadgeType.revsuccess,
        };
        return [
            {
                headerElement: {
                    value: 'date',
                    label: t('date'),
                    mobile: 'primary',
                    render: (_: unknown, row: IncomeLineRecord) => (
                        <OrganismTable.Cell mainText={formatDate(row.date)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'type',
                    label: t('type'),
                    mobile: 'primary',
                    render: (_: unknown, row: IncomeLineRecord) => (
                        <Badge
                            id={`line-type-${row.id}`}
                            text={lineTypeLabels[row.type]}
                            type={lineTypeBadges[row.type]}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'label',
                    label: t('label'),
                    mobile: 'secondary',
                    render: (_: unknown, row: IncomeLineRecord) => (
                        <OrganismTable.Cell mainText={row.label} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'amount',
                    label: t('amount'),
                    mobile: 'secondary',
                    render: (_: unknown, row: IncomeLineRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.amount)} />
                    ),
                },
            },
        ];
    }, [t]);

    const dayActions = useMemo(
        (): ITableAction<DailyIncomeRecord>[] => [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'day-form', entry: row });
                    openModal();
                },
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'day-delete', entry: row });
                    openModal();
                },
            },
        ],
        [openModal, tCommon],
    );

    const lineActions = useMemo(
        (): ITableAction<IncomeLineRecord>[] => [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'line-form', line: row });
                    openModal();
                },
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'line-delete', line: row });
                    openModal();
                },
            },
        ],
        [openModal, tCommon],
    );

    const allSummaryCards: {
        key: string;
        icon: IconComponentsEnum;
        iconBg: string;
        iconColor: ELabelColor;
        label: string;
        value: string;
        action?: ReactNode;
    }[] = [
        {
            key: 'previousMonthRest',
            icon: IconComponentsEnum.calendar,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
            label: t('previousMonthRest'),
            value: formatMoney(summary?.previousMonthRest ?? 0),
            action: (
                <Icon
                    name={IconComponentsEnum.edit}
                    size={ESize.sm}
                    color="text-gray-500"
                    className="cursor-pointer"
                    handleClick={() => {
                        setModalState({ type: 'previous-month-rest' });
                        openModal();
                    }}
                />
            ),
        },
        {
            key: 'income',
            icon: IconComponentsEnum.layers,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: t('totalIncome'),
            value: formatMoney(summary?.totalIncome ?? 0),
        },
        {
            key: 'charges',
            icon: IconComponentsEnum.alert,
            iconBg: 'bg-warning-50',
            iconColor: 'text-warning-700',
            label: t('totalCharges'),
            value: formatMoney(summary?.totalCharges ?? 0),
        },
        {
            key: 'investments',
            icon: IconComponentsEnum.star,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: t('totalInvestments'),
            value: formatMoney(summary?.totalInvestments ?? 0),
        },
        {
            key: 'savings',
            icon: IconComponentsEnum.checkCircle,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: t('totalSavings'),
            value: formatMoney(summary?.totalSavings ?? 0),
        },
        {
            key: 'benefits',
            icon: IconComponentsEnum.gift,
            iconBg: 'bg-accent-50',
            iconColor: 'text-accent-600',
            label: t('totalBenefits'),
            value: formatMoney(summary?.totalBenefits ?? 0),
        },
        {
            key: 'farouk',
            icon: IconComponentsEnum.user,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: t('farouk'),
            value: formatMoney(summary?.totalFarouk ?? 0),
        },
        {
            key: 'majdi',
            icon: IconComponentsEnum.user,
            iconBg: 'bg-success-50',
            iconColor: 'text-success-700',
            label: t('majdi'),
            value: formatMoney(summary?.totalMajdi ?? 0),
        },
        {
            key: 'savingsForCharges',
            icon: IconComponentsEnum.archive,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
            label: t('totalSavingsForCharges'),
            value: formatMoney(summary?.totalSavingsForCharges ?? 0),
        },
        {
            key: 'net',
            icon: IconComponentsEnum.home,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            label: t('netBalance'),
            value: formatMoney(summary?.netBalance ?? 0),
        },
    ];
    const summaryCards = isGlobal
        ? allSummaryCards.filter((card) => card.key !== 'previousMonthRest')
        : allSummaryCards;

    const handleExportPdf = useCallback(() => {
        setIsExporting(true);
        try {
            exportDailyIncomePdf({
                fileStamp: isGlobal ? 'all' : `${year}-${String(month).padStart(2, '0')}`,
                days,
                lines: allLines,
                summary,
                labels: {
                    title: t('exportTitle'),
                    period: isGlobal
                        ? t('scopeAll')
                        : t('exportPeriod', {
                              month: t(`months.${month}` as 'months.1'),
                              year,
                          }),
                    totalIncome: t('totalIncome'),
                    totalCharges: t('totalCharges'),
                    totalInvestments: t('totalInvestments'),
                    totalSavings: t('totalSavings'),
                    totalBenefits: t('totalBenefits'),
                    totalSavingsForCharges: t('totalSavingsForCharges'),
                    netBalance: t('netBalance'),
                    daysTitle: t('daysTitle'),
                    linesTitle: t('linesTitle'),
                    date: t('date'),
                    chargesInvestment: t('chargesInvestment'),
                    savings: t('savings'),
                    benefits: t('benefits'),
                    savingsForCharges: t('savingsForCharges'),
                    type: t('type'),
                    label: t('label'),
                    amount: t('amount'),
                    charge: t('charge'),
                    investment: t('investment'),
                    ecofacture: t('ecofacture'),
                    farouk: t('farouk'),
                    majdi: t('majdi'),
                    empty: tCommon('empty'),
                },
            });
            openToast(tCommon('success'), t('exportSuccess'), { type: EToastType.SUCCESS });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('exportError');
            openToast(tCommon('error'), message, { type: EToastType.ERROR });
        } finally {
            setIsExporting(false);
        }
    }, [allLines, days, isGlobal, month, openToast, summary, t, tCommon, year]);

    const renderModalContent = () => {
        if (modalState?.type === 'day-delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deleteDayConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => dayDeleteMutation.mutate(modalState.entry.id)}
                    isLoading={dayDeleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        if (modalState?.type === 'line-delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deleteLineConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => lineDeleteMutation.mutate(modalState.line.id)}
                    isLoading={lineDeleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        if (modalState?.type === 'day-form') {
            return (
                <DailyIncomeFormModal
                    mode={modalState.entry ? 'edit' : 'create'}
                    entry={modalState.entry}
                    linesTotalsByDate={linesTotalsByDate}
                    onSubmit={handleDaySubmit}
                    isLoading={dayCreateMutation.isPending || dayUpdateMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'previous-month-rest') {
            return (
                <PreviousMonthRestFormModal
                    periodLabel={t('exportPeriod', {
                        month: t(`months.${month}` as 'months.1'),
                        year,
                    })}
                    amount={summary?.previousMonthRest ?? 0}
                    onSubmit={async (amount) => {
                        await previousMonthRestMutation.mutateAsync({ year, month, amount });
                    }}
                    isLoading={previousMonthRestMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'line-form') {
            return (
                <IncomeLineFormModal
                    mode={modalState.line ? 'edit' : 'create'}
                    line={modalState.line}
                    onSubmit={handleLineSubmit}
                    isLoading={lineCreateMutation.isPending || lineUpdateMutation.isPending}
                />
            );
        }
        return null;
    };

    if (!isAdmin) return null;

    return (
        <>
            {modalPortal(renderModalContent())}
            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <Div className="min-h-full space-y-6">
                        <Div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <Div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
                                <Tabs
                                    variant="pills"
                                    options={scopeOptions}
                                    value={scope}
                                    onChange={(value) => {
                                        if (value === 'month' || value === 'all') setScope(value);
                                    }}
                                    className="w-fit"
                                />
                                {isGlobal ? null : (
                                    <>
                                        <Div className="w-full sm:w-36">
                                            <Dropdown
                                                label={t('year')}
                                                options={yearOptions}
                                                value={String(year)}
                                                onChange={(value) => {
                                                    if (typeof value === 'string') setYear(Number(value));
                                                }}
                                            />
                                        </Div>
                                        <Div className="w-full sm:w-44">
                                            <Dropdown
                                                label={t('month')}
                                                options={monthOptions}
                                                value={String(month)}
                                                onChange={(value) => {
                                                    if (typeof value === 'string') setMonth(Number(value));
                                                }}
                                            />
                                        </Div>
                                    </>
                                )}
                            </Div>
                            <Button
                                id="daily-income-export-pdf"
                                type={EButtonType.secondary}
                                size={EButtonSize.medium}
                                text={t('exportPdf')}
                                isLoading={isExporting}
                                onClick={handleExportPdf}
                            />
                        </Div>

                        <Div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {summaryCards.map((card) => (
                                <Div key={card.key}>
                                    <StatCard
                                        icon={card.icon}
                                        iconBg={card.iconBg}
                                        iconColor={card.iconColor}
                                        label={summaryLoading ? '—' : card.label}
                                        value={summaryLoading ? '—' : card.value}
                                        action={summaryLoading ? undefined : card.action}
                                    />
                                </Div>
                            ))}
                        </Div>

                        <Div className="space-y-3">
                            <Div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <Label
                                    variant={EVariantLabel.body}
                                    color="text-primary-700"
                                    className="font-semibold"
                                >
                                    {t('daysTitle')}
                                </Label>
                                <Button
                                    id="daily-income-add-day"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    iconPosition="left"
                                    icon={{
                                        name: IconComponentsEnum.plus,
                                        size: ESize.sm,
                                        color: 'text-white',
                                    }}
                                    text={t('createDay')}
                                    onClick={() => {
                                        setModalState({ type: 'day-form', entry: null });
                                        openModal();
                                    }}
                                />
                            </Div>
                            <OrganismTable<DailyIncomeRecord>
                                columns={dayColumns}
                                rows={days}
                                pageSize={Math.max(days.length, 1)}
                                searchable={false}
                                actions={dayActions}
                                isLoading={daysLoading}
                                emptyMessage={tCommon('empty')}
                                page={1}
                                totalRows={days.length}
                                onPageChange={() => undefined}
                            />
                        </Div>

                        <Div className="space-y-3">
                            <Div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <Label
                                    variant={EVariantLabel.body}
                                    color="text-primary-700"
                                    className="font-semibold"
                                >
                                    {t('linesTitle')}
                                </Label>
                                <Div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
                                    <Div className="w-full sm:w-48">
                                        <Dropdown
                                            label={t('type')}
                                            options={lineFilterOptions}
                                            value={lineFilter}
                                            onChange={(value) => {
                                                if (value === 'all' || isIncomeLineType(value)) {
                                                    setLineFilter(value);
                                                }
                                            }}
                                        />
                                    </Div>
                                    <Button
                                        id="daily-income-add-line"
                                        type={EButtonType.primary}
                                        size={EButtonSize.medium}
                                        iconPosition="left"
                                        icon={{
                                            name: IconComponentsEnum.plus,
                                            size: ESize.sm,
                                            color: 'text-white',
                                        }}
                                        text={t('createLine')}
                                        onClick={() => {
                                            setModalState({ type: 'line-form', line: null });
                                            openModal();
                                        }}
                                    />
                                </Div>
                            </Div>
                            <OrganismTable<IncomeLineRecord>
                                columns={lineColumns}
                                rows={lines}
                                pageSize={Math.max(lines.length, 1)}
                                searchable={false}
                                actions={lineActions}
                                isLoading={linesLoading}
                                emptyMessage={tCommon('empty')}
                                page={1}
                                totalRows={lines.length}
                                onPageChange={() => undefined}
                            />
                        </Div>
                    </Div>
                }
            />
        </>
    );
}
