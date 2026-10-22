'use client';

import { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { fetchPosSettings, updatePosSettings, type PosSettings } from '@/lib/pos-api';
import { Routes } from '@/lib/routes';
import { EButtonSize, EButtonType, EInputType, ESize, EToastType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

function CaisseSettingsForm({ settings }: Readonly<{ settings: PosSettings }>) {
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');
    const queryClient = useQueryClient();
    const { openToast } = useToast();

    const mutation = useMutation({
        mutationFn: updatePosSettings,
        onSuccess: (saved) => {
            queryClient.setQueryData(['pos-settings'], saved);
            openToast(tCommon('success'), t('saved'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const form = useForm({
        defaultValues: {
            defaultOpeningCash: String(settings.defaultOpeningCash),
            allowCashierOverride: settings.allowCashierOverride,
            syncDailyIncome: settings.syncDailyIncome,
        },
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync({
                defaultOpeningCash: Number(value.defaultOpeningCash.replace(',', '.')),
                allowCashierOverride: value.allowCashierOverride,
                syncDailyIncome: value.syncDailyIncome,
            });
        },
    });

    return (
        <Div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white shadow-sm">
            <Div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
                <Div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                    <Icon name={IconComponentsEnum.shoppingCart} size={ESize.sm} color="text-primary-600" />
                </Div>
                <Div className="flex min-w-0 flex-col">
                    <Label variant={EVariantLabel.h6} color="text-gray-900">
                        {t('caisseTitle')}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('caisseSubtitle')}
                    </Label>
                </Div>
            </Div>

            <Div className="space-y-5 p-5">
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
                        <Input
                            id="settings-opening-cash"
                            label={t('openingCash')}
                            value={state.value}
                            type={EInputType.number}
                            onChange={(e) => handleChange(e.target.value)}
                            required
                            hintText={state.meta.errors?.[0] ? String(state.meta.errors[0]) : t('openingCashHint')}
                            error={!!state.meta.errors?.length}
                        />
                    )}
                </form.Field>

                <form.Field name="allowCashierOverride">
                    {({ state, handleChange }) => (
                        <Div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-25 px-4 py-3">
                            <Div className="flex min-w-0 flex-col">
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
                        <Div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-25 px-4 py-3">
                            <Div className="flex min-w-0 flex-col">
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

                <Div className="flex justify-end">
                    <Button
                        id="settings-save"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={tCommon('save')}
                        isLoading={mutation.isPending}
                        onClick={() => form.handleSubmit()}
                    />
                </Div>
            </Div>
        </Div>
    );
}

export default function SettingsPage() {
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Launcher);
    }, [isAdmin, router]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['pos-settings'],
        queryFn: fetchPosSettings,
        enabled: isAdmin,
    });

    if (!isAdmin) return null;

    const renderContent = () => {
        if (isLoading) {
            return (
                <Div className="flex justify-center py-16">
                    <Spinner color="text-primary-500" size="lg" />
                </Div>
            );
        }
        if (error || !data) {
            return (
                <Label variant={EVariantLabel.bodySmall} color="text-danger-600">
                    {error instanceof Error ? error.message : tCommon('error')}
                </Label>
            );
        }
        return <CaisseSettingsForm settings={data} />;
    };

    return <LayoutWrapper title={t('title')} subTitle={t('subtitle')} mainSection={renderContent()} />;
}
