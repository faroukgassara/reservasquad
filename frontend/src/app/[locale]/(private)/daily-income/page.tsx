'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
    updateDailyIncome,
    updateIncomeLine,
    type DailyIncomeRecord,
    type IncomeLineRecord,
    type IncomeLineType,
} from '@/lib/daily-income-api';
import { exportDailyIncomePdf } from '@/lib/export-daily-income-pdf';
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
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | { type: 'day-form'; entry: DailyIncomeRecord | null }
    | { type: 'day-delete'; entry: DailyIncomeRecord }
    | { type: 'line-form'; line: IncomeLineRecord | null }
    | { type: 'line-delete'; line: IncomeLineRecord }
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
    const [lineFilter, setLineFilter] = useState<LineFilter>('all');
    const [modalState, setModalState] = useState<ModalState>(null);
    const [isExporting, setIsExporting] = useState(false);
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Dashboard);
    }, [isAdmin, router]);

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['daily-income'] });
        queryClient.invalidateQueries({ queryKey: ['daily-income-summary'] });
        queryClient.invalidateQueries({ queryKey: ['income-lines'] });
    }, [queryClient]);

    const { data: listData, isLoading: daysLoading } = useQuery({
        queryKey: ['daily-income', year, month],
        queryFn: () => fetchDailyIncomes({ year, month }),
        enabled: isAdmin,
    });

    const { data: summary } = useQuery({
        queryKey: ['daily-income-summary', year, month],
        queryFn: () => fetchDailyIncomeSummary({ year, month }),
        enabled: isAdmin,
    });

    const { data: linesData, isLoading: linesLoading } = useQuery({
        queryKey: ['income-lines', year, month],
        queryFn: () => fetchIncomeLines({ year, month }),
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
            else bucket.investments += amount;
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

    const lineFilterOptions = useMemo(
        () => [
            { value: 'all', label: t('allTypes') },
            { value: 'CHARGE', label: t('charge') },
            { value: 'INVESTMENT', label: t('investment') },
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
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell mainText={formatDate(row.date)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'totalIncome',
                    label: t('totalIncome'),
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.totalIncome)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'chargesInvestment',
                    label: t('chargesInvestment'),
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
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.savings)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'benefits',
                    label: t('benefits'),
                    render: (_: unknown, row: DailyIncomeRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.benefits ?? 0)} />
                    ),
                },
            },
        ],
        [t],
    );

    const lineColumns = useMemo(
        (): ITableColumn<IncomeLineRecord>[] => [
            {
                headerElement: {
                    value: 'date',
                    label: t('date'),
                    render: (_: unknown, row: IncomeLineRecord) => (
                        <OrganismTable.Cell mainText={formatDate(row.date)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'type',
                    label: t('type'),
                    render: (_: unknown, row: IncomeLineRecord) => (
                        <Badge
                            id={`line-type-${row.id}`}
                            text={row.type === 'CHARGE' ? t('charge') : t('investment')}
                            type={
                                row.type === 'CHARGE' ? EBadgeType.warning : EBadgeType.success
                            }
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'label',
                    label: t('label'),
                    render: (_: unknown, row: IncomeLineRecord) => (
                        <OrganismTable.Cell mainText={row.label} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'amount',
                    label: t('amount'),
                    render: (_: unknown, row: IncomeLineRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.amount)} />
                    ),
                },
            },
        ],
        [t],
    );

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

    const summaryCards = [
        { key: 'income', label: t('totalIncome'), value: summary?.totalIncome ?? 0 },
        { key: 'charges', label: t('totalCharges'), value: summary?.totalCharges ?? 0 },
        {
            key: 'investments',
            label: t('totalInvestments'),
            value: summary?.totalInvestments ?? 0,
        },
        { key: 'savings', label: t('totalSavings'), value: summary?.totalSavings ?? 0 },
        { key: 'benefits', label: t('totalBenefits'), value: summary?.totalBenefits ?? 0 },
        { key: 'net', label: t('netBalance'), value: summary?.netBalance ?? 0 },
    ];

    const handleExportPdf = useCallback(() => {
        setIsExporting(true);
        try {
            exportDailyIncomePdf({
                year,
                month,
                monthLabel: t(`months.${month}` as 'months.1'),
                days,
                lines: allLines,
                summary,
                labels: {
                    title: t('exportTitle'),
                    period: t('exportPeriod', {
                        month: t(`months.${month}` as 'months.1'),
                        year,
                    }),
                    totalIncome: t('totalIncome'),
                    totalCharges: t('totalCharges'),
                    totalInvestments: t('totalInvestments'),
                    totalSavings: t('totalSavings'),
                    totalBenefits: t('totalBenefits'),
                    netBalance: t('netBalance'),
                    daysTitle: t('daysTitle'),
                    linesTitle: t('linesTitle'),
                    date: t('date'),
                    chargesInvestment: t('chargesInvestment'),
                    savings: t('savings'),
                    benefits: t('benefits'),
                    type: t('type'),
                    label: t('label'),
                    amount: t('amount'),
                    charge: t('charge'),
                    investment: t('investment'),
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
    }, [allLines, days, month, openToast, summary, t, tCommon, year]);

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
                            <Div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
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

                        <Div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            {summaryCards.map((card) => (
                                <Div
                                    key={card.key}
                                    className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col justify-center"
                                >
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color="text-gray-500"
                                        className="mb-1 block"
                                    >
                                        {card.label}
                                    </Label>
                                    <Label
                                        variant={EVariantLabel.body}
                                        color="text-primary-700"
                                        className="block font-semibold"
                                    >
                                        {formatMoney(card.value)}
                                    </Label>
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
                                                if (
                                                    value === 'all' ||
                                                    value === 'CHARGE' ||
                                                    value === 'INVESTMENT'
                                                ) {
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
