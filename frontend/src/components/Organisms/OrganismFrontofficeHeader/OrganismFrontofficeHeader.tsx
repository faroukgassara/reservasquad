'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Button from '@/components/Primitives/Button/Button';
import TestimonialFormModal from '@/components/Modals/TestimonialFormModal/TestimonialFormModal';
import AuthModal from '@/components/Modals/AuthModal/AuthModal';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import { EButtonSize, EButtonType, ESize, EToastType, IconComponentsEnum } from '@/Enum/Enum';
import Image from 'next/image';
import { Routes } from '@/lib/routes';
import { submitTestimonial } from '@/lib/testimonial-api';
import { useModal } from '@/contexts/ModalContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { twMerge } from 'tailwind-merge';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import BiblioSquadLogo from '@/assets/images/bibliosquad-logo.png';

const navLinkKeys = [
    { href: Routes.Home, key: 'home' as const },
    { href: Routes.Shop.index, key: 'shop' as const },
    { href: Routes.AboutUs, key: 'aboutUs' as const },
    { href: Routes.Contact, key: 'contactUs' as const },
    { href: Routes.Faq, key: 'faq' as const },
] as const;

type HeaderModal = 'auth' | 'testimonial' | 'logout' | null;

function isNavLinkActive(href: string, pathname: string): boolean {
    if (href === Routes.Home) {
        return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
    href,
    label,
    isActive,
    isMobile = false,
    onClick,
}: Readonly<{
    href: string;
    label: string;
    isActive: boolean;
    isMobile?: boolean;
    onClick?: () => void;
}>) {
    if (isMobile) {
        return (
            <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                onClick={onClick}
                className={twMerge(
                    'flex cursor-pointer items-center rounded-lg px-3 py-2.5 transition-colors',
                    isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-900 hover:bg-gray-50 hover:text-primary-500',
                )}
            >
                <span className={twMerge('text-base', isActive ? 'font-medium' : 'font-normal')}>
                    {label}
                </span>
            </Link>
        );
    }

    return (
        <Link
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={twMerge(
                'cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-1 py-3 text-[15px] leading-none transition-colors 2xl:text-base',
                isActive
                    ? 'border-accent-500 font-medium text-primary-600'
                    : 'border-transparent font-normal text-gray-900 hover:text-primary-500',
            )}
        >
            {label}
        </Link>
    );
}

function MobileMenuButton({
    open,
    onClick,
    openLabel,
    closeLabel,
}: Readonly<{ open: boolean; onClick: () => void; openLabel: string; closeLabel: string }>) {
    return (
        <Button
            id="frontoffice-mobile-menu"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{
                name: open ? IconComponentsEnum.close : IconComponentsEnum.menu,
                size: ESize.md,
                color: 'text-primary-500',
            }}
            onClick={onClick}
            aria-label={open ? closeLabel : openLabel}
            aria-expanded={open}
            className="shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70 xl:hidden"
        />
    );
}

