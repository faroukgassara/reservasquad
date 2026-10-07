'use client';

import { twMerge } from 'tailwind-merge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import { EButtonSize, EButtonType } from '@/Enum/Enum';

export interface PosNumpadKey {
    value: string;
    label: string;
    accent?: boolean;
}

interface IPosNumpad {
    id: string;
    rows: PosNumpadKey[][];
    activeValue?: string;
    onKey: (value: string) => void;
    disabled?: boolean;
}

export default function PosNumpad({ id, rows, activeValue, onKey, disabled = false }: Readonly<IPosNumpad>) {
    const columns = Math.max(...rows.map((row) => row.length));

    return (
        <Div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
            {rows.flat().map((key, index) => {
                const isActive = activeValue === key.value;
                return (
                    <Button
                        key={`${key.value}-${index}`}
                        id={`${id}-key-${index}`}
                        type={isActive ? EButtonType.primary : EButtonType.secondary}
                        size={EButtonSize.large}
                        text={key.label}
                        disabled={disabled}
                        onClick={() => onKey(key.value)}
                        className={twMerge(
                            'h-12 rounded-lg px-1 tabular-nums',
                            key.accent && !isActive && 'bg-gray-100 hover:bg-gray-200',
                        )}
                    />
                );
            })}
        </Div>
    );
}
