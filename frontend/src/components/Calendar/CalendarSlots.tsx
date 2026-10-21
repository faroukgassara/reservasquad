'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import {
    EButtonSize,
    EButtonType,
    ESize,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

export function AddDayButton({
    onClick,
    ariaLabel,
    className = '',
    id = 'cal-add-day',
}: Readonly<{
    onClick: () => void;
    ariaLabel: string;
    className?: string;
    id?: string;
}>) {
    return (
        <Button
            id={id}
            type={EButtonType.tertiary}
            size={EButtonSize.small}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.plus, size: ESize.xs, color: 'text-primary-500' }}
            aria-label={ariaLabel}
            className={`h-6 w-6 shrink-0 bg-white/80 shadow-xs opacity-100 after:absolute after:-inset-2.5 after:content-[''] md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 ${className}`}
            onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onClick();
            }}
        />
    );
}

export function EmptySlot({
    label,
    actionable = false,
    droppable = false,
    onClick,
}: Readonly<{
    label: string;
    actionable?: boolean;
    droppable?: boolean;
    onClick?: () => void;
}>) {
    const interactive = actionable && Boolean(onClick);
    return (
        <Div
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? label : undefined}
            onClick={
                interactive
                    ? (e: MouseEvent) => {
                          e.stopPropagation();
                          onClick?.();
                      }
                    : undefined
            }
            onKeyDown={
                interactive
                    ? (e: KeyboardEvent<HTMLDivElement>) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              onClick?.();
                          }
                      }
                    : undefined
            }
            className={`flex flex-col items-center gap-2 rounded-lg py-6 text-center outline-none transition-colors ${
                droppable
                    ? 'border-2 border-dashed border-primary-400 bg-primary-25/80'
                    : actionable
                      ? 'border border-dashed border-gray-200 group-hover:border-primary-300 group-hover:bg-primary-25/60 focus-visible:border-primary-400 focus-visible:bg-primary-25/60'
                      : ''
            }`}
        >
            <Div
                className={`flex size-9 items-center justify-center rounded-full ${
                    droppable ? 'bg-primary-100' : actionable ? 'bg-primary-50' : 'bg-gray-100'
                }`}
            >
                <Icon
                    name={
                        droppable
                            ? IconComponentsEnum.arrowDown
                            : actionable
                              ? IconComponentsEnum.plus
                              : IconComponentsEnum.calendar
                    }
                    size={ESize.sm}
                    color={droppable || actionable ? 'text-primary-500' : 'text-gray-400'}
                />
            </Div>
            <Label
                variant={EVariantLabel.caption}
                color={droppable || actionable ? 'text-primary-600' : 'text-gray-400'}
            >
                {label}
            </Label>
        </Div>
    );
}

// Placeholder shimmering cards shown while the calendar query loads its first page
export function SkeletonSlot({
    variant,
    count = 2,
}: Readonly<{ variant: 'chip' | 'card'; count?: number }>) {
    return (
        <Div className="space-y-2" aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <Div
                    key={index}
                    className={`animate-pulse rounded-lg border border-gray-100 bg-gray-50 ${
                        variant === 'card' ? 'p-3' : 'px-1.5 py-1.5'
                    }`}
                >
                    {variant === 'card' ? (
                        <>
                            <Div className="h-3 w-14 rounded bg-gray-200" />
                            <Div className="mt-2 h-3 w-3/4 rounded bg-gray-200/70" />
                            <Div className="mt-1.5 h-2.5 w-1/2 rounded bg-gray-200/60" />
                        </>
                    ) : (
                        <Div className="h-2.5 w-full rounded bg-gray-200/80" />
                    )}
                </Div>
            ))}
        </Div>
    );
}
