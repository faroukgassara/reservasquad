import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

export interface IUnpaidStatCard {
    label: string;
    value: string;
    supportingText: string;
    isLoading?: boolean;
}

const UnpaidStatCard = ({
    label,
    value,
    supportingText,
    isLoading = false,
}: IUnpaidStatCard) => {
    return (
        <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Div className="flex items-center gap-3">
                <Div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-50">
                    <Icon
                        name={IconComponentsEnum.alert}
                        size={ESize.sm}
                        color="text-warning-600"
                    />
                </Div>
                <Div className="min-w-0 flex flex-col">
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                        {label}
                    </Label>
                    <Label variant={EVariantLabel.h5} color="text-gray-900" className="block">
                        {isLoading ? '—' : value}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                        {isLoading ? '—' : supportingText}
                    </Label>
                </Div>
            </Div>
        </Div>
    );
};

export default UnpaidStatCard;
