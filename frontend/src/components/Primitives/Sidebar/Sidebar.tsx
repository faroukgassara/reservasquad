"use client";

import { useEffect, useMemo, useState } from "react";
import { SidebarContext } from "@/contexts/SidebarContext";
import { useSidebar } from "@/hooks/useSidebar";
import Link from "next/link";
import { usePathname } from "@/i18n/navigation";
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Button from "@/components/Primitives/Button/Button";
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from "@/Enum/Enum";
import { twMerge } from "tailwind-merge";
import { INavigationItem, ISidebar, ISidebarContent, ISidebarFooter, ISidebarHeader, ISidebarTrigger } from "@/interfaces/IPrimitives/ISidebar/ISidebar";

function pathMatches(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

function getVisibleChildren(item: INavigationItem) {
    return (item.children ?? []).filter((child) => !child.hidden);
}

const Sidebar = ({
    children,
    open,
    setOpen,
    isMobile = false,
    className = "",
    ...props
}: ISidebar) => {
    const sidebarValue = useMemo(
        () => ({ open, setOpen, isMobile }),
        [open, setOpen, isMobile],
    );

    return (
        <SidebarContext.Provider value={sidebarValue}>
            <aside
                {...props}
                className={twMerge(
                    [
                        "flex h-dvh shrink-0 flex-col overflow-x-hidden overflow-y-visible transition-all duration-200",
                        className,
                        !open && !isMobile ? "bg-primary-900" : "bg-white",
                    ]
                        .filter((c): c is string => Boolean(c))
                        .join(" ")
                )}
            >
                {children}
            </aside>
        </SidebarContext.Provider>
    );
};

const SidebarHeader = ({
    className = "",
    ...props
}: ISidebarHeader) => {
    const { open, isMobile } = useSidebar();
    const isExpanded = isMobile ? true : open;

    return (
        <div
            id="sidebar-header"
            {...props}
            className={twMerge(
                "sticky top-0 z-10 flex items-center",
                isExpanded ? "justify-between" : "justify-center",
                className,
            )}
        />
    );
};

const SidebarContent = ({
    className = "",
    data,
    ...props
}: ISidebarContent) => {
    const { open, setOpen, isMobile } = useSidebar();
    const pathname = usePathname();
    const isExpanded = isMobile ? true : open;
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    useEffect(() => {
        const activeGroups = data
            .filter((item) => {
                if (pathMatches(pathname, item.href)) return true;
                const children = getVisibleChildren(item);
                return children.some((child) => pathMatches(pathname, child.href));
            })
            .map((item) => item.id);

        if (activeGroups.length > 0) {
            setExpandedGroups((prev) => new Set([...prev, ...activeGroups]));
        }
    }, [pathname, data]);

    const toggleGroup = (id: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const getLinkStateClass = (isActive: boolean) => {
        if (isActive && isExpanded) return "bg-primary-500 text-gray-25";
        if (isActive) return "bg-primary-300 text-white";
        if (isExpanded) return "text-primary-400 hover:bg-gray-100";
        return "text-primary-100 hover:bg-primary-800";
    };

    const linkClassName = (isActive: boolean) =>
        twMerge(
            "flex items-center transition-all duration-200",
            isExpanded
                ? "rounded-lg py-2.5 pl-5"
                : "mx-auto size-12 shrink-0 justify-center rounded-full",
            getLinkStateClass(isActive),
        );

    const iconColor = (isActive: boolean) => {
        if (isActive) return "text-white";
        if (isExpanded) return "text-primary-400";
        return "text-primary-100";
    };

    const closeMobileSidebar = () => {
        if (isMobile) {
            setOpen(false);
        }
    };

    return (
        <div
            id="sidebar-content"
            {...props}
            className={twMerge(
                "flex-1 overflow-y-auto",
                isExpanded ? "sidebar-scroll" : "sidebar-scroll-dark flex flex-col items-center",
                className,
            )}
        >
            <div className={twMerge("flex flex-col gap-2", !isExpanded && "w-full items-center")}>
                {data.map((item) => {
                    if (item.hidden) return null;

                    const visibleChildren = getVisibleChildren(item);
                    const hasChildren = visibleChildren.length > 0;
                    const isChildActive = visibleChildren.some((child) => pathMatches(pathname, child.href));
                    const isParentActive = pathMatches(pathname, item.href) && !isChildActive;
                    const isGroupActive = isParentActive || isChildActive;
                    const isGroupOpen = expandedGroups.has(item.id);

                    if (!hasChildren) {
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={closeMobileSidebar}
                                className={linkClassName(pathMatches(pathname, item.href))}
                                title={!isExpanded ? item.label : undefined}
                            >
                                <Icon
                                    name={item.iconName}
                                    size={ESize.md}
                                    className="m-0 block"
                                    color={iconColor(pathMatches(pathname, item.href))}
                                />
                                {isExpanded && (
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color={pathMatches(pathname, item.href) ? "text-white" : "text-gray-800"}
                                        className="ml-3 cursor-pointer truncate"
                                    >
                                        {item.label}
                                    </Label>
                                )}
                            </Link>
                        );
                    }

                    return (
                        <div key={item.id} className="flex flex-col gap-1">
                            <div
                                className={twMerge(
                                    linkClassName(isGroupActive),
                                    isExpanded && "justify-between pr-3",
                                )}
                            >
                                <Link
                                    href={item.href}
                                    onClick={closeMobileSidebar}
                                    className={twMerge(
                                        "flex min-w-0 items-center",
                                        isExpanded ? "flex-1" : "size-full justify-center",
                                        isExpanded && isParentActive && "text-white",
                                    )}
                                    title={!isExpanded ? item.label : undefined}
                                >
                                    <Icon
                                        name={item.iconName}
                                        size={ESize.md}
                                        className="m-0 block"
                                        color={iconColor(isGroupActive)}
                                    />
                                    {isExpanded && (
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color={isGroupActive ? "text-white" : "text-gray-800"}
                                            className="ml-3 cursor-pointer truncate"
                                        >
                                            {item.label}
                                        </Label>
                                    )}
                                </Link>

                                {isExpanded && (
                                    <Icon
                                        name={isGroupActive ? IconComponentsEnum.chevronUp : IconComponentsEnum.chevronDown}
                                        size={ESize.sm}
                                        color={isGroupActive ? "text-white" : "text-primary-400"}
                                        handleClick={() => toggleGroup(item.id)}
                                        className="cursor-pointer"
                                    />
                                )}
                            </div>

                            {isExpanded && isGroupOpen && (
                                <div className="ms-8 flex flex-col gap-1 border-s-2 border-gray-100 ps-3">
                                    {visibleChildren.map((child) => {
                                        const isChildLinkActive = pathMatches(pathname, child.href);

                                        return (
                                            <Link
                                                key={child.id}
                                                href={child.href}
                                                onClick={closeMobileSidebar}
                                                className={twMerge(
                                                    "rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                                                    isChildLinkActive
                                                        ? "bg-primary-50 font-medium text-primary-700"
                                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                                )}
                                            >
                                                {child.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SidebarFooter = ({ className = "", ...props }: ISidebarFooter) => {
    const { open, isMobile } = useSidebar();
    const isExpanded = isMobile ? true : open;

    return (
        <div
            id="sidebar-footer"
            {...props}
            className={twMerge(
                [
                    "sticky bottom-0 z-20 border-t transition-colors duration-200",
                    isExpanded
                        ? "border-gray-100 bg-white"
                        : "flex flex-col items-center gap-3 border-primary-800 bg-transparent",
                    className,
                ]
                    .filter((c): c is string => Boolean(c))
                    .join(" "),
            )}
        />
    );
};

const SidebarTrigger = ({ className, ...props }: ISidebarTrigger) => {
    const { open, setOpen, isMobile } = useSidebar();
    const isCollapsedDesktop = !isMobile && !open;

    let triggerAriaLabel = "Ouvrir le menu";
    if (isMobile) {
        triggerAriaLabel = "Fermer le menu";
    } else if (open) {
        triggerAriaLabel = "Réduire le menu";
    }

    const triggerClassName = isCollapsedDesktop
        ? "bg-primary-800 text-primary-100 hover:bg-primary-700"
        : "size-10 bg-gray-100 hover:opacity-70";

    return (
        <Button
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{
                name: isCollapsedDesktop ? IconComponentsEnum.chevronRight : IconComponentsEnum.chevronLeft,
                size: ESize.sm,
                color: isCollapsedDesktop ? "text-primary-100" : "text-primary-400",
            }}
            className={twMerge(
                "flex size-12 shrink-0 items-center justify-center rounded-full border-none p-0",
                triggerClassName,
                className,
            )}
            {...props}
            onClick={() => setOpen(isMobile ? false : !open)}
            aria-label={triggerAriaLabel}
        />
    );
};

export {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarTrigger,
};
