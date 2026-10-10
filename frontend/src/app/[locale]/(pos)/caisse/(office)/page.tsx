'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import PosOpenSessionModal from '@/components/Modals/PosOpenSessionModal/PosOpenSessionModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { formatMoney } from '@/lib/daily-income-api';
import { Routes } from '@/lib/routes';
import {
    fetchCurrentPosSession,
    fetchLastClosedPosSession,
    fetchPosSessionSummary,
    fetchSubscriptions,
    formatPosDate,
    formatPosDateTime,
    formatSubscriptionNumber,
    openPosSession,
    personName,
    SUBSCRIPTION_EXPIRING_DAYS,
    toAmount,
    toDateInput,
    todayInput,
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

    const { data: current, isLoading: currentLoading } = useQuery({
        queryKey: ['pos-session-current'],
        queryFn: fetchCurrentPosSession,
    });

    const { data: lastClosed } = useQuery({
        queryKey: ['pos-session-last-closed'],
        queryFn: fetchLastClosedPosSession,
    });

    const { data: summary } = useQuery({
        queryKey: ['pos-session-summary', current?.id],
        queryFn: () => fetchPosSessionSummary(current!.id),
        enabled: !!current?.id,
    });

    const { data: expiring, isLoading: expiringLoading } = useQuery({
        queryKey: ['subscriptions', 'expiring'],
        queryFn: () => fetchSubscriptions({ state: 'expiring', page: 1, perPage: 10 }),
    });

    const openMutation = useMutation({
        mutationFn: (openingCash: number) => openPosSession({ openingCash }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['pos-session-current'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-sessions'] });
            closeModal();
            router.push(Routes.Pos.register);
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    return (
        <>
            {modalPortal(
                <PosOpenSessionModal
                    defaultOpeningCash={toAmount(lastClosed?.countedCash)}
                    onSubmit={async (openingCash) => {
                        await openMutation.mutateAsync(openingCash);
                    }}
                    isLoading={openMutation.isPending}
                />,
            )}
            <LayoutWrapper
                title={t('dashboard.title')}
                subTitle={t('dashboard.subtitle')}
                mainSection={
                    <Div className="space-y-6">
                        <Div className="grid gap-4 lg:grid-cols-3">
                            <Div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-1">
                                <Div className="flex items-center justify-between gap-3">
                                    <Div className="flex items-center gap-3">
                                        <Div className="flex size-10 items-center justify-center rounded-full bg-primary-50">
                                            <Icon
                                                name={IconComponentsEnum.shoppingCart}
                                                size={ESize.sm}
                                                color="text-primary-600"
                                            />
                                        </Div>
                                        <Label variant={EVariantLabel.h5} color="text-gray-900">
                                            {t('dashboard.shop')}
                                        </Label>
                                    </Div>
                                    {!currentLoading && (
                                        <Badge
                                            id="pos-shop-status"
                                            text={current ? t('session.statusOpen') : t('session.statusClosed')}
                                            type={current ? EBadgeType.success : EBadgeType.warning}
                                            size={EBadgeSize.small}
                                        />
                                    )}
                                </Div>

                                <Div className="space-y-2">
                                    {current ? (
                                        <Div className="flex justify-between gap-3">
                                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                                {t('dashboard.openedBy')}
                                            </Label>
                                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                                {`${personName(current.openedBy)} · ${formatPosDateTime(current.openedAt)}`}
                                            </Label>
                                        </Div>
                                    ) : null}
                                    <Div className="flex justify-between gap-3">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                            {t('dashboard.lastClosingDate')}
                                        </Label>
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                            {formatPosDateTime(lastClosed?.closedAt)}
                                        </Label>
                                    </Div>
                                    <Div className="flex justify-between gap-3">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                            {t('dashboard.lastClosingBalance')}
                                        </Label>
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                            {lastClosed ? formatMoney(toAmount(lastClosed.countedCash)) : '—'}
                                        </Label>
                                    </Div>
                                </Div>

                                <Button
                                    id="pos-shop-action"
                                    type={EButtonType.primary}
                                    size={EButtonSize.large}
                                    text={current ? t('dashboard.continueSelling') : t('session.open')}
                                    isLoading={currentLoading}
                                    onClick={() => (current ? router.push(Routes.Pos.register) : openModal())}
                                    className="mt-auto w-full"
                                />
                            </Div>

                            <Div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
                                <StatCard
                                    icon={IconComponentsEnum.filetext}
                                    iconBg="bg-primary-50"
                                    iconColor="text-primary-600"
                                    label={t('dashboard.sessionOrders')}
                                    value={summary ? String(summary.ordersCount) : '—'}
                                />
                                <StatCard
                                    icon={IconComponentsEnum.layers}
                                    iconBg="bg-success-50"
                                    iconColor="text-success-700"
                                    label={t('dashboard.sessionSales')}
                                    value={summary ? formatMoney(summary.ordersTotal) : '—'}
                                />
                                <StatCard
                                    icon={IconComponentsEnum.checkCircle}
                                    iconBg="bg-warning-50"
                                    iconColor="text-warning-700"
                                    label={t('dashboard.expectedCash')}
                                    value={summary ? formatMoney(summary.expectedCash) : '—'}
                                />
                                <StatCard
                                    icon={IconComponentsEnum.users}
                                    iconBg="bg-gray-100"
                                    iconColor="text-gray-600"
                                    label={t('dashboard.clientAccount')}
                                    value={summary ? formatMoney(summary.clientAccountPayments) : '—'}
                                />
                            </Div>
                        </Div>

                        <Div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <Div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                                <Div className="flex items-center gap-3">
                                    <Div className="flex size-10 items-center justify-center rounded-full bg-warning-50">
                                        <Icon name={IconComponentsEnum.calendar} size={ESize.sm} color="text-warning-700" />
                                    </Div>
                                    <Div className="flex flex-col">
                                        <Label variant={EVariantLabel.h5} color="text-gray-900">
                                            {t('dashboard.expiringTitle')}
                                        </Label>
                                        <Label variant={EVariantLabel.caption} color="text-gray-500">
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
                                <Div className="divide-y divide-gray-100">
                                    {expiring.data.map((subscription) => {
                                        const daysLeft = daysUntil(subscription.endDate);
                                        return (
                                            <button
                                                key={subscription.id}
                                                type="button"
                                                onClick={() => router.push(Routes.Pos.subscription(subscription.id))}
                                                className="flex w-full items-center justify-between gap-4 px-5 py-3 text-start transition-colors hover:bg-gray-50"
                                            >
                                                <Div className="flex min-w-0 flex-col">
                                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-medium">
                                                        {personName(subscription.client)}
                                                    </Label>
                                                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                                        {`${formatSubscriptionNumber(subscription.number)} · ${subscription.productName} · ${formatPosDate(subscription.endDate)}`}
                                                    </Label>
                                                </Div>
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
                                            </button>
                                        );
                                    })}
                                </Div>
                            ) : (
                                <Div className="px-5 py-6">
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                        {expiringLoading ? '…' : t('dashboard.noExpiring')}
                                    </Label>
                                </Div>
                            )}
                        </Div>
                    </Div>
                }
            />
        </>
    );
}
