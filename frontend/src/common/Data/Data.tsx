import { EButtonSize, EButtonType, ESize } from "@/Enum/Enum";
import { ELabelColor } from "@/theme/labelColors";

export const TYPE_VARIANT_CLASSES: Record<EButtonType, string> = {
    [EButtonType.primary]: 'bg-accent-500 hover:bg-accent-600 text-white',
    [EButtonType.secondary]: 'bg-white hover:bg-primary-25 text-primary-900 border border-primary-600',
    [EButtonType.tertiary]: 'bg-gray-900 hover:bg-gray-800 text-white',
    [EButtonType.gray]: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    [EButtonType.iconButton]: 'bg-transparent hover:bg-gray-100 text-gray-700',
};

export const BUTTON_SIZES: Record<EButtonSize, string> = {
    [EButtonSize.small]: 'h-8 px-3 text-sm',
    [EButtonSize.medium]: 'h-10 px-4 text-md',
    [EButtonSize.large]: 'h-12 px-6 text-lg',
};

export const ICON_SIZES: Record<EButtonSize, string> = {
    [EButtonSize.small]: 'text-md',
    [EButtonSize.medium]: 'text-lg',
    [EButtonSize.large]: 'text-xl',
};

export const ICON_ONLY_SIZES: Record<EButtonSize, string> = {
    [EButtonSize.small]: 'h-8 w-8',
    [EButtonSize.medium]: 'h-10 w-10',
    [EButtonSize.large]: 'h-12 w-12',
};

export const BUTTON_LABEL_COLOR: Record<EButtonType, ELabelColor> = {
    [EButtonType.primary]: 'text-white',
    [EButtonType.secondary]: 'text-accent-600',
    [EButtonType.tertiary]: 'text-white',
    [EButtonType.gray]: 'text-gray-700',
    [EButtonType.iconButton]: 'text-gray-700',
};

export const getSizeClasses = (size: ESize, variant: 'pill' | 'underline') => {
    if (variant === 'underline') {
        switch (size) {
            case ESize.xs:
                return { container: 'gap-6', button: 'pb-3 text-xs' };
            case ESize.sm:
                return { container: 'gap-8', button: 'pb-3.5 text-sm' };
            case ESize.xl:
                return { container: 'gap-10', button: 'pb-4 text-base' };
            case ESize.lg:
            case ESize.md:
            default:
                return { container: 'gap-8', button: 'pb-3.5 text-sm' };
        }
    }

    switch (size) {
        case ESize.xs:
            return { container: 'p-0.5', button: 'px-2 py-1 text-[11px]' };
        case ESize.sm:
            return { container: 'p-0.5', button: 'px-3 py-1.5 text-xs' };
        case ESize.md:
            return { container: 'p-0.5', button: 'px-5 py-2 text-sm' };
        case ESize.xl:
            return { container: 'p-1', button: 'px-9 py-3 text-base' };
        case ESize.lg:
        default:
            return { container: 'p-1', button: 'px-7 py-2.5 text-sm' };
    }
};
