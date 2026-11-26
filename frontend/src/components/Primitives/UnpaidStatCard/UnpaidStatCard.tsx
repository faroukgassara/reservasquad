import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Skeleton from '@/components/Primitives/Skeleton/Skeleton';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

export interface IUnpaidStatCard {
    label: string;
    value: string;
    supportingText: string;
    isLoading?: boolean;
    tone?: 'paid' | 'unpaid';
}

const UnpaidStatCard = ({
    label,
    value,
    supportingText,
    isLoading = false,
    tone = 'unpaid',
}: IUnpaidStatCard) => {
    const isPaid = tone === 'paid';

    return (
        <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Div className="flex items-center gap-3">
                <Div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                        isPaid ? 'bg-success-50' : 'bg-warning-50'
                    }`}
                >
                    <Icon
                        name={isPaid ? IconComponentsEnum.checkCircle : IconComponentsEnum.alert}
                        size={ESize.sm}
                        color={isPaid ? 'text-success-700' : 'text-warning-700'}
                    />
                </Div>
                <Div className="min-w-0 flex flex-col">
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                        {label}
                    </Label>
                    {isLoading ? (
                        <Skeleton className="mt-1 h-6 w-28" />
                    ) : (
                        <Label variant={EVariantLabel.h5} color="text-gray-900" className="block">
                            {value}
                        </Label>
                    )}
                    {isLoading ? (
                        <Skeleton className="mt-1.5 h-3.5 w-36" />
                    ) : (
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                            {supportingText}
                        </Label>
                    )}
                </Div>
            </Div>
        </Div>
    );
};

export default UnpaidStatCard;
