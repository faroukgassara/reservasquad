import type { MouseEventHandler } from 'react';
import { EBadgeSize, EBadgeType } from '@/Enum/Enum';
import { IIcon } from '../IIcon/IIcon';

export type IBadge = {
    text?: string;
    icon?: IIcon;
    isDismissible?: boolean;
    size?: EBadgeSize;
    type?: EBadgeType
    onClick?: MouseEventHandler<HTMLButtonElement>,
    className?: string,
    id: string
    onDismiss?: () => void;
}