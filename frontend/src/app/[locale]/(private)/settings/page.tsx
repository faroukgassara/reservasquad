'use client';

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Toggle from '@/components/Primitives/Toggle/Toggle';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useRouter } from '@/i18n/navigation';
import {
    fetchDailyIncomeSettings,
    updateDailyIncomeSettings,
    type DailyIncomeSettings,
} from '@/lib/daily-income-api';
import { fetchPosSettings, updatePosSettings, type PosSettings } from '@/lib/pos-api';
import { Routes } from '@/lib/routes';
import {
    EButtonSize,
    EButtonType,
    EInputSize,
    EInputType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

type SettingsTab = 'allocation' | 'caisse';

const BUCKETS = [
    { key: 'chargesPercentage', label: 'charges', swatch: 'bg-primary-200', accent: 'accent-primary-300' },
    { key: 'savingsPercentage', label: 'savings', swatch: 'bg-success-500', accent: 'accent-success-500' },
    { key: 'benefitsPercentage', label: 'benefits', swatch: 'bg-accent-500', accent: 'accent-accent-500' },
    {
        key: 'savingsForChargesPercentage',
        label: 'savingsForCharges',
        swatch: 'bg-gray-400',
        accent: 'accent-gray-500',
    },
] as const;

type BucketKey = (typeof BUCKETS)[number]['key'];

const toPercent = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

function UnsavedBar({
    visible,
    isSaving,
    onDiscard,
    onSave,
}: Readonly<{ visible: boolean; isSaving: boolean; onDiscard: () => void; onSave: () => void }>) {
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');

    return (
        <AnimatePresence>
            {visible ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="sticky bottom-4 z-20 mt-4"
                >
                    <Div className="flex flex-col gap-3 rounded-2xl bg-primary-900 px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
                        <Div className="flex items-center gap-2.5">
                            <span aria-hidden className="size-2 animate-pulse rounded-full bg-warning-400" />
                            <Label variant={EVariantLabel.bodySmall} color="text-white" className="font-medium">
                                {t('unsavedChanges')}
                            </Label>
                        </Div>
                        <Div className="flex gap-2">
                            <Button
                                id="settings-discard"
                                type={EButtonType.secondary}
                                size={EButtonSize.small}
                                text={tCommon('cancel')}
                                disabled={isSaving}
                                onClick={onDiscard}
                                className="flex-1 justify-center sm:flex-none"
                            />
                            <Button
                                id="settings-save"
                                type={EButtonType.primary}
                                size={EButtonSize.small}
                                text={tCommon('save')}
                                isLoading={isSaving}
                                onClick={onSave}
                                className="flex-1 justify-center bg-accent-500! hover:bg-accent-600! sm:flex-none"
                            />
                        </Div>
                    </Div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

function PanelHeader({
    icon,
    title,
    subtitle,
}: Readonly<{ icon: IconComponentsEnum; title: string; subtitle: string }>) {
    return (
        <Div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <Div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-500">
                <Icon name={icon} size={ESize.sm} color="text-white" />
            </Div>
            <Div className="flex min-w-0 flex-col gap-0.5">
                <Label variant={EVariantLabel.h6} color="text-gray-900" className="font-bold!">
                    {title}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500">
                    {subtitle}
                </Label>
            </Div>
        </Div>
    );
}

function DailyIncomeSettingsForm({ settings }: Readonly<{ settings: DailyIncomeSettings }>) {
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');
    const queryClient = useQueryClient();
    const { openToast } = useToast();

    const initialValues: Record<BucketKey, string> = {
        chargesPercentage: String(settings.chargesPercentage ?? 50),
        savingsPercentage: String(settings.savingsPercentage ?? 20),
        benefitsPercentage: String(settings.benefitsPercentage ?? 20),
        savingsForChargesPercentage: String(settings.savingsForChargesPercentage ?? 10),
    };

    const mutation = useMutation({
        mutationFn: updateDailyIncomeSettings,
        onSuccess: (saved) => {
            queryClient.setQueryData(['daily-income-settings'], saved);
            queryClient.invalidateQueries({ queryKey: ['daily-income'] });
            queryClient.invalidateQueries({ queryKey: ['daily-income-summary'] });
            queryClient.invalidateQueries({ queryKey: ['income-report'] });
            openToast(tCommon('success'), t('dailyIncomeSaved'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const form = useForm({
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            const charges = Number(value.chargesPercentage);
            const savings = Number(value.savingsPercentage);
            const benefits = Number(value.benefitsPercentage);
            const savingsForCharges = Number(value.savingsForChargesPercentage);
            const sum = Math.round((charges + savings + benefits + savingsForCharges) * 100) / 100;
            if (sum !== 100) {
                openToast(tCommon('error'), t('allocationTotalError', { total: sum }), { type: EToastType.ERROR });
                return;
            }
            await mutation.mutateAsync({
                chargesPercentage: charges,
                savingsPercentage: savings,
                benefitsPercentage: benefits,
                savingsForChargesPercentage: savingsForCharges,
            });
        },
    });

    useEffect(() => {
        form.reset({
            chargesPercentage: String(settings.chargesPercentage ?? 50),
            savingsPercentage: String(settings.savingsPercentage ?? 20),
            benefitsPercentage: String(settings.benefitsPercentage ?? 20),
            savingsForChargesPercentage: String(settings.savingsForChargesPercentage ?? 10),
        });
    }, [settings, form]);

    const percentValidator = ({ value }: { value: string }) => {
        const n = Number(value);
        return !Number.isFinite(n) || n < 0 || n > 100 ? '0 - 100%' : undefined;
    };

    return (
        <Div>
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <form.Subscribe selector={(state) => state.values}>
                    {(values) => {
                        const total =
                            Math.round(BUCKETS.reduce((sum, bucket) => sum + toPercent(values[bucket.key]), 0) * 100) /
                            100;
                        const diff = Math.round((100 - total) * 100) / 100;
                        const isValid = diff === 0;

                        let statusText = t('allocationValid');
                        if (diff > 0) statusText = t('allocationRemaining', { value: diff });
                        if (diff < 0) statusText = t('allocationOver', { value: Math.abs(diff) });

                        return (
                            <Div className="bg-primary-500 px-5 pb-5 pt-4 sm:px-6">
                                <Div className="flex flex-wrap items-start justify-between gap-4">
                                    <Div className="flex min-w-0 flex-col gap-0.5">
                                        <Label variant={EVariantLabel.h6} color="text-white" className="font-bold!">
                                            {t('dailyIncomeTitle')}
                                        </Label>
                                        <Label variant={EVariantLabel.caption} color="text-primary-50">
                                            {t('dailyIncomeSubtitle')}
                                        </Label>
                                    </Div>
                                    <Div className="flex items-baseline gap-2">
                                        <Label
                                            variant={EVariantLabel.h2}
                                            color="text-white"
                                            className="font-bold! leading-none tabular-nums"
                                        >
                                            {total}%
                                        </Label>
                                    </Div>
                                </Div>

                                <Div className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/15">
                                    {BUCKETS.map((bucket) => {
                                        const width = Math.min(100, Math.max(0, toPercent(values[bucket.key])));
                                        if (width === 0) return null;
                                        return (
                                            <Div
                                                key={bucket.key}
                                                className={`${bucket.swatch} transition-all duration-300 first:rounded-s-full last:rounded-e-full`}
                                                style={{ width: `${width}%` }}
                                            />
                                        );
                                    })}
                                </Div>

                                <Div className="mt-3 flex items-center gap-2">
                                    <Icon
                                        name={isValid ? IconComponentsEnum.checkCircle : IconComponentsEnum.alert}
                                        size={ESize.xs}
                                        color={isValid ? 'text-success-300' : 'text-warning-300'}
                                    />
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color={isValid ? 'text-success-200' : 'text-warning-200'}
                                        className="font-medium"
                                    >
                                        {statusText}
                                    </Label>
                                </Div>
                            </Div>
                        );
                    }}
                </form.Subscribe>

                <Div className="divide-y divide-gray-100">
                    {BUCKETS.map((bucket) => (
                        <form.Field key={bucket.key} name={bucket.key} validators={{ onChange: percentValidator }}>
                            {({ state, handleChange }) => (
                                <Div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 px-5 py-3.5 sm:grid-cols-[13rem_1fr_7rem] sm:px-6">
                                    <Div className="flex min-w-0 items-center gap-2.5">
                                        <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${bucket.swatch}`} />
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-gray-900"
                                            className="truncate font-medium"
                                        >
                                            {t(`buckets.${bucket.label}`)}
                                        </Label>
                                    </Div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={1}
                                        aria-label={t(`buckets.${bucket.label}`)}
                                        value={Math.min(100, Math.max(0, toPercent(state.value)))}
                                        onChange={(e) => handleChange(e.target.value)}
                                        className={`order-last col-span-2 h-1.5 w-full cursor-pointer sm:order-none sm:col-span-1 ${bucket.accent}`}
                                    />
                                    <Input
                                        id={`settings-${bucket.key}`}
                                        size={EInputSize.small}
                                        type={EInputType.number}
                                        value={state.value}
                                        onChange={(e) => handleChange(e.target.value)}
                                        error={!!state.meta.errors?.length}
                                        containerClassName="w-24 sm:w-full"
                                        className="tabular-nums"
                                        suffix={
                                            <Label variant={EVariantLabel.caption} color="text-gray-400" className="pe-2">
                                                %
                                            </Label>
                                        }
                                    />
                                </Div>
                            )}
                        </form.Field>
                    ))}
                </Div>
            </section>

            <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                    <UnsavedBar
                        visible={BUCKETS.some((bucket) => values[bucket.key] !== initialValues[bucket.key])}
                        isSaving={mutation.isPending}
                        onDiscard={() => form.reset(initialValues)}
                        onSave={() => form.handleSubmit()}
                    />
                )}
            </form.Subscribe>
        </Div>
    );
}

function CaisseSettingsForm({ settings }: Readonly<{ settings: PosSettings }>) {
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');
    const queryClient = useQueryClient();
    const { openToast } = useToast();

    const initialValues = {
        defaultOpeningCash: String(settings.defaultOpeningCash),
        allowCashierOverride: settings.allowCashierOverride,
        syncDailyIncome: settings.syncDailyIncome,
    };

    const mutation = useMutation({
        mutationFn: updatePosSettings,
        onSuccess: (saved) => {
            queryClient.setQueryData(['pos-settings'], saved);
            openToast(tCommon('success'), t('saved'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const form = useForm({
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync({
                defaultOpeningCash: Number(value.defaultOpeningCash.replace(',', '.')),
                allowCashierOverride: value.allowCashierOverride,
                syncDailyIncome: value.syncDailyIncome,
            });
        },
    });

    useEffect(() => {
        form.reset({
            defaultOpeningCash: String(settings.defaultOpeningCash),
            allowCashierOverride: settings.allowCashierOverride,
            syncDailyIncome: settings.syncDailyIncome,
        });
    }, [settings, form]);

    return (
        <Div>
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <PanelHeader icon={IconComponentsEnum.shoppingCart} title={t('caisseTitle')} subtitle={t('caisseSubtitle')} />

                <Div className="divide-y divide-gray-100">
                    <form.Field
                        name="defaultOpeningCash"
                        validators={{
                            onSubmit: ({ value }) => {
                                const amount = Number(value.replace(',', '.'));
                                return Number.isFinite(amount) && amount >= 0 ? undefined : t('invalidAmount');
                            },
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <Div className="flex min-w-0 flex-col gap-0.5">
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                        {t('openingCash')}
                                    </Label>
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color={state.meta.errors?.length ? 'text-danger-600' : 'text-gray-500'}
                                    >
                                        {state.meta.errors?.[0] ? String(state.meta.errors[0]) : t('openingCashHint')}
                                    </Label>
                                </Div>
                                <Input
                                    id="settings-opening-cash"
                                    size={EInputSize.small}
                                    type={EInputType.number}
                                    value={state.value}
                                    onChange={(e) => handleChange(e.target.value)}
                                    error={!!state.meta.errors?.length}
                                    containerClassName="sm:w-40 shrink-0"
                                    className="tabular-nums"
                                    suffix={
                                        <Label variant={EVariantLabel.caption} color="text-gray-400" className="pe-2">
                                            DT
                                        </Label>
                                    }
                                />
                            </Div>
                        )}
                    </form.Field>

                    <form.Field name="allowCashierOverride">
                        {({ state, handleChange }) => (
                            <Div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                                <Div className="flex min-w-0 flex-col gap-0.5">
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                        {t('allowOverride')}
                                    </Label>
                                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                                        {t('allowOverrideHint')}
                                    </Label>
                                </Div>
                                <Toggle id="settings-allow-override" checked={state.value} onChange={handleChange} />
                            </Div>
                        )}
                    </form.Field>

                    <form.Field name="syncDailyIncome">
                        {({ state, handleChange }) => (
                            <Div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                                <Div className="flex min-w-0 flex-col gap-0.5">
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                        {t('syncDailyIncome')}
                                    </Label>
                                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                                        {t('syncDailyIncomeHint')}
                                    </Label>
                                </Div>
                                <Toggle id="settings-sync-daily-income" checked={state.value} onChange={handleChange} />
                            </Div>
                        )}
                    </form.Field>
                </Div>
            </section>

            <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                    <UnsavedBar
                        visible={
                            values.defaultOpeningCash !== initialValues.defaultOpeningCash ||
                            values.allowCashierOverride !== initialValues.allowCashierOverride ||
                            values.syncDailyIncome !== initialValues.syncDailyIncome
                        }
                        isSaving={mutation.isPending}
                        onDiscard={() => form.reset(initialValues)}
                        onSave={() => form.handleSubmit()}
                    />
                )}
            </form.Subscribe>
        </Div>
    );
}

function SettingsNav({
    active,
    onChange,
}: Readonly<{ active: SettingsTab; onChange: (tab: SettingsTab) => void }>) {
    const t = useTranslations('settings');
    const items: { id: SettingsTab; icon: IconComponentsEnum; title: string; hint: string }[] = [
        { id: 'allocation', icon: IconComponentsEnum.layers, title: t('nav.allocation'), hint: t('nav.allocationHint') },
        { id: 'caisse', icon: IconComponentsEnum.shoppingCart, title: t('nav.caisse'), hint: t('nav.caisseHint') },
    ];

    return (
        <nav
            aria-label={t('title')}
            className="flex gap-2 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:overflow-visible"
        >
            {items.map((item) => {
                const isActive = item.id === active;
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors lg:w-full ${
                            isActive ? 'bg-white shadow-sm ring-1 ring-gray-200' : 'hover:bg-gray-50'
                        }`}
                    >
                        <Div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                isActive ? 'bg-primary-500' : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}
                        >
                            <Icon name={item.icon} size={ESize.sm} color={isActive ? 'text-white' : 'text-gray-500'} />
                        </Div>
                        <Div className="flex min-w-0 flex-col">
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color={isActive ? 'text-gray-900' : 'text-gray-600'}
                                className="font-semibold!"
                            >
                                {item.title}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-500" className="hidden lg:block">
                                {item.hint}
                            </Label>
                        </Div>
                    </button>
                );
            })}
        </nav>
    );
}

export default function SettingsPage() {
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [activeTab, setActiveTab] = useState<SettingsTab>('allocation');

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Launcher);
    }, [isAdmin, router]);

    const {
        data: posData,
        isLoading: isPosLoading,
        error: posError,
    } = useQuery({
        queryKey: ['pos-settings'],
        queryFn: fetchPosSettings,
        enabled: isAdmin,
    });

    const {
        data: incomeSettings,
        isLoading: isIncomeLoading,
        error: incomeError,
    } = useQuery({
        queryKey: ['daily-income-settings'],
        queryFn: fetchDailyIncomeSettings,
        enabled: isAdmin,
    });

    if (!isAdmin) return null;

    const renderContent = () => {
        if (isPosLoading || isIncomeLoading) {
            return (
                <Div className="flex justify-center py-16">
                    <Spinner color="text-primary-500" size="lg" />
                </Div>
            );
        }
        if (posError || incomeError || !posData || !incomeSettings) {
            const err = posError ?? incomeError;
            return (
                <Label variant={EVariantLabel.bodySmall} color="text-danger-600">
                    {err instanceof Error ? err.message : tCommon('error')}
                </Label>
            );
        }
        return (
            <Div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[15rem_1fr] lg:items-start lg:gap-8">
                <SettingsNav active={activeTab} onChange={setActiveTab} />
                <Div className="min-w-0">
                    <Div className={activeTab === 'allocation' ? '' : 'hidden'}>
                        <DailyIncomeSettingsForm settings={incomeSettings} />
                    </Div>
                    <Div className={activeTab === 'caisse' ? '' : 'hidden'}>
                        <CaisseSettingsForm settings={posData} />
                    </Div>
                </Div>
            </Div>
        );
    };

    return <LayoutWrapper title={t('title')} subTitle={t('subtitle')} mainSection={renderContent()} />;
}
