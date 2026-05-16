'use client';

import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { EBadgeColor, EBadgeSize, EVariantLabel } from '@/Enum/Enum';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import AtomBadge from '@/components/Atoms/AtomBadge/AtomBadge';

type BannerVariant = 'public' | 'admin';

export default function OrganismReservationCalendarBanner({ variant }: Readonly<{ variant: BannerVariant }>) {
    return (
        <AtomDiv className="mb-4 flex flex-wrap items-center justify-between gap-2">
            {variant === 'public' ? (
                <>
                    <AtomDiv className="flex flex-wrap items-center gap-1.5 text-sm">
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600">
                            Réservation sans compte · statut{' '}
                        </AtomLabel>
                        <AtomBadge text="PENDING" size={EBadgeSize.small} color={EBadgeColor.warning} />
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600">
                            jusqu’à accord admin.
                        </AtomLabel>
                    </AtomDiv>
                    <Link href={Routes.Login} className="text-sm underline text-primary-900">
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-primary-900" className="underline">
                            Connexion administration
                        </AtomLabel>
                    </Link>
                </>
            ) : (
                <>
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600">
                        Vue calendrier — même planning que la page publique. Confirmer ou refuser les demandes depuis
                        la liste détaillée.
                    </AtomLabel>
                    <Link href={Routes.AdminReservations} className="text-sm font-medium underline text-primary-900">
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-primary-900" className="font-medium underline">
                            Liste & validation
                        </AtomLabel>
                    </Link>
                </>
            )}
        </AtomDiv>
    );
}
