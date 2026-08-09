'use client';

import { createContext, useContext } from 'react';

type MobileSidebarContextValue = {
    isMobile: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
};

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null);

export function useMobileSidebar() {
    return useContext(MobileSidebarContext);
}

export { MobileSidebarContext };
