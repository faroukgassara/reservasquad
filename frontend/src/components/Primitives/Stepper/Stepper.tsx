'use client';

import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import { ESize, IconComponentsEnum } from '@/Enum/Enum';
import type { ELabelColor } from '@/theme/labelColors';
import IStepper from '@/interfaces/IPrimitives/IStepper/IStepper';
import { twMerge } from 'tailwind-merge';

function getStepTone(isActive: boolean, isDone: boolean) {
    if (isActive) {
        return {
            container: 'bg-primary-500 text-white',
            iconColor: 'text-white' as ELabelColor,
        };
    }
    if (isDone) {
        return {
            container: 'bg-primary-50 text-primary-600',
            iconColor: 'text-primary-600' as ELabelColor,
        };
    }
    return {
        container: 'bg-gray-100 text-gray-500',
        iconColor: 'text-gray-500' as ELabelColor,
    };
}

export default function Stepper({
    steps,
    currentStepId,
    className,
    onStepClick,
}: Readonly<IStepper>) {
    const currentIndex = Math.max(
        0,
        steps.findIndex((step) => step.id === currentStepId),
    );

    return (
        <Div
            className={twMerge('flex flex-wrap items-center gap-2 sm:gap-3', className)}
            role="list"
            aria-label="Progress"
        >
            {steps.map((step, index) => {
                const isActive = index === currentIndex;
                const isDone = index < currentIndex;
                const isClickable = Boolean(onStepClick) && isDone;
                const tone = getStepTone(isActive, isDone);
                const iconName = isDone
                    ? IconComponentsEnum.check
                    : (step.icon ?? IconComponentsEnum.dot);

                const content = (
                    <>
                        <Icon name={iconName} size={ESize.sm} color={tone.iconColor} />
                        <span className="whitespace-nowrap text-sm font-medium">{step.label}</span>
                    </>
                );

                return (
                    <Div key={step.id} className="flex items-center gap-2 sm:gap-3" role="listitem">
                        {index > 0 && (
                            <Div
                                aria-hidden
                                className={twMerge(
                                    'hidden h-px w-6 sm:block sm:w-10',
                                    isDone || isActive ? 'bg-primary-500' : 'bg-gray-200',
                                )}
                            />
                        )}
                        {isClickable ? (
                            <button
                                type="button"
                                onClick={() => onStepClick?.(step.id)}
                                className={twMerge(
                                    'flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 sm:px-4',
                                    'bg-primary-50 text-primary-600 transition-colors hover:bg-primary-100',
                                )}
                            >
                                {content}
                            </button>
                        ) : (
                            <Div
                                aria-current={isActive ? 'step' : undefined}
                                className={twMerge(
                                    'flex items-center gap-2 rounded-full px-3 py-2 sm:px-4',
                                    tone.container,
                                )}
                            >
                                {content}
                            </Div>
                        )}
                    </Div>
                );
            })}
        </Div>
    );
}
