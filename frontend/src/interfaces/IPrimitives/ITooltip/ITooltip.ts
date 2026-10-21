import type { Placement } from '@floating-ui/react';
import type { ReactNode } from 'react';

interface ITooltip {
    content: string;
    children: ReactNode;
    placement?: Placement;
    disabled?: boolean;
    className?: string;
}

export type { ITooltip };
