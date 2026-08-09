'use client';

import { memo, useCallback, useId, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import ITabOption from '@/interfaces/IPrimitives/ITabOption/ITabOption';
import ITabs from '@/interfaces/IPrimitives/ITabs/ITabs';

const INDICATOR_TRANSITION = { type: 'spring', stiffness: 500, damping: 38 } as const;

function getTabTextClass(isActive: boolean, isDisabled: boolean): string {
    if (isDisabled) return 'text-gray-400';
    if (isActive) return 'text-primary-600';
    return 'text-gray-500';
}

type TabButtonProps = {
    option: ITabOption;
    isActive: boolean;
    isDisabled: boolean;
    variant: NonNullable<ITabs['variant']>;
    indicatorLayoutId: string;
    onSelect: (value: string) => void;
    onNavigate: (direction: -1 | 1) => void;
};

const TabButton = memo(function TabButton({
    option,
    isActive,
    isDisabled,
    variant,
    indicatorLayoutId,
    onSelect,
    onNavigate,
}: TabButtonProps) {
    const handleClick = () => {
        if (!isDisabled) {
            onSelect(option.value);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            onNavigate(1);
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            onNavigate(-1);
        }
    };

    return (
        <button
            type="button"
            role="tab"
            id={`tab-${option.value}`}
            aria-selected={isActive}
            aria-disabled={isDisabled}
            tabIndex={isActive ? 0 : -1}
            disabled={isDisabled}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={twMerge(
                'relative transition-colors duration-200 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                variant === 'underline'
                    ? 'rounded-t-lg px-4 py-2.5 hover:bg-gray-50'
                    : 'z-10 rounded-lg px-4 py-2',
                !isDisabled && !isActive && 'hover:text-gray-700',
            )}
        >
            {variant === 'pills' && isActive && (
                <motion.span
                    layoutId={indicatorLayoutId}
                    className="pointer-events-none absolute inset-0 rounded-lg bg-white shadow-sm"
                    transition={INDICATOR_TRANSITION}
                />
            )}

            <span
                className={twMerge(
                    'relative z-10 text-sm',
                    isActive ? 'font-semibold' : 'font-medium',
                    getTabTextClass(isActive, isDisabled),
                )}
            >
                {option.label}
            </span>

            {variant === 'underline' && isActive && (
                <motion.span
                    layoutId={indicatorLayoutId}
                    className="pointer-events-none absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary-500"
                    transition={INDICATOR_TRANSITION}
                />
            )}
        </button>
    );
});

const Tabs = memo(function Tabs({
    options,
    value,
    onChange,
    variant = 'underline',
    disabled = false,
    className = '',
}: ITabs) {
    const indicatorLayoutId = `${useId()}-tab-indicator`;

    const handleNavigate = useCallback(
        (direction: -1 | 1) => {
            const currentIndex = options.findIndex((option) => option.value === value);
            if (currentIndex === -1) return;

            const total = options.length;

            for (let step = 1; step <= total; step += 1) {
                const nextIndex = (currentIndex + direction * step + total) % total;
                const nextOption = options[nextIndex];

                if (!nextOption?.disabled && !disabled) {
                    onChange(nextOption.value);
                    break;
                }
            }
        },
        [disabled, onChange, options, value],
    );

    return (
        <div
            role="tablist"
            aria-orientation="horizontal"
            className={twMerge(
                variant === 'underline'
                    ? 'flex gap-0.5 border-b border-gray-200'
                    : 'inline-flex gap-0.5 rounded-xl bg-gray-100 p-1',
                className,
            )}
        >
            {options.map((option) => {
                const isActive = option.value === value;
                const isDisabled = disabled || Boolean(option.disabled);

                return (
                    <TabButton
                        key={option.value}
                        option={option}
                        isActive={isActive}
                        isDisabled={isDisabled}
                        variant={variant}
                        indicatorLayoutId={indicatorLayoutId}
                        onSelect={onChange}
                        onNavigate={handleNavigate}
                    />
                );
            })}
        </div>
    );
});

export default Tabs;
