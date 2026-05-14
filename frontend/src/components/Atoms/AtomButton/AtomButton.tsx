import { memo } from 'react';
import { twMerge } from 'tailwind-merge';
import { EButtonType } from '@/Enum/Enum';
import { IAtomButton } from '@/interfaces';
import { TYPE_VARIANT_CLASSES } from '@/common';

const AtomButton = memo(function AtomButton({
    className = '',
    text,
    children,
    type = EButtonType.primary,
    disabled = false,
    style = {},
    onClick,
    id,
    ariaBusy,
}: IAtomButton) {
    const buttonClassName = twMerge(
        [
            'relative flex items-center justify-center text-md font-medium rounded-lg px-4 py-2 transition-colors duration-200',
            TYPE_VARIANT_CLASSES[type],
            !disabled && 'cursor-pointer',
            disabled && '!cursor-not-allowed opacity-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            className,
        ]
            .filter((c): c is string => Boolean(c))
            .join(' '),
    );

    return (
        <button
            type="button"
            className={buttonClassName}
            style={style}
            disabled={disabled}
            aria-disabled={disabled}
            aria-busy={ariaBusy}
            onClick={onClick}
            id={id}
        >
            <span className="relative flex w-full items-center justify-center">
                {children ?? text}
            </span>
        </button>
    );
});

export default AtomButton;
