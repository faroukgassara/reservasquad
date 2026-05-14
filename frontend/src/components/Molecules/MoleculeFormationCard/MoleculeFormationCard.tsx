'use client';

import { Link } from '@/i18n/navigation';
import { Div, Icon, Label, AtomAvatar } from '@/components/Atoms';
import { ESize, EStatus, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { getFormationImageUrl } from '@/lib/formation-api';
import type { IMoleculeFormationCard } from '@/interfaces/Molecules/IMoleculeFormationCard/IMoleculeFormationCard';

function formatDurationHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m <= 0) return `${h} hr`;
    return `${h} hr ${String(m).padStart(2, '0')} mins`;
}

function formatPriceEUR(value: number): string {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(n)) return '—';
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
    }).format(n);
}

export default function MoleculeFormationCard({ formation, href }: IMoleculeFormationCard) {
    const imageSrc = getFormationImageUrl(formation.imageUrl ?? null);
    const categoryName = formation.category?.name ?? 'Formation';
    const description = formation.description?.trim() || '';
    const priceNum = Number(formation.price);

    return (
        <Div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
            <Link href={href} className="relative block shrink-0 aspect-[16/10] overflow-hidden bg-gray-100">
                {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageSrc}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                ) : (
                    <Div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                        <Icon name={IconComponentsEnum.bookOpenText} size="w-14 h-14" color="text-primary-500" />
                    </Div>
                )}
                <Div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                    <Icon name={IconComponentsEnum.calendar} size="w-4 h-4" color="text-gray-600" />
                    <Label variant={EVariantLabel.hint} color="text-gray-700" className="font-medium whitespace-nowrap">
                        {formatDurationHours(formation.duration)}
                    </Label>
                </Div>
            </Link>

            <Div className="flex flex-1 flex-col gap-3 p-5">
                <Label variant={EVariantLabel.bodySmall} color="text-success-600" className="font-semibold">
                    {categoryName}
                </Label>

                <Link href={href} className="group flex items-start gap-1">
                    <Label variant={EVariantLabel.h5} color="text-gray-900" className="font-bold leading-snug line-clamp-2">
                        {formation.title}
                    </Label>
                    <Icon
                        name={IconComponentsEnum.arrowRight}
                        size="w-5 h-5"
                        color="text-gray-400"
                        className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                    />
                </Link>

                {description && (
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="line-clamp-2">
                        {description}
                    </Label>
                )}

                <Div className="flex items-center gap-2">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold">
                        4.5
                    </Label>
                    <Div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={i <= 4 ? 'text-warning-500' : 'text-gray-200'} aria-hidden>
                                ★
                            </span>
                        ))}
                    </Div>
                    <Label variant={EVariantLabel.hint} color="text-gray-400">
                        (—)
                    </Label>
                </Div>

                <Div className="mt-auto flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
                    <Div className="flex items-center gap-3 min-w-0">
                        <AtomAvatar id={`formation-card-avatar-${formation.id}`} name="Nexera" size={ESize.md} status={EStatus.none} />
                        <Div className="min-w-0">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="block truncate font-semibold">
                                Nexera
                            </Label>
                            <Label variant={EVariantLabel.hint} color="text-gray-500" className="block truncate">
                                Centre de formation
                            </Label>
                        </Div>
                    </Div>
                    <Label variant={EVariantLabel.h5} color="text-success-600" className="shrink-0 font-bold">
                        {formatPriceEUR(priceNum)}
                    </Label>
                </Div>
            </Div>
        </Div>
    );
}
