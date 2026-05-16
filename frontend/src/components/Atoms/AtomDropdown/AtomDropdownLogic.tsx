import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { IconComponentsEnum } from "@/Enum/Enum";
import AtomIcon from "../AtomIcon/AtomIcon";
import AtomDiv from "../AtomDiv/AtomDiv";

interface DropdownContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    selectedValue: string | number | undefined;
    handleSelect: (value: string | number) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownContext = createContext<DropdownContextType | undefined>({
    isOpen: false,
    setIsOpen: () => { },
    selectedValue: undefined,
    handleSelect: () => { },
    containerRef: { current: null },
    contentRef: { current: null },
});

export const useDropdown = () => {
    const context = useContext(DropdownContext);
    if (!context) {
        throw new Error("useDropdown must be used within a DropdownProvider");
    }
    return context;
}

export const DropdownRoot = ({
    children,
    value,
    onChange,
    className,
    keepOpen = false,
}: {
    children: React.ReactNode;
    value?: string | number;
    onChange?: (value: string | number) => void;
    className?: string;
    keepOpen?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleSelect = (value: string | number) => {
        onChange?.(value);
        if (!keepOpen) setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const inContainer = containerRef.current?.contains(target);
            const inContent = contentRef.current?.contains(target);
            if (!inContainer && !inContent) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [])

    return (
        <DropdownContext.Provider value={{ isOpen, setIsOpen, selectedValue: value, handleSelect, containerRef, contentRef }}>
            <div ref={containerRef} className={twMerge("relative inline-block w-auto", className)}>
                {children}
            </div>
        </DropdownContext.Provider>
    )
}

export const DropdownTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { isOpen, setIsOpen } = useDropdown();
    return (
        <AtomDiv onClick={() => setIsOpen(!isOpen)} className={twMerge("inline-flex", className)}>
            {children}
        </AtomDiv>
    )
}

export const DropdownContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { isOpen, containerRef, contentRef } = useDropdown();
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && containerRef.current && typeof document !== 'undefined') {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8,
                left: rect.left,
            });
        }
    }, [isOpen, containerRef]);

    if (!isOpen) return null;

    const content = (
        <div
            ref={contentRef}
            className={twMerge(
                "fixed z-portalDropdown min-w-[160px] bg-white border border-gray-100 rounded-lg shadow-xxl max-h-60 overflow-auto",
                className
            )}
            style={{ top: position.top, left: position.left }}
        >
            {children}
        </div>
    );

    if (typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }
    return content;
}

export const DropdownItem = ({ children, value, className }: { children: React.ReactNode, value: string | number, className?: string }) => {
    const { handleSelect, selectedValue } = useDropdown();
    const isSelected = selectedValue === value;
    return (
        <AtomDiv onClick={() => handleSelect(value)} className={twMerge("px-2.5 py-2 cursor-pointer hover:bg-gray-50", isSelected ? "bg-gray-50" : "", className)}>
            {isSelected ? (
                <AtomDiv className="flex items-center justify-between">
                    {children}
                    <AtomIcon name={IconComponentsEnum.check} size='text-large' color="text-gray-700" />
                </AtomDiv>
            ) : (
                <>
                    {children}
                </>
            )}
        </AtomDiv>
    )
}