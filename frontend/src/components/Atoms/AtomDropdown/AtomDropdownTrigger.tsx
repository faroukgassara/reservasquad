import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { IconComponentsEnum } from "@/Enum/Enum";
import { useDropdown } from "./AtomDropdownLogic";
import AtomIcon from "../AtomIcon/AtomIcon";

interface IAtomDropdownTrigger {
    placeholder?: string;
    label?: string;
    error?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

const AtomDropdownTrigger = forwardRef<HTMLButtonElement, IAtomDropdownTrigger>(
    ({ error, className, disabled, placeholder, label, icon }, ref) => {
        const { isOpen } = useDropdown();
        const defaultClassName = [
            'w-full bg-white rounded-lg py-2 px-3 flex items-center justify-between cursor-pointer',
            'shadow-sm border border-gray-300 select-none',
            'outline-none focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-50',
        ]

        if (error) {
            defaultClassName.push('border-danger-300 focus-within:border-danger-300 focus-within:ring-4 focus-within:ring-danger-50')
        }

        if (disabled) {
            defaultClassName.push('bg-gray-200 cursor-not-allowed')
        }

        const textStyle = label ? 'text-gray-900' : 'text-gray-500'

        return (
            <button type="button" ref={ref} className={twMerge(defaultClassName.join(' '), className)}>
                <div className="flex items-center">
                    {icon && <span className="mr-2">{icon}</span>}
                    <span className={textStyle}>{label || placeholder || 'Select an option'}</span>
                </div>

                {isOpen ? (
                    <AtomIcon name={IconComponentsEnum.chevronUp} size='text-medium' color="text-gray-700" />
                ) : (
                    <AtomIcon name={IconComponentsEnum.chevronDown} size='text-medium' color="text-gray-700" />
                )}
            </button>
        )


    }
);

AtomDropdownTrigger.displayName = 'AtomDropdownTrigger'
export default AtomDropdownTrigger;