'use client';

import { useEffect, useRef, useState } from 'react';
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
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const firstName = session?.user?.firstName ?? '';
    const lastName = session?.user?.lastName ?? '';
    const userName = [firstName, lastName].filter(Boolean).join(' ');
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [menuOpen]);

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
                    className={`${TAB_BASE} hover:bg-white/70`}
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

                <div ref={menuRef} className="relative">
                    <button
                        id="pos-register-user-menu"
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                        className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pe-3 transition-colors hover:bg-gray-50 sm:min-h-0"
                    >
                        <Div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500">
                            {initials ? (
                                <Label variant={EVariantLabel.caption} color="text-white" className="font-semibold leading-none">
                                    {initials}
                                </Label>
                            ) : (
                                <Icon name={IconComponentsEnum.user} size={ESize.sm} color="text-white" />
                            )}
                        </Div>
                        {userName ? (
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-800" className="hidden font-medium md:inline">
                                {userName}
                            </Label>
                        ) : null}
                        <Icon name={IconComponentsEnum.chevronDown} size={ESize.sm} color="text-gray-500" />
                    </button>

                    {menuOpen ? (
                        <Div
                            role="menu"
                            className="absolute end-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                        >
                            <Div className="border-b border-gray-100 px-4 py-2 md:hidden">
                                <Label variant={EVariantLabel.caption} color="text-gray-500">
                                    {t('sessionNumber', { number: sessionNumber })}
                                </Label>
                            </Div>
                            <Link
                                href={Routes.Pos.index}
                                role="menuitem"
                                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50"
                            >
                                <Icon name={IconComponentsEnum.home} size={ESize.sm} color="text-gray-500" />
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-800">
                                    {t('backend')}
                                </Label>
                            </Link>
                            <button
                                id="pos-register-close-session"
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onCloseSession();
                                }}
                                className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-2.5 text-start transition-colors hover:bg-danger-50"
                            >
                                <Icon name={IconComponentsEnum.logOut} size={ESize.sm} color="text-danger-500" />
                                <Label variant={EVariantLabel.bodySmall} color="text-danger-600" className="font-medium">
                                    {t('closeSession')}
                                </Label>
                            </button>
                        </Div>
                    ) : null}
                </div>
            </Div>
        </header>
    );
}
