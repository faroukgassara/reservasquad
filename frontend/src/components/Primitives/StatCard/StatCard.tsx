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
}

const StatCard = ({ icon, iconBg, iconColor, label, value }: IStatCard) => {
    return (
        <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Div className="flex items-center gap-3">
                <Div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                    <Icon name={icon} size={ESize.sm} color={iconColor} />
                </Div>
                <Div className="min-w-0 flex flex-col">
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block truncate">
                        {label}
                    </Label>
                    <Label
                        variant={EVariantLabel.h5}
                        color="text-gray-900"
                        className="block truncate font-semibold tabular-nums"
                    >
                        {value}
                    </Label>
                </Div>
            </Div>
        </Div>
    );
};

export default StatCard;
