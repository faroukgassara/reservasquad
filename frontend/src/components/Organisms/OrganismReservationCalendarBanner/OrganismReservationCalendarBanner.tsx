'use client';

import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { EBadgeColor, EBadgeSize, EVariantLabel } from '@/Enum/Enum';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import AtomBadge from '@/components/Atoms/AtomBadge/AtomBadge';
import { useTranslations } from 'next-intl';

type BannerVariant = 'public' | 'admin';

export default function OrganismReservationCalendarBanner({ variant }: Readonly<{ variant: BannerVariant }>) {
    const t = useTranslations();

    return (
        <AtomDiv className="mb-4 flex flex-wrap items-center justify-between gap-2">
            {variant === 'public' ? (
                <>
                    <AtomDiv className="flex flex-wrap items-center gap-1.5 text-sm">
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600">
                            {t('calendar.banner.publicPrefix')}{' '}
                        </AtomLabel>
                        <AtomBadge
                            text={t('reservation.statusLabels.PENDING')}
                            size={EBadgeSize.small}
                            color={EBadgeColor.warning}
                        />
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600">
                            {t('calendar.banner.publicSuffix')}
                        </AtomLabel>
                    </AtomDiv>
                    <Link href={Routes.Login} className="text-sm underline text-primary-900">
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-primary-900" className="underline">
                            {t('calendar.banner.adminLogin')}
                        </AtomLabel>
                    </Link>
                </>
            ) : (
                <>
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600">
                        {t('calendar.banner.adminHint')}
                    </AtomLabel>
                    <Link href={Routes.AdminReservations} className="text-sm font-medium underline text-primary-900">
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-primary-900" className="font-medium underline">
                            {t('calendar.banner.adminListLink')}
                        </AtomLabel>
                    </Link>
                </>
            )}
        </AtomDiv>
    );
}
