import { EBadgeSize, EBadgeType, EButtonSize, EButtonType, EInputSize, EInputStatus, ESize } from "@/Enum/Enum";
import { ELabelColor } from "@/theme/labelColors";

export const TYPE_VARIANT_CLASSES: Record<EButtonType, string> = {
    [EButtonType.primary]: 'bg-accent-500 text-white cursor-pointer hover:bg-accent-600 focus:bg-accent-500 focus:border-3 focus:border-accent-200 active:bg-accent-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed',
    [EButtonType.secondary]: 'bg-white text-primary-500 cursor-pointer border-2 border-primary-500 hover:bg-primary-50 focus:bg-white focus:border-3 focus:border-primary-200 active:bg-primary-100 disabled:bg-white disabled:text-gray-400 disabled:border-2 disabled:border-gray-200 disabled:cursor-not-allowed',
    [EButtonType.tertiary]: 'text-primary-500 cursor-pointer hover:bg-primary-50 focus:bg-white focus:border-3 focus:border-primary-200 active:bg-primary-100 disabled:bg-white  disabled:text-gray-400 disabled:cursor-not-allowed',
};

export const BUTTON_SIZES: Record<EButtonSize, string> = {
    [EButtonSize.small]: 'h-8 px-3 text-sm',
    [EButtonSize.medium]: 'h-10 px-4 text-md',
    [EButtonSize.large]: 'h-12 px-6 text-lg',
};

export const ICON_ONLY_SIZES: Record<EButtonSize, string> = {
    [EButtonSize.small]: 'h-8 w-8',
    [EButtonSize.medium]: 'h-10 w-10',
    [EButtonSize.large]: 'h-12 w-12',
};

export const INPUT_SIZES: Record<EInputSize, { field: string; text: string; iconLeft: string; iconRight: string; iconSize: ESize }> = {
    [EInputSize.small]: { field: 'h-8', text: 'text-sm', iconLeft: 'left-2.5', iconRight: 'right-2.5', iconSize: ESize.xs },
    [EInputSize.medium]: { field: 'h-10', text: 'text-sm', iconLeft: 'left-3', iconRight: 'right-3', iconSize: ESize.sm },
    [EInputSize.large]: { field: 'h-12', text: 'text-base', iconLeft: 'left-4', iconRight: 'right-4', iconSize: ESize.md },
};

export const INPUT_STATUS_FIELD: Record<EInputStatus, string> = {
    [EInputStatus.default]: 'border-gray-300 focus-within:border-2 hover:border-2',
    [EInputStatus.success]: 'border-success-500 focus-within:border-2 hover:border-2',
    [EInputStatus.error]: 'border-danger-500 focus-within:border-2 hover:border-2',
};

export const INPUT_STATUS_HINT_COLOR: Record<EInputStatus, ELabelColor> = {
    [EInputStatus.default]: 'text-gray-600',
    [EInputStatus.success]: 'text-success-600',
    [EInputStatus.error]: 'text-danger-600',
};

export const INPUT_STATUS_ICON_COLOR: Record<EInputStatus, ELabelColor> = {
    [EInputStatus.default]: 'text-gray-500',
    [EInputStatus.success]: 'text-success-500',
    [EInputStatus.error]: 'text-danger-500',
};

export const AVATAR_SIZE_MAP: Record<ESize, { root: string; text: string; dot: string; badge: string }> = {
    [ESize.xs]: { root: "h-6 w-6", text: "text-[10px]", dot: "h-2 w-2", badge: "h-2.5 w-2.5" },
    [ESize.sm]: { root: "h-8 w-8", text: "text-xs", dot: "h-2.5 w-2.5", badge: "h-3 w-3" },
    [ESize.md]: { root: "h-10 w-10", text: "text-sm", dot: "h-3 w-3", badge: "h-3.5 w-3.5" },
    [ESize.lg]: { root: "h-12 w-12", text: "text-base", dot: "h-3.5 w-3.5", badge: "h-4 w-4" },
    [ESize.xl]: { root: "h-16 w-16", text: "text-lg", dot: "h-4 w-4", badge: "h-5 w-5" },
};

export const ICON_ONLY_SIZES_BADGE: Record<EBadgeSize, string> = {
    [EBadgeSize.tiny]: 'h-6 w-6',
    [EBadgeSize.small]: 'h-8 w-8',
    [EBadgeSize.medium]: 'h-10 w-10',
};

export const TYPE_VARIANT_CLASSES_BADGE: Record<EBadgeType, string> = {
    [EBadgeType.primary]: 'bg-accent-500 text-white',
    [EBadgeType.success]: 'bg-success-500 text-white',
    [EBadgeType.warning]: 'bg-warning-500 text-white',
    [EBadgeType.error]: 'bg-danger-500 text-white',
    [EBadgeType.revprimary]: 'bg-primary-50 text-primary-500 border border-primary-500',
    [EBadgeType.revsuccess]: 'bg-success-50 text-success-500 border border-success-500',
    [EBadgeType.revwarning]: 'bg-warning-50 text-warning-500 border border-warning-500',
    [EBadgeType.reverror]: 'bg-danger-50 text-danger-500 border border-danger-500',
};

export const DISMISSIBLE_ICON_COLOR: Record<EBadgeType, ELabelColor> = {
    [EBadgeType.primary]: 'text-white',
    [EBadgeType.success]: 'text-white',
    [EBadgeType.warning]: 'text-white',
    [EBadgeType.error]: 'text-white',
    [EBadgeType.revprimary]: 'text-primary-500',
    [EBadgeType.revsuccess]: 'text-success-500',
    [EBadgeType.revwarning]: 'text-warning-500',
    [EBadgeType.reverror]: 'text-danger-500',
};

export const BADGE_SIZES: Record<EBadgeSize, string> = {
    [EBadgeSize.tiny]: 'h-6 px-2 text-sm',
    [EBadgeSize.small]: 'h-8 px-2 text-sm',
    [EBadgeSize.medium]: 'h-10 px-4 text-md',
};

export const ICON_SIZE_MAP: Record<ESize, string> = {
    [ESize.xs]: 'w-4 h-4',
    [ESize.sm]: 'w-5 h-5',
    [ESize.md]: 'w-6 h-6',
    [ESize.lg]: 'w-8 h-8',
    [ESize.xl]: 'w-12 h-12',
};