'use client';

import { MouseEvent as ReactMouseEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { Link, usePathname } from '@/i18n/navigation';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import NotificationBell from '@/components/Organisms/Notifications/NotificationBell';
import UserMenu from '@/components/Organisms/UserMenu/UserMenu';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

export interface IAppTopBarLink {
    href: string;
    label: string;
    exact?: boolean;
    alsoActive?: string[];
    children?: IAppTopBarLink[];
}

interface IOrganismAppTopBar {
    homeHref: string;
    links?: IAppTopBarLink[];
    showNotifications?: boolean;
    center?: ReactNode;
}

interface IDrawerNavGroup {
    link: IAppTopBarLink;
    active: boolean;
    onNavigate: () => void;
    matchesHref: (href: string, exact?: boolean, alsoActive?: string[]) => boolean;
}

function DrawerNavGroup({ link, active, onNavigate, matchesHref }: Readonly<IDrawerNavGroup>) {
    const [expanded, setExpanded] = useState(() =>
        (link.children ?? []).some((child) => matchesHref(child.href, child.exact, child.alsoActive)),
    );

    return (
        <Div className="flex flex-col">
            <button
                type="button"
                aria-expanded={expanded}
                aria-label={link.label}
                aria-current={active ? 'page' : undefined}
                onClick={() => setExpanded((prev) => !prev)}
                className={twMerge(
                    'flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100',
                    active && 'bg-primary-50 hover:bg-primary-50',
                )}
            >
                <Label
                    variant={EVariantLabel.bodySmall}
                    color={active ? 'text-primary-600' : 'text-gray-600'}
                    className="cursor-pointer font-medium"
                >
                    {link.label}
                </Label>
                <Icon
                    name={IconComponentsEnum.chevronDown}
                    size={ESize.xs}
                    color={active ? 'text-primary-600' : 'text-gray-600'}
                    className={twMerge('transition-transform', expanded && 'rotate-180')}
                />
            </button>

            {expanded ? (
                <Div className="ms-3 mt-0.5 flex flex-col gap-0.5 border-s border-gray-100 pb-1 ps-2">
                    {(link.children ?? []).map((child) => {
                        const childActive = matchesHref(child.href, child.exact, child.alsoActive);
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                aria-current={childActive ? 'page' : undefined}
                                onClick={onNavigate}
                                className={twMerge(
                                    'flex min-h-10 items-center rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-100',
                                    childActive && 'bg-primary-50 hover:bg-primary-50',
                                )}
                            >
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color={childActive ? 'text-primary-600' : 'text-gray-800'}
                                    className="cursor-pointer font-medium"
                                >
                                    {child.label}
                                </Label>
                            </Link>
                        );
                    })}
                </Div>
            ) : null}
        </Div>
    );
}

