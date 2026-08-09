"use client";

import { ISidebarContext } from "@/interfaces/IPrimitives/ISidebar/ISidebar";
import { createContext } from "react";

const SidebarContext = createContext<ISidebarContext | undefined>(undefined);

export {
    SidebarContext
};