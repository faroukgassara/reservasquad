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
        <Div className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-4 py-1.5">
            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                {label}
            </Label>
            {typeof value === 'string' ? (
                <Label variant={EVariantLabel.bodySmall} color={valueColor} className="tabular-nums">
                    {value}
                </Label>
            ) : (
                value
            )}
        </Div>
    );
}
