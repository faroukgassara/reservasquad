'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import PosOpenSessionModal from '@/components/Modals/PosOpenSessionModal/PosOpenSessionModal';
import PosSubscriptionReminderModal from '@/components/Modals/PosSubscriptionReminderModal/PosSubscriptionReminderModal';
import PosThumbnail from '@/components/Organisms/Pos/PosThumbnail';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { formatMoney } from '@/lib/daily-income-api';
import { Routes } from '@/lib/routes';
import {
    fetchCurrentPosSession,
    fetchLastClosedPosSession,
    fetchPosLowStockProducts,
    fetchPosSettings,
    fetchSubscriptions,
    formatPosDate,
    formatPosDateTime,
    formatSubscriptionNumber,
    openPosSession,
    personName,
    remindSubscription,
    SUBSCRIPTION_EXPIRING_DAYS,
    toAmount,
    toDateInput,
    todayInput,
    type Subscription,
} from '@/lib/pos-api';
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

function daysUntil(endDate: string): number {
    const today = new Date(`${todayInput()}T00:00:00Z`).getTime();
    const end = new Date(`${toDateInput(endDate)}T00:00:00Z`).getTime();
    return Math.round((end - today) / 86_400_000);
}

export default function PosDashboardPage() {
    const t = useTranslations('pos');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal();

    const [selectedReminder, setSelectedReminder] = useState<{ subscription: Subscription; daysLeft: number } | null>(null);
    const { openModal: openReminderModal, modalPortal: reminderModalPortal } = useModal({
        closeCallBack: () => setSelectedReminder(null),
    });

    const { data: current, isLoading: currentLoading } = useQuery({
        queryKey: ['pos-session-current'],
        queryFn: fetchCurrentPosSession,
    });

    const { data: lastClosed } = useQuery({
        queryKey: ['pos-session-last-closed'],
        queryFn: fetchLastClosedPosSession,
    });

    const { data: posSettings, isLoading: posSettingsLoading } = useQuery({
        queryKey: ['pos-settings'],
        queryFn: fetchPosSettings,
    });

    const { data: expiring, isLoading: expiringLoading } = useQuery({
        queryKey: ['subscriptions', 'expiring'],
        queryFn: () => fetchSubscriptions({ state: 'expiring', page: 1, perPage: 10 }),
    });

    const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
        queryKey: ['pos-products-low-stock'],
        queryFn: () => fetchPosLowStockProducts(6),
    });

    const openMutation = useMutation({
        mutationFn: (openingCash: number) =>
            openPosSession(posSettings?.allowCashierOverride ? { openingCash } : {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['pos-session-current'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-sessions'] });
            closeModal();
            router.push(Routes.Pos.register);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const remindMutation = useMutation({
        mutationFn: (id: string) => remindSubscription(id),
        onSuccess: (res) => {
            void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            openToast(
                tCommon('success'),
                t('dashboard.remindSuccess', { email: res.email }),
                { type: EToastType.SUCCESS },
            );
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.message || t('dashboard.remindError');
            openToast(tCommon('error'), msg, { type: EToastType.ERROR });
        },
    });

    return (
        <>
            {modalPortal(
                <PosOpenSessionModal
                    defaultOpeningCash={posSettings?.defaultOpeningCash ?? 0}
                    locked={!posSettings?.allowCashierOverride}
                    onSubmit={async (openingCash) => {
                        await openMutation.mutateAsync(openingCash);
                    }}
                    isLoading={openMutation.isPending}
                />,
            )}
            {selectedReminder &&
                reminderModalPortal(
                    <PosSubscriptionReminderModal
                        subscription={selectedReminder.subscription}
                        daysLeft={selectedReminder.daysLeft}
                        onSubmit={async () => {
                            await remindMutation.mutateAsync(selectedReminder.subscription.id);
                        }}
                        isLoading={remindMutation.isPending}
                    />,
                )}
            <LayoutWrapper
                title={t('dashboard.title')}
                subTitle={t('dashboard.subtitle')}
                mainSection={
                    <Div className="space-y-6">
                        <Div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <Div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <Div className="flex items-start gap-4">
                                    <Div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50">
                                        <Icon
                                            name={IconComponentsEnum.shoppingCart}
                                            size={ESize.md}
                                            color="text-primary-600"
                                        />
                                    </Div>
                                    <Div className="flex flex-col gap-1.5">
                                        <Div className="flex items-center gap-3">
                                            <Label variant={EVariantLabel.h4} color="text-gray-900">
                                                {t('dashboard.shop')}
                                            </Label>
                                            {!currentLoading && (
                                                <Badge
                                                    id="pos-shop-status"
                                                    text={current ? t('session.statusOpen') : t('session.statusClosed')}
                                                    type={current ? EBadgeType.success : EBadgeType.warning}
                                                    size={EBadgeSize.medium}
                                                />
                                            )}
                                        </Div>
                                        <Div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-gray-500">
                                            {current ? (
                                                <Div className="flex items-center gap-1.5">
                                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                                        {t('dashboard.openedBy')} :
                                                    </Label>
                                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                                        {`${personName(current.openedBy)} · ${formatPosDateTime(current.openedAt)}`}
                                                    </Label>
                                                </Div>
                                            ) : null}
                                            {lastClosed?.closedAt ? (
                                                <Div className="flex items-center gap-1.5">
                                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                                        {t('dashboard.lastClosingDate')} :
                                                    </Label>
                                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                                                        {formatPosDateTime(lastClosed.closedAt)}
                                                    </Label>
                                                </Div>
                                            ) : null}
                                            {lastClosed ? (
                                                <Div className="flex items-center gap-1.5">
                                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                                        {t('dashboard.lastClosingBalance')} :
                                                    </Label>
                                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                                        {formatMoney(toAmount(lastClosed.countedCash))}
                                                    </Label>
                                                </Div>
                                            ) : null}
                                        </Div>
                                    </Div>
                                </Div>

                                <Div className="shrink-0">
                                    <Button
                                        id="pos-shop-action"
                                        type={EButtonType.primary}
                                        size={EButtonSize.large}
                                        text={current ? t('dashboard.continueSelling') : t('session.open')}
                                        isLoading={currentLoading || posSettingsLoading}
                                        onClick={() => (current ? router.push(Routes.Pos.register) : openModal())}
                                        className="w-full sm:w-auto font-bold shadow-md shadow-accent-500/25 px-6"
                                    />
                                </Div>
                            </Div>
                        </Div>

                        <Div className="grid gap-6 lg:grid-cols-2">
                            {/* 1. Low-Stock Alert Card */}
                            <Div className="rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col">
                                <Div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                                    <Div className="flex items-center gap-3 min-w-0">
                                        <Div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-50">
                                            <Icon name={IconComponentsEnum.archive} size={ESize.sm} color="text-warning-600" />
                                        </Div>
                                        <Div className="flex flex-col min-w-0">
                                            <Div className="flex items-center gap-2">
                                                <Label variant={EVariantLabel.h5} color="text-gray-900" className="truncate">
                                                    {t('dashboard.lowStockTitle')}
                                                </Label>
                                                {(() => {
                                                    const validCount = (lowStockData?.items ?? []).filter((p) => {
                                                        const s = toAmount(p.stockQty);
                                                        const m = p.minStock !== null && p.minStock !== undefined ? toAmount(p.minStock) : 10;
                                                        return p.availableInPos && s > 0 && s <= m;
                                                    }).length;
                                                    return validCount > 0 ? (
                                                        <Badge
                                                            id="pos-low-stock-count-badge"
                                                            text={String(validCount)}
                                                            type={EBadgeType.warning}
                                                            size={EBadgeSize.tiny}
                                                        />
                                                    ) : null;
                                                })()}
                                            </Div>
                                            <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                                {t('dashboard.lowStockSubtitle')}
                                            </Label>
                                        </Div>
                                    </Div>
                                    <Button
                                        id="pos-low-stock-view-all"
                                        type={EButtonType.secondary}
                                        size={EButtonSize.small}
                                        text={t('dashboard.viewAllAlerts')}
                                        onClick={() => router.push(`${Routes.Pos.products}?filter=low-stock`)}
                                    />
                                </Div>
                                {(() => {
                                    const items = (lowStockData?.items ?? []).filter((prod) => {
                                        const stock = toAmount(prod.stockQty);
                                        const min = prod.minStock !== null && prod.minStock !== undefined ? toAmount(prod.minStock) : 10;
                                        return prod.availableInPos && stock > 0 && stock <= min;
                                    });
                                    if (items.length === 0) {
                                        return (
                                            <Div className="flex items-center gap-3 px-5 py-6 flex-1">
                                                <Div className="flex size-7 items-center justify-center rounded-full bg-success-50 text-success-600 shrink-0">
                                                    <Icon name={IconComponentsEnum.check} size={ESize.xs} color="text-success-600" />
                                                </Div>
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                                    {t('dashboard.lowStockAllGood')}
                                                </Label>
                                            </Div>
                                        );
                                    }
                                    return (
                                        <Div className="divide-y divide-gray-100 flex-1">
                                            {items.map((prod) => {
                                                const stock = toAmount(prod.stockQty);
                                                const min = prod.minStock !== null && prod.minStock !== undefined ? toAmount(prod.minStock) : 10;
                                                return (
                                                    <Div
                                                        key={prod.id}
                                                        className="flex w-full items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-gray-50"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => router.push(Routes.Pos.product(prod.id))}
                                                            className="group flex min-w-0 flex-1 items-center gap-3 text-start"
                                                        >
                                                            <PosThumbnail
                                                                imageUrl={prod.imageUrl}
                                                                alt={prod.name}
                                                                className="size-10 shrink-0 rounded-lg"
                                                            />
                                                            <Div className="flex min-w-0 flex-1 flex-col">
                                                                <Label
                                                                    variant={EVariantLabel.bodySmall}
                                                                    color="text-gray-900"
                                                                    className="truncate font-medium transition-colors group-hover:text-primary-600"
                                                                >
                                                                    {prod.name}
                                                                </Label>
                                                                <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                                                    {prod.category?.name ? `${prod.category.name} · ` : ''}
                                                                    {t('dashboard.minStockLabel', { min })}
                                                                </Label>
                                                            </Div>
                                                        </button>
                                                        <Div className="flex shrink-0 items-center gap-2">
                                                            <Badge
                                                                id={`pos-low-stock-item-${prod.id}`}
                                                                text={t('products.lowStock')}
                                                                type={EBadgeType.warning}
                                                                size={EBadgeSize.small}
                                                            />
                                                            <span className="text-xs font-bold tabular-nums min-w-[3.5rem] text-end text-amber-700">
                                                                {t('products.units', { count: stock })}
                                                            </span>
                                                        </Div>
                                                    </Div>
                                                );
                                            })}
                                        </Div>
                                    );
                                })()}
                            </Div>

                            {/* 2. Expiring Subscriptions Card */}
                            <Div className="rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col">
                                <Div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                                    <Div className="flex items-center gap-3 min-w-0">
                                        <Div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-50">
                                            <Icon name={IconComponentsEnum.calendar} size={ESize.sm} color="text-warning-700" />
                                        </Div>
                                        <Div className="flex flex-col min-w-0">
                                            <Label variant={EVariantLabel.h5} color="text-gray-900" className="truncate">
                                                {t('dashboard.expiringTitle')}
                                            </Label>
                                            <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                                {t('dashboard.expiringSubtitle', { days: SUBSCRIPTION_EXPIRING_DAYS })}
                                            </Label>
                                        </Div>
                                    </Div>
                                    <Button
                                        id="pos-expiring-all"
                                        type={EButtonType.secondary}
                                        size={EButtonSize.small}
                                        text={t('dashboard.viewAll')}
                                        onClick={() => router.push(Routes.Pos.subscriptions)}
                                    />
                                </Div>
                                {expiring?.data.length ? (
                                    <Div className="divide-y divide-gray-100 flex-1">
                                        {expiring.data.map((subscription) => {
                                            const daysLeft = daysUntil(subscription.endDate);
                                            return (
                                                <Div
                                                    key={subscription.id}
                                                    className="flex w-full items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-gray-50"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => router.push(Routes.Pos.subscription(subscription.id))}
                                                        className="group flex min-w-0 flex-1 flex-col text-start"
                                                    >
                                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-medium transition-colors group-hover:text-primary-600">
                                                            {personName(subscription.client)}
                                                        </Label>
                                                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                                            {`${formatSubscriptionNumber(subscription.number)} · ${subscription.productName} · ${formatPosDate(subscription.endDate)}`}
                                                        </Label>
                                                    </button>
                                                    <Div className="flex items-center gap-2.5 shrink-0">
                                                        <Badge
                                                            id={`pos-expiring-${subscription.id}`}
                                                            text={
                                                                daysLeft === 0
                                                                    ? t('dashboard.endsToday')
                                                                    : t('dashboard.daysLeft', { count: daysLeft })
                                                            }
                                                            type={daysLeft <= 2 ? EBadgeType.error : EBadgeType.warning}
                                                            size={EBadgeSize.small}
                                                        />
                                                        {subscription.remindedAt ? (
                                                            <span
                                                                id={`pos-reminded-${subscription.id}`}
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500"
                                                                title={t('dashboard.remindedOn', { date: formatPosDate(subscription.remindedAt) })}
                                                            >
                                                                <Icon name={IconComponentsEnum.check} size={ESize.xs} color="text-success-600" />
                                                                <span>{t('dashboard.reminded')}</span>
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                id={`pos-remind-${subscription.id}`}
                                                                type={EButtonType.secondary}
                                                                size={EButtonSize.small}
                                                                icon={{
                                                                    name: IconComponentsEnum.bell,
                                                                    size: ESize.xs,
                                                                    color: 'text-primary-500',
                                                                }}
                                                                iconPosition="left"
                                                                text={t('dashboard.remind')}
                                                                onClick={() => {
                                                                    setSelectedReminder({ subscription, daysLeft });
                                                                    openReminderModal();
                                                                }}
                                                            />
                                                        )}
                                                    </Div>
                                                </Div>
                                            );
                                        })}
                                    </Div>
                                ) : (
                                    <Div className="px-5 py-6 flex-1">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                            {expiringLoading ? '…' : t('dashboard.noExpiring')}
                                        </Label>
                                    </Div>
                                )}
                            </Div>
                        </Div>
                    </Div>
                }
            />
        </>
    );
}
