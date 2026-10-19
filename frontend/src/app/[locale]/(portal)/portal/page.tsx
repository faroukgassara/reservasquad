'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import UnpaidStatCard from '@/components/Primitives/UnpaidStatCard/UnpaidStatCard';
import PortalReservationCard from '@/components/Organisms/Portal/PortalReservationCard';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { fetchPortalMe } from '@/lib/portal-api';
import { Routes } from '@/lib/routes';

export default function PortalOverviewPage() {
    const t = useTranslations('portal');
    const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['portal-me'], queryFn: fetchPortalMe });

    if (isLoading) {
        return (
            <Div className="flex min-h-64 items-center justify-center">
                <Spinner color="text-primary-500" size={ESize.lg} />
            </Div>
        );
    }

    if (isError || !data) {
        return (
            <Div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 text-center">
                <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                    {t('loadError')}
                </Label>
                <Button id="portal-retry" type={EButtonType.secondary} size={EButtonSize.small} text={t('retry')} onClick={() => refetch()} />
            </Div>
        );
    }

    const { profile, balance, upcoming } = data;

    return (
        <Div className="space-y-6">
            <Div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <Div className="flex min-w-0 flex-col gap-1">
                    <Label variant={EVariantLabel.h3} color="text-gray-900">
                        {t('overview.greeting', { name: profile.firstName })}
                    </Label>
                    <Label variant={EVariantLabel.body} color="text-gray-500">
                        {t('overview.subtitle')}
                    </Label>
                </Div>
                <Link href={Routes.Portal.book} className="shrink-0">
                    <Button
                        id="portal-book-cta"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                        text={t('overview.bookCta')}
                        className="w-full sm:w-auto"
                    />
                </Link>
            </Div>

            <Div className="grid gap-3 sm:grid-cols-2">
                <UnpaidStatCard
                    label={t('overview.unpaid')}
                    value={formatMoney(balance.unpaidTotal)}
                    supportingText={t('overview.unpaidCount', { count: balance.unpaidCount })}
                />
                <UnpaidStatCard
                    tone="paid"
                    label={t('overview.paid')}
                    value={formatMoney(balance.paidTotal)}
                    supportingText={t('overview.paidCount', { count: balance.paidCount })}
                />
            </Div>

            <Div className="space-y-3">
                <Div className="flex items-center justify-between gap-3">
                    <Label variant={EVariantLabel.h5} color="text-gray-900">
                        {t('overview.upcoming')}
                    </Label>
                    <Link href={Routes.Portal.history} className="flex min-h-11 items-center sm:min-h-0">
                        <Label variant={EVariantLabel.bodySmall} color="text-primary-600" className="font-medium hover:underline">
                            {t('overview.viewHistory')}
                        </Label>
                    </Link>
                </Div>
                {upcoming.length === 0 ? (
                    <Div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                            {t('overview.noUpcoming')}
                        </Label>
                    </Div>
                ) : (
                    <Div className="space-y-2">
                        {upcoming.map((reservation) => (
                            <PortalReservationCard key={reservation.id} reservation={reservation} />
                        ))}
                    </Div>
                )}
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                    {t('overview.cancelHint')}
                </Label>
            </Div>
        </Div>
    );
}
