"use client";

import { ISidebarContext } from "@/interfaces";
import { createContext } from "react";

const SidebarContext = createContext<ISidebarContext | undefined>(undefined);

export {
    SidebarContext
};