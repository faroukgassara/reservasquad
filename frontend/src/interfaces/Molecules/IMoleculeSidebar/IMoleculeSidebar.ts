import { IAtomButton } from "@/interfaces/Atoms";
import { IconComponentsEnum } from "@/Enum/Enum";
import React from "react";

interface INavigationItem {
    id: string;
    iconName: IconComponentsEnum;
    label: string;
    href: string;
    hidden?: boolean;
}

interface ISidebarContext {
    open: boolean;
    setOpen: (open: boolean) => void;
}

interface IMoleculeSidebar extends React.PropsWithChildren<React.ComponentPropsWithoutRef<"aside">> {
    open: boolean;
    setOpen: (open: boolean) => void;
}

interface IMoleculeSidebarTrigger extends IAtomButton {
    asChild?: boolean;
}

interface IMoleculeSidebarContent extends React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">> {
    asChild?: boolean;
    data: INavigationItem[];
}

interface IMoleculeSidebarHeader extends React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">> {
    asChild?: boolean;
}

interface IMoleculeSidebarFooter extends React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">> {
    asChild?: boolean;
}

export type {
    ISidebarContext,
    IMoleculeSidebar,
    IMoleculeSidebarTrigger,
    IMoleculeSidebarContent,
    IMoleculeSidebarHeader,
    IMoleculeSidebarFooter,
    INavigationItem,
};