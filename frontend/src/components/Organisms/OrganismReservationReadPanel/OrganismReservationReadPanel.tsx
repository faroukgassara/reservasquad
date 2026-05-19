'use client';

import AtomBadge from '@/components/Atoms/AtomBadge/AtomBadge';
import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import type { CalendarReservation } from '@/types/calendar';
import { EBadgeColor, EButtonType, EVariantLabel } from '@/Enum/Enum';
import { formatTnd } from '@/lib/reservation-pricing';
import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';

function statusBadgeColor(status: CalendarReservation['status']): EBadgeColor {
    if (status === 'CONFIRMED') return EBadgeColor.success;
    if (status === 'PENDING') return EBadgeColor.warning;
    return EBadgeColor.danger;
}

type OrganismReservationReadPanelProps = {
    selected: CalendarReservation;
    onClose: () => void;
};

export default function OrganismReservationReadPanel({
    selected,
    onClose,
}: Readonly<OrganismReservationReadPanelProps>) {
    const t = useTranslations();

    return (
        <AtomDiv className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <AtomLabel variant={EVariantLabel.h4} color="text-primary-900" className="mb-4 block font-semibold">
                {t('reservation.detail')}
            </AtomLabel>
            <AtomDiv className="grid gap-2 text-sm md:grid-cols-2">
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                    {t('reservation.teacher')}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                    {selected.user.name}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                    {t('reservation.room')}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900">
                    {selected.room.name}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                    {t('reservation.schedule')}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900">
                    {format(parseISO(String(selected.date).slice(0, 10)), 'dd/MM/yyyy')} · {selected.startTime} – {selected.endTime}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                    {t('reservation.participants')}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900">
                    {selected.numberOfPeople}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                    {t('reservation.priceTnd')}
                </AtomLabel>
                <AtomDiv className="flex flex-col gap-0.5">
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                        {formatTnd(Number(selected.price ?? 0))} TND
                    </AtomLabel>
                    <AtomLabel variant={EVariantLabel.caption} color="text-gray-500">
                        {t(`reservation.priceModeCaption.${selected.priceMode}`)}
                    </AtomLabel>
                </AtomDiv>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                    {t('reservation.motif')}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="md:col-span-1">
                    {selected.purpose}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                    {t('reservation.status')}
                </AtomLabel>
                <AtomDiv>
                    <AtomBadge
                        text={t(`reservation.statusLabels.${selected.status}`)}
                        size="small"
                        color={statusBadgeColor(selected.status)}
                    />
                </AtomDiv>
            </AtomDiv>
            <AtomButton
                id="reservation-read-panel-close"
                type={EButtonType.iconButton}
                className="!mt-4 !h-auto !px-0 !py-0 text-sm underline"
                onClick={onClose}
                text={t('reservation.closePanel')}
            />
        </AtomDiv>
    );
}
