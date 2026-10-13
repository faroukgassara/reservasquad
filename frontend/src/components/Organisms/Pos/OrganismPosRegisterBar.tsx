'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';

interface IOrganismPosRegisterBar {
    sessionNumber: number;
    ordersCount: number;
    onOrders: () => void;
    onCloseSession: () => void;
}

const TAB_BASE = 'flex min-h-10 items-center gap-2 rounded-lg px-3 py-1.5 transition-colors sm:min-h-0';

export default function OrganismPosRegisterBar({
    sessionNumber,
    ordersCount,
    onOrders,
    onCloseSession,
}: Readonly<IOrganismPosRegisterBar>) {
    const t = useTranslations('pos.register');
    const tCommon = useTranslations('common');
    const { data: session } = useSession();

    const firstName = session?.user?.firstName ?? '';
    const lastName = session?.user?.lastName ?? '';
    const userName = [firstName, lastName].filter(Boolean).join(' ');
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    return (
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-3 py-2 sm:px-4">
            <Link href={Routes.Pos.index} className="hidden shrink-0 items-center min-[400px]:flex">
                <BrandLogo
                    alt={tCommon('brandLogoAlt')}
                    height={26}
                    className="w-auto object-contain"
                    priority
                />
            </Link>

            <Div className="hidden h-6 w-px bg-gray-200 sm:block" />

            <nav className="flex min-w-0 items-center gap-1 rounded-xl bg-gray-100 p-1">
                <Div className={`${TAB_BASE} bg-white shadow-sm`}>
                    <Icon name={IconComponentsEnum.shoppingCart} size={ESize.sm} color="text-primary-500" />
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="hidden font-semibold sm:inline">
                        {t('registerTab')}
                    </Label>
                </Div>
                <button
                    id="pos-register-orders"
                    type="button"
                    onClick={onOrders}
                    aria-label={t('orders')}
                    className={`${TAB_BASE} hover:bg-white/70 cursor-pointer`}
                >
                    <Icon name={IconComponentsEnum.filetext} size={ESize.sm} color="text-gray-500" />
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="hidden font-medium sm:inline">
                        {t('orders')}
                    </Label>
                    {ordersCount > 0 ? (
                        <Label
                            variant={EVariantLabel.caption}
                            color="text-white"
                            className="min-w-5 rounded-full bg-primary-500 px-1.5 text-center font-semibold"
                        >
                            {ordersCount}
                        </Label>
                    ) : null}
                </button>
            </nav>

            <Div className="ms-auto flex shrink-0 items-center gap-2">
                <Div className="hidden items-center gap-2 rounded-full border border-success-200 bg-success-50 px-3 py-1 md:flex">
                    <span className="size-2 rounded-full bg-success-500" />
                    <Label variant={EVariantLabel.caption} color="text-success-700" className="font-medium">
                        {t('sessionNumber', { number: sessionNumber })}
                    </Label>
                </Div>

                <Div className="hidden items-center gap-2 sm:flex">
                    <LanguageSwitcher menuPlacement="top" className="w-auto" />
                    <ThemeToggle />
                </Div>

                <Div className="hidden h-5 w-px bg-gray-200 sm:block" />

                {/* Explicit action buttons: Réservations, Bureau caisse & Clôturer la session */}
                <Div className="flex items-center gap-2">
                    {/* Link to /dashboard (Reservations dashboard) */}
                    <Link
                        id="pos-register-link-dashboard"
                        href={Routes.Dashboard}
                        title={t('goToDashboard')}
                        aria-label={t('goToDashboard')}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-2xs transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                    >
                        <Icon name={IconComponentsEnum.calendar} size={ESize.xs} color="text-gray-600" />
                        <span className="hidden sm:inline">{t('goToDashboard')}</span>
                    </Link>

                    {/* Neutral Link to /caisse */}
                    <Link
                        id="pos-register-link-caisse"
                        href={Routes.Pos.index}
                        title={t('goToCaisse')}
                        aria-label={t('goToCaisse')}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-2xs transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                    >
                        <Icon name={IconComponentsEnum.layers} size={ESize.xs} color="text-gray-600" />
                        <span className="hidden sm:inline">{t('goToCaisse')}</span>
                    </Link>

                    {/* Distinct Close session button */}
                    <button
                        id="pos-register-close-session"
                        type="button"
                        onClick={onCloseSession}
                        title={t('closeSession')}
                        aria-label={t('closeSession')}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 text-xs font-semibold text-danger-700 shadow-2xs transition-all hover:border-danger-300 hover:bg-danger-100 hover:text-danger-800 cursor-pointer"
                    >
                        <Icon name={IconComponentsEnum.lock} size={ESize.xs} color="text-danger-600" />
                        <span className="hidden sm:inline">{t('closeSession')}</span>
                    </button>
                </Div>

                <Div className="hidden h-5 w-px bg-gray-200 sm:block" />

                {/* User Avatar only (placed on the far right) */}
                <Div
                    id="pos-register-user-avatar"
                    title={userName || 'Utilisateur'}
                    aria-label={userName || 'Utilisateur'}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white font-semibold text-xs shadow-2xs select-none"
                >
                    {initials ? (
                        <span className="font-bold text-white text-xs leading-none">
                            {initials}
                        </span>
                    ) : (
                        <Icon name={IconComponentsEnum.user} size={ESize.sm} color="text-white" />
                    )}
                </Div>
            </Div>
        </header>
    );
}
