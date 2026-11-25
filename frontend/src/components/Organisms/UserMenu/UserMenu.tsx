'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { usePathname } from '@/i18n/navigation';
import Avatar from '@/components/Primitives/Avatar/Avatar';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

interface IUserMenu {
    name: string;
}

const UserMenu = ({ name }: IUserMenu) => {
    const tCommon = useTranslations('common');
    const tAuth = useTranslations('auth');
    const pathname = usePathname();
    const { data: session } = useSession();
    const menuRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [open, setOpen] = useState(false);
    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setOpen(false);
    }

    useEffect(
        () => () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        },
        [],
    );

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };

    const hoverOpen = () => {
        cancelClose();
        setOpen(true);
    };

    const hoverClose = () => {
        cancelClose();
        closeTimer.current = setTimeout(() => setOpen(false), 150);
    };

    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [open]);

    return (
        <div
            ref={menuRef}
            className="relative shrink-0"
            onMouseEnter={hoverOpen}
            onMouseLeave={hoverClose}
        >
            <button
                type="button"
                id="user-menu-trigger"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={name}
                onClick={() => setOpen((value) => !value)}
                className={twMerge(
                    'flex cursor-pointer items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-gray-100',
                    open && 'bg-gray-100',
                )}
            >
                <Avatar id="user-menu-avatar" name={name} size={ESize.md} />
                <Icon
                    name={IconComponentsEnum.chevronDown}
                    size={ESize.xs}
                    color="text-gray-500"
                    className={twMerge('transition-transform', open && 'rotate-180')}
                />
            </button>

            {open ? (
                <Div className="absolute end-0 top-full z-50 pt-1.5">
                    <Div className="flex w-72 flex-col gap-1 rounded-xl border border-gray-100 bg-white p-1.5 shadow-md">
                    <Div className="flex items-center gap-3 px-2 py-2">
                        <Avatar
                            id="user-menu-avatar-detail"
                            name={name}
                            email={session?.user?.email ?? undefined}
                            size={ESize.md}
                            className="min-w-0"
                        />
                    </Div>

                    <Div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-100">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="font-medium">
                            {tCommon('language')}
                        </Label>
                        <LanguageSwitcher inline />
                    </Div>

                    <Div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-100">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="font-medium">
                            {tCommon('theme')}
                        </Label>
                        <ThemeToggle />
                    </Div>

                    <button
                        type="button"
                        id="user-menu-logout"
                        onClick={() => signOut()}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-t border-gray-100 px-2 pb-1 pt-2.5 text-start transition-colors hover:bg-gray-100"
                    >
                        <Icon name={IconComponentsEnum.logOut} size={ESize.sm} color="text-primary-600" />
                        <Label variant={EVariantLabel.bodySmall} color="text-primary-600" className="cursor-pointer font-medium">
                            {tAuth('logout')}
                        </Label>
                    </button>
                    </Div>
                </Div>
            ) : null}
        </div>
    );
};

export default UserMenu;
