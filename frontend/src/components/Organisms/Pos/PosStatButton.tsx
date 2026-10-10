import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

interface PosStatButtonProps {
    icon: IconComponentsEnum;
    value: string;
    label: string;
    onClick?: () => void;
}

export default function PosStatButton({ icon, value, label, onClick }: Readonly<PosStatButtonProps>) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className="flex min-h-11 min-w-0 items-center gap-2 border-gray-100 px-4 py-3 text-start transition-colors enabled:hover:bg-gray-50 sm:min-w-36 sm:border-s"
        >
            <Icon name={icon} size={ESize.md} color="text-gray-600" className="shrink-0" />
            <Div className="flex min-w-0 flex-col">
                <Label variant={EVariantLabel.bodySmall} color="text-primary-600" className="font-semibold tabular-nums">
                    {value}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-600">
                    {label}
                </Label>
            </Div>
        </button>
    );
}
