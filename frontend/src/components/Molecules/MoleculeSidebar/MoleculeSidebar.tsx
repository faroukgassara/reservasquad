"use client";

import { SidebarContext } from "@/contexts/SidebarContext";
import { useSidebar } from "@/hooks/useSidebar";
import { Link, usePathname } from "@/i18n/navigation";
import AtomButton from "@/components/Atoms/AtomButton/AtomButton";
import { EButtonType, ESize, EVariantLabel, IconComponentsEnum } from "@/Enum/Enum";
import { twMerge } from "tailwind-merge";
import {
    IMoleculeSidebar,
    IMoleculeSidebarContent,
    IMoleculeSidebarFooter,
    IMoleculeSidebarHeader,
    IMoleculeSidebarTrigger,
    ISidebarContext,
} from "@/interfaces/Molecules/IMoleculeSidebar/IMoleculeSidebar";
import AtomIcon from "@/components/Atoms/AtomIcon/AtomIcon";
import AtomLabel from "@/components/Atoms/AtomLabel/AtomLabel";
import AtomLanguageSwitcher from "@/components/Atoms/AtomLanguageSwitcher/AtomLanguageSwitcher";
import Image from "next/image";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

type SidebarProviderProps = ISidebarContext & {
    children: React.ReactNode;
};

const SidebarProvider = ({ open, setOpen, isMobile, expanded, children }: SidebarProviderProps) => {
    const value = useMemo(
        () => ({ open, setOpen, isMobile, expanded }),
        [open, setOpen, isMobile, expanded],
    );

    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

const SidebarMobileBar = () => {
    const { isMobile } = useSidebar();
    const t = useTranslations();

    if (!isMobile) return null;

    return (
        <header className="sticky top-0 z-navigation flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 md:hidden">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger id="mobile-sidebar-trigger" />
                <Image
                    src="/branding/reservasquad-logo-horiz.png"
                    alt={t('brand.name')}
                    width={120}
                    height={40}
                    className="h-8 w-auto object-contain"
                    priority
                />
            </div>
        </header>
    );
};

const SidebarOverlay = () => {
    const { open, setOpen, isMobile } = useSidebar();

    if (!isMobile || !open) return null;

    return (
        <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-y-0 right-0 left-[min(280px,85vw)] z-sidebarBackdrop bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
        />
    );
};

const MoleculeSidebar = ({
    children,
    isMobile = false,
    open = false,
    className = "",
    ...props
}: IMoleculeSidebar) => (
    <aside
        {...props}
        className={twMerge(
            isMobile
                ? [
                    "fixed inset-y-0 left-0 z-sidebar flex h-dvh w-[min(280px,85vw)] flex-col overflow-hidden border-r border-gray-100 bg-white shadow-xl transition-transform duration-200 ease-out md:hidden",
                    open ? "translate-x-0" : "-translate-x-full pointer-events-none",
                ]
                : [
                    "hidden h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out md:flex",
                    !open && "bg-primary-900",
                ],
            className,
        )}
    >
        {children}
    </aside>
);

const SidebarHeader = ({
    className = "",
    ...props
}: IMoleculeSidebarHeader) => {
    const { expanded } = useSidebar();

    return (
        <div
            id="sidebar-header"
            {...props}
            className={twMerge(
                "sticky top-0 z-10 flex items-center",
                expanded ? "justify-between" : "justify-center",
                className,
            )}
        />
    );
};

const SidebarContent = ({
    className = "",
    data,
    ...props
}: IMoleculeSidebarContent) => {
    const { expanded, isMobile, setOpen } = useSidebar();
    const pathname = usePathname();

    return (
        <div
            id="sidebar-content"
            {...props}
            className={twMerge("flex-1 overflow-y-auto", className)}
        >
            <div className="flex flex-col gap-2">
                {data.map((item) => {
                    if (item.hidden) return null;
                    const isActive = item.href === pathname;
                    let linkClass = expanded
                        ? "rounded-lg py-2.5 pl-5 text-primary-600 hover:bg-primary-50"
                        : "mx-auto h-12 w-12 justify-center rounded-full text-primary-100 hover:bg-primary-800";

                    if (isActive) {
                        linkClass = expanded
                            ? "rounded-lg py-2.5 pl-5 bg-accent-500 text-gray-25"
                            : "mx-auto h-12 w-12 justify-center rounded-full bg-accent-400 text-white";
                    }

                    let iconColor: "text-white" | "text-primary-600" | "text-primary-100" = expanded
                        ? "text-primary-600"
                        : "text-primary-100";
                    if (isActive) iconColor = "text-white";

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => {
                                if (isMobile) setOpen(false);
                            }}
                            className={twMerge("flex items-center transition-all duration-200", linkClass)}
                            title={expanded ? undefined : item.label}
                        >
                            <AtomIcon name={item.iconName} size={ESize.md} className="m-0" color={iconColor} />

                            {expanded ? (
                                <AtomLabel
                                    variant={EVariantLabel.bodySmall}
                                    color={isActive ? "text-white" : "text-primary-900"}
                                    className="ml-3 cursor-pointer truncate"
                                >
                                    {item.label}
                                </AtomLabel>
                            ) : null}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const SidebarFooter = ({ className = "", children, ...props }: IMoleculeSidebarFooter) => {
    const { expanded } = useSidebar();

    return (
        <div
            id="sidebar-footer"
            {...props}
            className={twMerge(
                "sticky bottom-0 z-10 border-t transition-colors duration-200",
                expanded ? "border-gray-100 bg-white" : "border-primary-800 bg-transparent",
                className,
            )}
        >
            {children}
            <AtomLanguageSwitcher
                compact={!expanded}
                className={twMerge(expanded ? "mt-3 border-t border-gray-100 pt-3" : "mt-2")}
            />
        </div>
    );
};

const SidebarTrigger = ({ className, ...props }: IMoleculeSidebarTrigger) => {
    const { open, setOpen } = useSidebar();

    return (
        <AtomButton
            type={EButtonType.iconButton}
            className={twMerge(
                "flex size-10 items-center justify-center rounded-full border-none bg-gray-100 p-0 hover:opacity-70",
                className,
            )}
            {...props}
            onClick={() => setOpen(!open)}
        >
            <AtomIcon
                name={IconComponentsEnum.collapse}
                size="w-5 h-5"
                color={"text-primary-600"}
            />
        </AtomButton>
    );
};

export {
    MoleculeSidebar,
    MoleculeSidebar as Sidebar,
    SidebarProvider,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarTrigger,
    SidebarMobileBar,
    SidebarOverlay,
};
