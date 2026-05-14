import { EButtonSize, EButtonType } from "@/Enum/Enum";
import { ELabelColor } from "@/theme/labelColors";

export const TYPE_VARIANT_CLASSES: Record<EButtonType, string> = {
    [EButtonType.primary]: 'bg-primary-500 hover:bg-primary-600 text-white',
    [EButtonType.secondary]: 'bg-white hover:bg-gray-50 text-primary-500 border border-primary-500',
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
    [EButtonType.secondary]: 'text-primary-500',
    [EButtonType.tertiary]: 'text-white',
    [EButtonType.gray]: 'text-gray-700',
    [EButtonType.iconButton]: 'text-gray-700',
};
