"use client";

import { ISidebarContext } from "@/interfaces/Molecules/IMoleculeSidebar/IMoleculeSidebar";
import { createContext } from "react";

const SidebarContext = createContext<ISidebarContext | undefined>(undefined);

export {
    SidebarContext
};