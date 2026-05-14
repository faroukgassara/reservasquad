"use client";

import {
    IMoleculeSidebar,
    IMoleculeSidebarContent,
    IMoleculeSidebarFooter,
    IMoleculeSidebarHeader,
    IMoleculeSidebarTrigger,
} from "@/interfaces";
import { SidebarContext } from "@/contexts/SidebarContext";
import { useSidebar } from "@/hooks/useSidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { Icon, Label } from "@/components/Atoms";
import AtomButton from "@/components/Atoms/AtomButton/AtomButton";
import { EButtonType, ESize, EVariantLabel, IconComponentsEnum } from "@/Enum/Enum";
import { twMerge } from "tailwind-merge";

const MoleculeSidebar = ({
    children,
    open,
    setOpen,
    className = "",
    ...props
}: IMoleculeSidebar) => (
    <SidebarContext.Provider value={{ open, setOpen }}>
        <aside {...props} className={twMerge(
                [
                    "flex h-auto max-h-[45vh] min-h-0 flex-col overflow-hidden transition-colors duration-200 md:h-full md:max-h-none",
                    className,
                    !open && "bg-primary-900",
                ]
                    .filter((c): c is string => Boolean(c))
                    .join(" ")
            )}>
            {children}
        </aside>
    </SidebarContext.Provider>
);

const SidebarHeader = ({
    className = "",
    ...props
}: IMoleculeSidebarHeader) => {
    const { open } = useSidebar();

    return (
        <div
            id="sidebar-header"
            {...props}
            className={`${className} sticky top-0 z-10  flex items-center ${open ? "justify-between" : "justify-center"}`}
        />
    );
};

const SidebarContent = ({
    className = "",
    data,
    ...props
}: IMoleculeSidebarContent) => {
    const { open } = useSidebar();
    const pathname = usePathname();

    return (
        <div
            id="sidebar-content"
            {...props}
            className={twMerge(
                ["flex-1 overflow-y-auto", className]
                    .filter((c): c is string => Boolean(c))
                    .join(" ")
            )}
        >
            <div className="flex flex-col gap-2">
                {data.map((item) => {
                    if (item.hidden) return null;
                    const isActive = item.href === pathname;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={twMerge(
                                [
                                    "flex items-center transition-all duration-200",
                                    open ? "pl-5 py-2.5 rounded-lg" : "justify-center h-12 w-12 mx-auto rounded-full",
                                    isActive
                                        ? open
                                            ? "text-gray-25 bg-accent-500"
                                            : "text-white bg-accent-400"
                                        : open
                                          ? "text-primary-600 hover:bg-primary-50"
                                          : "text-primary-100 hover:bg-primary-800",
                                ].join(" ")
                            )}
                            title={!open ? item.label : undefined}
                        >
                            <Icon
                                name={item.iconName}
                                size={ESize.md}
                                className="m-0"
                                color={
                                    isActive
                                        ? 'text-white'
                                        : open
                                          ? 'text-primary-600'
                                          : 'text-primary-100'
                                }
                            />

                            {open && (
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color={isActive ? 'text-white' : 'text-primary-900'}
                                    className="ml-3 cursor-pointer truncate"
                                >
                                    {item.label}
                                </Label>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const SidebarFooter = ({ className = "", ...props }: IMoleculeSidebarFooter) => {
    const { open } = useSidebar();
    return (
        <div
            id="sidebar-footer"
            {...props}
            className={twMerge(
                [
                    "sticky bottom-0 z-10 border-t transition-colors duration-200",
                    open ? "bg-white border-gray-100" : "bg-transparent border-primary-800",
                    className,
                ]
                    .filter((c): c is string => Boolean(c))
                    .join(" ")
            )}
        />
    );
}

const SidebarTrigger = ({ className, ...props }: IMoleculeSidebarTrigger) => {
    const { open, setOpen } = useSidebar();

    return (
        <AtomButton
            type={EButtonType.iconButton}
            className={twMerge(
                [
                    "flex size-10 items-center justify-center rounded-full border-none bg-gray-100 p-0 hover:opacity-70",
                    className,
                ]
                    .filter((c): c is string => Boolean(c))
                    .join(" ")
            )}
            {...props}
            onClick={() => setOpen(!open)}
        >
            <Icon
                name={IconComponentsEnum.collapse}
                size="w-5 h-5"
                color={!open ? "text-primary-100" : "text-primary-600"}
            />
        </AtomButton>
    );
};

export {
    MoleculeSidebar,
    MoleculeSidebar as Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarTrigger,
};
