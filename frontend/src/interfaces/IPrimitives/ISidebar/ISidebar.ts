import { IconComponentsEnum } from "@/Enum/Enum";
import React from "react";
import IButton from "../IButton/IButton";

interface INavigationChildItem {
    id: string;
    label: string;
    href: string;
    hidden?: boolean;
}

interface INavigationItem {
    id: string;
    iconName: IconComponentsEnum;
    label: string;
    href: string;
    hidden?: boolean;
    children?: INavigationChildItem[];
}

interface ISidebarContext {
    open: boolean;
    setOpen: (open: boolean) => void;
    isMobile: boolean;
}

interface ISidebar extends React.PropsWithChildren<React.ComponentPropsWithoutRef<"aside">> {
    open: boolean;
    setOpen: (open: boolean) => void;
    isMobile?: boolean;
}

interface ISidebarTrigger extends IButton {
    asChild?: boolean;
}

interface ISidebarContent extends React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">> {
    asChild?: boolean;
    data: INavigationItem[];
}

interface ISidebarHeader extends React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">> {
    asChild?: boolean;
}

interface ISidebarFooter extends React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">> {
    asChild?: boolean;
}

export type {
    ISidebarContext,
    ISidebar,
    ISidebarTrigger,
    ISidebarContent,
    ISidebarHeader,
    ISidebarFooter,
    INavigationItem,
    INavigationChildItem,
};