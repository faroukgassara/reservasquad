'use client';

import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { EVariantLabel } from '@/Enum/Enum';
import Image from 'next/image';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';

const footerLinks = [
    { href: Routes.Home, label: 'Accueil' },
    { href: Routes.Calendar, label: 'Réserver' },
    { href: Routes.Login, label: 'Connexion administration' },
] as const;

export default function OrganismFrontofficeFooter() {
    return (
        <AtomDiv role="contentinfo" className="w-full border-t border-gray-200 bg-primary-900 text-white">
            <AtomDiv className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
                <AtomDiv className="max-w-md">
                    <Link href={Routes.Home} className="mb-4 inline-flex items-center gap-3">
                        <Image
                            src="/branding/reservasquad-logo.png"
                            alt=""
                            width={140}
                            height={40}
                            className="h-9 w-auto object-contain brightness-0 invert"
                        />
                    </Link>
                    <AtomLabel
                        variant={EVariantLabel.bodySmall}
                        color="text-primary-100"
                        className="block leading-relaxed"
                    >
                        Réservation de salles d&apos;étude : calendrier partagé et validation par
                        l&apos;administration.
                    </AtomLabel>
                </AtomDiv>

                <AtomDiv>
                    <AtomLabel
                        variant={EVariantLabel.bodySmall}
                        color="text-primary-200"
                        className="mb-3 block text-xs font-semibold uppercase tracking-wider"
                    >
                        Navigation
                    </AtomLabel>
                    <ul className="flex flex-col gap-2">
                        {footerLinks.map(({ href, label }) => (
                            <li key={href}>
                                <Link href={href} className="group transition-colors">
                                    <AtomLabel
                                        variant={EVariantLabel.bodySmall}
                                        color="text-white"
                                        className="font-medium group-hover:text-accent-300"
                                    >
                                        {label}
                                    </AtomLabel>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </AtomDiv>
            </AtomDiv>

            <AtomDiv className="border-t border-primary-800 py-6">
                <AtomLabel
                    variant={EVariantLabel.bodySmall}
                    color="text-primary-300"
                    className="block text-center"
                >
                    © {new Date().getFullYear()} Reserva Squad
                </AtomLabel>
            </AtomDiv>
        </AtomDiv>
    );
}
