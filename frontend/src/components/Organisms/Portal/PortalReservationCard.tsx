'use client';

import { useLocale, useTranslations } from 'next-intl';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EBadgeSize, EBadgeType, EVariantLabel } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { formatPortalDate, formatPortalTimeRange, type PortalReservation } from '@/lib/portal-api';

export default function PortalReservationCard({ reservation }: Readonly<{ reservation: PortalReservation }>) {
    const t = useTranslations('portal');
    const locale = useLocale();
    const start = new Date(reservation.startAt);
    const cancelled = reservation.status === 'CANCELLED';

    return (
        <Div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
            <Div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50">
                <Label variant={EVariantLabel.h6} color="text-primary-700" className="leading-none">
                    {new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(start)}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-primary-600" className="uppercase">
                    {new Intl.DateTimeFormat(locale, { month: 'short' }).format(start)}
                </Label>
            </Div>
            <Div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-semibold">
                    {reservation.title || reservation.room.name}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                    {`${formatPortalDate(reservation.startAt, locale)} · ${formatPortalTimeRange(reservation.startAt, reservation.endAt, locale)}`}
                </Label>
                {reservation.title ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                        {reservation.room.name}
                    </Label>
                ) : null}
            </Div>
            <Div className="flex shrink-0 flex-col items-end gap-1">
                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold tabular-nums">
                    {formatMoney(reservation.price)}
                </Label>
                {cancelled ? (
                    <Badge id={`portal-res-status-${reservation.id}`} text={t('status.cancelled')} type={EBadgeType.error} size={EBadgeSize.small} />
                ) : (
                    <Badge
                        id={`portal-res-paid-${reservation.id}`}
                        text={reservation.isPaid ? t('status.paid') : t('status.unpaid')}
                        type={reservation.isPaid ? EBadgeType.success : EBadgeType.warning}
                        size={EBadgeSize.small}
                    />
                )}
            </Div>
        </Div>
    );
}
