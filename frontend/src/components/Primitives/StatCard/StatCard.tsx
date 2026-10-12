import type { ReactNode } from 'react';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import type { ELabelColor } from '@/theme/labelColors';

export interface IStatCard {
    icon: IconComponentsEnum;
    iconBg: string;
    iconColor: ELabelColor;
    label: string;
    value: string;
    action?: ReactNode;
    isLoading?: boolean;
    className?: string;
}

const StatCard = ({
    icon,
    iconBg,
    iconColor,
    label,
    value,
    action,
    isLoading = false,
    className = '',
}: IStatCard) => {
    return (
        <Div
            className={`rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-primary-300 hover:shadow-md ${className}`}
        >
            <Div className="flex items-center gap-3.5">
                <Div className={`flex size-11 shrink-0 items-center justify-center rounded-xl shadow-xs ${iconBg}`}>
                    <Icon name={icon} size={ESize.sm} color={iconColor} />
                </Div>
                <Div className="min-w-0 flex flex-1 flex-col">
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block truncate font-medium">
                        {label}
                    </Label>
                    {isLoading ? (
                        <Div className="mt-1.5 h-6 w-24 animate-pulse rounded-lg bg-gray-100" />
                    ) : (
                        <span className="mt-0.5 block truncate text-xl font-bold text-gray-900 tabular-nums sm:text-2xl">
                            {value}
                        </span>
                    )}
                </Div>
                {action ? <Div className="shrink-0">{action}</Div> : null}
            </Div>
        </Div>
    );
};

export default StatCard;