export default function OrganismAppTopBar({
    homeHref,
    links = [],
    showNotifications = false,
    center,
}: Readonly<IOrganismAppTopBar>) {
    const tCommon = useTranslations('common');
    const tSidebar = useTranslations('sidebar');
    const pathname = usePathname();
    const { data: session } = useSession();
    const headerRef = useRef<HTMLElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const userName =
        [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') || tCommon('userFallback');

    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setOpenMenu(null);
        setDrawerOpen(false);
    }

    useEffect(
        () => () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        },
        [],
    );

    useEffect(() => {
        if (!drawerOpen) return;
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setDrawerOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [drawerOpen]);

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };

    const hoverOpenMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
        cancelClose();
        setOpenMenu(event.currentTarget.dataset.menuHref ?? null);
    };

    const hoverCloseMenu = () => {
        cancelClose();
        closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
    };

    useEffect(() => {
        if (!openMenu) return;
        const handlePointerDown = (event: MouseEvent) => {
            if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [openMenu]);

    const matchesHref = (href: string, exact?: boolean, alsoActive?: string[]) =>
        exact
            ? pathname === href
            : [href, ...(alsoActive ?? [])].some((path) => pathname === path || pathname.startsWith(`${path}/`));

    const isActive = (link: IAppTopBarLink) =>
        matchesHref(link.href, link.exact, link.alsoActive) ||
        (link.children ?? []).some((child) => matchesHref(child.href, child.exact, child.alsoActive));

    const closeDrawer = () => setDrawerOpen(false);

    const bookmark = (active: boolean) =>
        active ? <span aria-hidden="true" className="ds-bookmark absolute start-3 top-0 h-3.5 w-2.5 bg-accent-500" /> : null;

    const desktopLinkClass = (active: boolean) =>
        twMerge(
            'flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100',
            active && 'hover:bg-transparent',
        );

    const desktopLinkLabel = (label: string, active: boolean) => (
        <Label
            variant={EVariantLabel.bodySmall}
            color={active ? 'text-primary-600' : 'text-gray-600'}
            className={twMerge('cursor-pointer font-medium', active && 'font-semibold!')}
        >
            {label}
        </Label>
    );

    // Stretches over the header's vertical padding so the bookmark can hang from its top edge.
    const renderLinks = (className: string) => (
        <nav className={className}>
            {links.map((link) => {
                const active = isActive(link);
                if (!link.children?.length) {
                    return (
                        <Div key={link.href} className="relative flex shrink-0 items-center self-stretch">
                            {bookmark(active)}
                            <Link
                                href={link.href}
                                aria-current={active ? 'page' : undefined}
                                className={desktopLinkClass(active)}
                            >
                                {desktopLinkLabel(link.label, active)}
                            </Link>
                        </Div>
                    );
                }

                const menuOpen = openMenu === link.href;
                return (
                    <Div
                        key={link.href}
                        className="relative flex shrink-0 items-center self-stretch"
                        data-menu-href={link.href}
                        onMouseEnter={hoverOpenMenu}
                        onMouseLeave={hoverCloseMenu}
                    >
                        {bookmark(active)}
                        <button
                            type="button"
                            aria-expanded={menuOpen}
                            aria-label={link.label}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => setOpenMenu(menuOpen ? null : link.href)}
                            className={desktopLinkClass(active)}
                        >
                            {desktopLinkLabel(link.label, active)}
                            <Icon
                                name={IconComponentsEnum.chevronDown}
                                size={ESize.xs}
                                color={active ? 'text-primary-600' : 'text-gray-600'}
                                className={twMerge('transition-transform', menuOpen && 'rotate-180')}
                            />
                        </button>

                        {menuOpen ? (
                            <Div className="absolute start-0 top-full z-50 -mt-1.5">
                                <Div className="flex min-w-44 flex-col gap-0.5 rounded-xl border border-gray-100 bg-white p-1.5 shadow-md">
                                {link.children.map((child) => {
                                    const childActive = matchesHref(child.href, child.exact, child.alsoActive);
                                    return (
                                        <Link
                                            key={child.href}
                                            href={child.href}
                                            aria-current={childActive ? 'page' : undefined}
                                            onClick={() => setOpenMenu(null)}
                                            className={twMerge(
                                                'flex items-center rounded-lg px-2.5 py-2 transition-colors hover:bg-gray-100',
                                                childActive && 'bg-primary-50 hover:bg-primary-50',
                                            )}
                                        >
                                            <Label
                                                variant={EVariantLabel.bodySmall}
                                                color={childActive ? 'text-primary-600' : 'text-gray-800'}
                                                className="cursor-pointer font-medium"
                                            >
                                                {child.label}
                                            </Label>
                                        </Link>
                                    );
                                })}
                                </Div>
                            </Div>
                        ) : null}
                    </Div>
                );
            })}
        </nav>
    );

    return (
        <>
            <header ref={headerRef} className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
                <Div className="flex items-center gap-2 sm:gap-4 tablet:gap-6">
                    {links.length > 0 ? (
                        <button
                            type="button"
                            aria-label={tSidebar('openMenu')}
                            aria-expanded={drawerOpen}
                            onClick={() => setDrawerOpen((prev) => !prev)}
                            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-gray-100 laptop:hidden"
                        >
                            <Icon name={IconComponentsEnum.menu} size={ESize.sm} color="text-gray-700" />
                        </button>
                    ) : null}

                    <Link href={homeHref} className="flex shrink-0 items-center">
                        <BrandLogo alt={tCommon('brandLogoAlt')} height={28} className="h-6 w-6 overflow-hidden object-cover object-left sm:h-7 sm:w-auto" priority />
                    </Link>

                    {center}
                    {links.length > 0 ? renderLinks('-my-3 hidden min-w-0 flex-1 items-stretch gap-1 self-stretch laptop:flex') : null}

                    <Div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-3">
                        {showNotifications ? <NotificationBell /> : null}
                        <UserMenu name={userName} />
                    </Div>
                </Div>
            </header>

            {drawerOpen ? (
                <Div className="fixed inset-0 z-50 laptop:hidden">
                    <button
                        type="button"
                        aria-label={tSidebar('closeMenu')}
                        onClick={closeDrawer}
                        className="absolute inset-0 h-full w-full cursor-pointer bg-black/40"
                    />
                    <aside
                        role="dialog"
                        aria-modal="true"
                        aria-label={tSidebar('openMenu')}
                        className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl"
                    >
                        <Div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                            <Link href={homeHref} onClick={closeDrawer} className="flex shrink-0 items-center">
                                <BrandLogo alt={tCommon('brandLogoAlt')} height={28} className="h-7 w-auto object-contain" priority />
                            </Link>
                            <button
                                type="button"
                                aria-label={tSidebar('closeMenu')}
                                onClick={closeDrawer}
                                className="flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                            >
                                <Icon name={IconComponentsEnum.close} size={ESize.sm} color="text-gray-700" />
                            </button>
                        </Div>

                        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3">
                            {links.map((link) => {
                                const active = isActive(link);
                                if (!link.children?.length) {
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            aria-current={active ? 'page' : undefined}
                                            onClick={closeDrawer}
                                            className={twMerge(
                                                'flex min-h-11 items-center rounded-lg px-3 py-2 transition-colors hover:bg-gray-100',
                                                active && 'bg-primary-50 hover:bg-primary-50',
                                            )}
                                        >
                                            <Label
                                                variant={EVariantLabel.bodySmall}
                                                color={active ? 'text-primary-600' : 'text-gray-600'}
                                                className="cursor-pointer font-medium"
                                            >
                                                {link.label}
                                            </Label>
                                        </Link>
                                    );
                                }
                                return (
                                    <DrawerNavGroup
                                        key={link.href}
                                        link={link}
                                        active={active}
                                        onNavigate={closeDrawer}
                                        matchesHref={matchesHref}
                                    />
                                );
                            })}
                        </nav>
                    </aside>
                </Div>
            ) : null}
        </>
    );
}
