import { SidebarContext } from "@/contexts/SidebarContext";
import { useContext } from "react";

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("Sidebar components must be used within a Sidebar");
    }
    return context;
};