export default function OrganismFrontofficeHeader() {
    const t = useTranslations('nav');
    const tAuth = useTranslations('auth');
    const tCommon = useTranslations('common');
    const tTestimonials = useTranslations('home.testimonials');
    const pathname = usePathname();
    const { data: session, status: sessionStatus } = useSession();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [modalType, setModalType] = useState<HeaderModal>(null);
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal();
    const { openDrawer, itemCount } = useCart();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const isAuthenticated = sessionStatus === 'authenticated' && Boolean(session);

    const submitMutation = useMutation({
        mutationFn: submitTestimonial,
        onSuccess: () => {
            openToast(
                tTestimonials('submitSuccessTitle'),
                tTestimonials('submitSuccessMessage'),
                { type: EToastType.SUCCESS },
            );
        },
        onError: (error: Error) => {
            openToast(tTestimonials('submitErrorTitle'), error.message, { type: EToastType.ERROR });
        },
    });

    const openHeaderModal = (type: HeaderModal) => {
        setMobileOpen(false);
        setModalType(type);
        openModal();
    };

    const handleAuthButtonClick = () => {
        if (isAuthenticated) {
            openHeaderModal('logout');
            return;
        }
        openHeaderModal('auth');
    };

    const handleConfirmLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut({ callbackUrl: Routes.Home });
        } finally {
            setIsLoggingOut(false);
            closeModal();
        }
    };

    const handleOpenTestimonial = () => {
        openHeaderModal('testimonial');
    };

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useBodyScrollLock(mobileOpen);

    const renderHeaderModal = () => {
        if (modalType === 'auth') {
            return (
                <AuthModal
                    onLoginSuccess={() => {
                        closeModal();
                    }}
                />
            );
        }

        if (modalType === 'logout') {
            return (
                <ConfirmationModal
                    title={tAuth('logout')}
                    description={tAuth('logoutConfirm')}
                    submitBtnText={tAuth('logout')}
                    cancelBtnText={tCommon('cancel')}
                    icon={IconComponentsEnum.logOut}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-500"
                    isLoading={isLoggingOut}
                    onSubmit={() => {
                        void handleConfirmLogout();
                    }}
                />
            );
        }

        return (
            <TestimonialFormModal
                onSubmit={async (values) => {
                    await submitMutation.mutateAsync(values);
                }}
                isLoading={submitMutation.isPending}
            />
        );
    };

    return (
        <>
            {modalPortal(renderHeaderModal())}

            <Div role="banner" className="sticky top-0 z-60 w-full min-w-0 border-b border-gray-200 bg-white">
                <Div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex shrink-0 cursor-pointer items-center gap-2">
                        <Image
                            src={BiblioSquadLogo}
                            alt={tCommon('brandLogoAlt')}
                            height={40}
                            className="h-8 w-auto object-contain sm:h-10"
                            priority
                        />
                    </Link>

                    <nav
                        aria-label={t('mainNav')}
                        className="hidden min-w-0 flex-1 items-center justify-center gap-4 xl:flex"
                    >
                        {navLinkKeys.map(({ href, key }) => (
                            <NavLink
                                key={href}
                                href={href}
                                label={t(key)}
                                isActive={isNavLinkActive(href, pathname)}
                            />
                        ))}
                    </nav>

                    <Div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <Button
                            id="header-auth"
                            type={EButtonType.tertiary}
                            size={EButtonSize.small}
                            icon={{
                                name: isAuthenticated ? IconComponentsEnum.logOut : IconComponentsEnum.user,
                                color: isAuthenticated ? 'text-danger-500' : 'text-primary-600',
                                size: ESize.sm,
                            }}
                            iconPosition="only"
                            onClick={handleAuthButtonClick}
                            aria-label={isAuthenticated ? tAuth('logout') : tAuth('login')}
                        />
                        <Button
                            id="header-testimonial"
                            type={EButtonType.tertiary}
                            size={EButtonSize.small}
                            icon={{ name: IconComponentsEnum.message, color: 'text-primary-600', size: ESize.sm }}
                            iconPosition="only"
                            onClick={handleOpenTestimonial}
                            aria-label={t('leaveTestimonial')}
                        />
                        <Button
                            id="header-search-desktop"
                            type={EButtonType.tertiary}
                            size={EButtonSize.small}
                            icon={{ name: IconComponentsEnum.search, color: 'text-gray-900', size: ESize.sm }}
                            iconPosition="only"
                            aria-label={t('search')}
                        />
                        <Div className="relative">
                            <Button
                                id="header-cart-desktop"
                                type={EButtonType.tertiary}
                                size={EButtonSize.small}
                                icon={{ name: IconComponentsEnum.shoppingCart, color: 'text-gray-900', size: ESize.sm }}
                                iconPosition="only"
                                aria-label={t('cart')}
                                onClick={openDrawer}
                            />
                            {itemCount > 0 && (
                                <span className="pointer-events-none absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent-500 text-[0.6rem] font-bold text-white">
                                    {itemCount > 9 ? '9+' : itemCount}
                                </span>
                            )}
                        </Div>
                        <LanguageSwitcher
                            menuPlacement="top"
                            className="w-auto shrink-0"
                        />
                        <MobileMenuButton
                            open={mobileOpen}
                            onClick={() => setMobileOpen((prev) => !prev)}
                            openLabel={t('openMenu')}
                            closeLabel={t('closeMenu')}
                        />
                    </Div>
                </Div>
            </Div>

            {mobileOpen && (
                <button
                    type="button"
                    aria-label={t('closeMenu')}
                    className="fixed inset-0 z-55 touch-none overscroll-none bg-black/40 xl:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <Div
                data-scroll-lock-scrollable
                className={twMerge(
                    'fixed inset-x-0 top-0 z-60 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-b border-gray-200 bg-white shadow-lg transition-all duration-200 sm:top-16 sm:max-h-[calc(100dvh-4rem)] xl:hidden',
                    mobileOpen
                        ? 'visible translate-y-0 opacity-100'
                        : 'pointer-events-none invisible -translate-y-2 opacity-0',
                )}
            >
                <Div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6">
                    <nav aria-label={t('mobileNav')} className="flex flex-col gap-0.5">
                        {navLinkKeys.map(({ href, key }) => (
                            <NavLink
                                key={href}
                                href={href}
                                label={t(key)}
                                isActive={isNavLinkActive(href, pathname)}
                                isMobile
                                onClick={() => setMobileOpen(false)}
                            />
                        ))}
                    </nav>

                    <Div className="flex flex-col gap-2">
                        <Button
                            id="header-auth-mobile"
                            type={EButtonType.secondary}
                            size={EButtonSize.medium}
                            text={isAuthenticated ? tAuth('logout') : tAuth('login')}
                            icon={{
                                name: isAuthenticated ? IconComponentsEnum.logOut : IconComponentsEnum.user,
                                color: isAuthenticated ? 'text-danger-500' : 'text-primary-600',
                                size: ESize.sm,
                            }}
                            iconPosition="left"
                            onClick={handleAuthButtonClick}
                            className="w-full"
                        />
                        <Button
                            id="header-testimonial-mobile"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            text={t('leaveTestimonial')}
                            icon={{ name: IconComponentsEnum.message, color: 'text-white', size: ESize.sm }}
                            iconPosition="left"
                            onClick={handleOpenTestimonial}
                            className="w-full"
                        />
                    </Div>
                </Div>
            </Div>
        </>
    );
}
