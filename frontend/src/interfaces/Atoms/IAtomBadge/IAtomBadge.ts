import { EBadgeSize, IconComponentsEnum, EBadgeColor } from '@/Enum/Enum'
export type IAtomBadge = {
    text: string;
    size?: EBadgeSize | string;
    icon?: IconComponentsEnum
    color?: EBadgeColor | string;
    className?: string;
}