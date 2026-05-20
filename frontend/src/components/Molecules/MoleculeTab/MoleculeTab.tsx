'use client';

import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import { ESize, EVariantLabel } from '@/Enum/Enum';
import { IMoleculeTabProps } from '@/interfaces/Molecules/IMoleculeTab/IMoleculeTab';
import { twMerge } from 'tailwind-merge';
import { getSizeClasses } from '@/common/Data/Data';

const MoleculeTab = ({
    options,
    value,
    onChange,
    size = ESize.lg,
    variant = 'underline',
    buttonClassName = '',
    className = '',
}: IMoleculeTabProps) => {
    const sizeClasses = getSizeClasses(size, variant);

    if (variant === 'underline') {
        return (
            <AtomDiv
                role="tablist"
                className={twMerge('flex w-full items-end border-b border-gray-200', sizeClasses.container, className)}
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
                                'relative -mb-px cursor-pointer font-medium transition-colors duration-200',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2',
                                sizeClasses.button,
                                buttonClassName,
                            )}
                        >
                            <AtomLabel
                                variant={EVariantLabel.bodySmall}
                                color={isActive ? 'text-primary-600' : 'text-gray-500'}
                                className={twMerge(
                                    'relative z-10 whitespace-nowrap pointer-events-none',
                                    !isActive && 'hover:text-gray-800',
                                )}
                            >
                                {option.label}
                            </AtomLabel>
                            {isActive ?
                                <AtomDiv
                                    className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-0.5 rounded-full bg-primary-600"
                                    aria-hidden
                                />
                                : null}
                        </button>
                    );
                })}
            </AtomDiv>
        );
    }

    return (
        <AtomDiv
            role="tablist"
            className={twMerge(
                'inline-flex w-fit items-center rounded-full',
                'bg-slate-100/90 ring-1 ring-inset ring-slate-200/70 shadow-sm',
                sizeClasses.container,
                className,
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
                                'relative cursor-pointer rounded-full transition-colors duration-200',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/25 focus-visible:ring-offset-1',
                                isActive ? 'font-semibold' : 'font-medium',
                                sizeClasses.button,
                                buttonClassName,
                            )}
                        >
                        {isActive ?
                            <AtomDiv
                                className="pointer-events-none absolute inset-0 z-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200/50"
                            >
                                <AtomDiv className="absolute inset-0 rounded-full bg-primary-600" />
                            </AtomDiv>
                            : null}
                        <AtomLabel
                            variant={EVariantLabel.bodySmall}
                            color={isActive ? 'text-white' : 'text-gray-500'}
                            className={twMerge(
                                'relative z-10 whitespace-nowrap pointer-events-none',
                                !isActive && 'hover:text-gray-800',
                            )}
                        >
                            {option.label}
                        </AtomLabel>
                    </button>
                );
            })}
        </AtomDiv>
    );
};

export default MoleculeTab;
