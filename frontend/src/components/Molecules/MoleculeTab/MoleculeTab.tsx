'use client';

import { ESize } from '@/Enum/Enum';
import { IMoleculeTabProps } from '@/interfaces/Molecules/IMoleculeTab/IMoleculeTab';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { twMerge } from 'tailwind-merge';

const getSizeClasses = (size: ESize) => {
    switch (size) {
        case ESize.xs:
            return { container: 'p-0.5', button: 'px-2 py-1 text-[11px]' };
        case ESize.sm:
            return { container: 'p-0.5', button: 'px-3 py-1.5 text-xs' };
        case ESize.md:
            return { container: 'p-0.5', button: 'px-5 py-2 text-sm' };
        case ESize.xl:
            return { container: 'p-1', button: 'px-9 py-3 text-base' };
        case ESize.lg:
        default:
            return { container: 'p-1', button: 'px-7 py-2.5 text-sm' };
    }
};

const MoleculeTab = ({
    options,
    value,
    onChange,
    size = ESize.lg,
    buttonClassName = '',
}: IMoleculeTabProps) => {
    const pillLayoutId = useId();
    const sizeClasses = getSizeClasses(size);

    return (
        <div
            role="tablist"
            className={twMerge(
                'inline-flex w-fit items-center rounded-full',
                'bg-slate-100/90 ring-1 ring-inset ring-slate-200/70',
                'shadow-sm',
                sizeClasses.container,
            )}
        >
            {options.map((option) => {
                const isActive = value === option.value;

                return (
                    <button
                        key={option.value}
                        id={`tab-button-${option.value}`}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(option.value)}
                        className={twMerge(
                            'relative rounded-full transition-colors duration-200',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/25 focus-visible:ring-offset-1',
                            isActive
                                ? 'font-semibold text-primary-900'
                                : 'font-medium text-slate-500 hover:text-slate-800',
                            sizeClasses.button,
                            buttonClassName,
                        )}
                    >
                        {isActive ? (
                            <motion.span
                                layoutId={pillLayoutId}
                                className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200/50"
                                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                aria-hidden
                            />
                        ) : null}
                        <span className="relative z-10 whitespace-nowrap">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default MoleculeTab;
