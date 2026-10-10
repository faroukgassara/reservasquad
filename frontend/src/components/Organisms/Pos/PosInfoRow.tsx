import type { ReactNode } from 'react';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';

interface PosInfoRowProps {
    label: string;
    value: ReactNode;
    valueColor?: 'text-gray-900' | 'text-danger-600' | 'text-success-700';
}

export default function PosInfoRow({ label, value, valueColor = 'text-gray-900' }: Readonly<PosInfoRowProps>) {
    return (
        <Div className="grid grid-cols-1 gap-0.5 py-1.5 min-[400px]:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] min-[400px]:items-center min-[400px]:gap-4">
            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                {label}
            </Label>
            {typeof value === 'string' ? (
                <Label variant={EVariantLabel.bodySmall} color={valueColor} className="break-words tabular-nums">
                    {value}
                </Label>
            ) : (
                value
            )}
        </Div>
    );
}
