'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { twMerge } from 'tailwind-merge';
import { EInputSize, EInputStatus, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { INPUT_SIZES, INPUT_STATUS_FIELD, INPUT_STATUS_ICON_COLOR } from '@/common/Data/Data';
import { resolveInputStatus } from './datePicker.utils';
import Label from '../Label/Label';
import Icon from '../Icon/Icon';
import TimePickerWheel from './TimePickerWheel';
import { useFloatingPopover } from './useFloatingPopover';

export interface ITimePickerFieldProps {
    id: string;
    value?: string;
    disabled?: boolean;
    error?: boolean;
    status?: EInputStatus;
    size?: EInputSize;
    className?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
}

function splitTime(value?: string): { hour: string; minute: string } {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) {
        return { hour: '', minute: '' };
    }
    const [hour = '', minute = ''] = value.split(':');
    return { hour, minute };
}

function getTimeFieldWrapperClassName({
    status,
    size,
    disabled,
    hasValue,
    isOpen,
    className,
}: {
    status: EInputStatus;
    size: EInputSize;
    disabled?: boolean;
    hasValue: boolean;
    isOpen: boolean;
    className?: string;
}): string {
    const sizeConfig = INPUT_SIZES[size];

    return twMerge(
        'relative flex w-full min-w-0 items-center rounded-lg border bg-white text-left transition-colors duration-200',
        sizeConfig.field,
        INPUT_STATUS_FIELD[status],
        status === EInputStatus.default && hasValue && !disabled && 'border-gray-300 bg-gray-50',
        disabled && 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 hover:border-gray-200',
        !disabled && 'cursor-pointer',
        isOpen && 'border-2',
        className,
    );
}

const TimePickerField = ({
    id,
    value,
    disabled,
    error,
    status,
    size = EInputSize.medium,
    className,
    placeholder = '--:--',
    onChange,
}: ITimePickerFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { mounted, triggerRef, popoverRef, popoverStyle } = useFloatingPopover(isOpen);
    const resolvedStatus = resolveInputStatus(error, status);
    const sizeConfig = INPUT_SIZES[size];
    const iconColor = INPUT_STATUS_ICON_COLOR[resolvedStatus];
    const { hour, minute } = splitTime(value);
    const hasValue = Boolean(hour && minute);
    const displayValue = hasValue ? `${hour}:${minute}` : '';
    const wheelId = useId();

    const handleClickOutside = useCallback((event: MouseEvent) => {
        const target = event.target as Node;
        if (containerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
            return;
        }
        setIsOpen(false);
    }, [popoverRef]);

    useEffect(() => {
        if (!isOpen) return;

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, handleClickOutside]);

    const handleWheelChange = (nextHour: string, nextMinute: string) => {
        onChange?.(`${nextHour}:${nextMinute}`);
    };

    const wheelPopover =
        isOpen && !disabled && mounted
            ? createPortal(
                  <div
                      ref={popoverRef}
                      id={wheelId}
                      role="dialog"
                      aria-label="Sélection de l'heure"
                      style={popoverStyle}
                  >
                      <TimePickerWheel
                          hour={hour || '00'}
                          minute={minute || '00'}
                          onChange={handleWheelChange}
                          onConfirm={() => {
                              if (!hasValue) {
                                  onChange?.(`${hour || '00'}:${minute || '00'}`);
                              }
                              setIsOpen(false);
                          }}
                      />
                  </div>,
                  document.body,
              )
            : null;

    return (
        <div ref={containerRef} className="relative w-full min-w-0">
            <button
                ref={triggerRef}
                id={id}
                type="button"
                disabled={disabled}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-controls={wheelId}
                onClick={() => !disabled && setIsOpen((open) => !open)}
                className={getTimeFieldWrapperClassName({
                    status: resolvedStatus,
                    size,
                    disabled,
                    hasValue,
                    isOpen,
                    className,
                })}
            >
                <Label
                    variant={EVariantLabel.bodySmall}
                    color={hasValue ? 'text-gray-900' : 'text-gray-400'}
                    className={twMerge(
                        'min-w-0 flex-1 truncate text-left tabular-nums leading-none',
                        size === EInputSize.large ? 'pl-4 pr-11' : 'pl-3 pr-10',
                        sizeConfig.text,
                    )}
                >
                    {displayValue || placeholder}
                </Label>
                <Icon
                    name={IconComponentsEnum.clock}
                    color={iconColor}
                    className={twMerge('pointer-events-none absolute top-1/2 -translate-y-1/2', sizeConfig.iconRight)}
                    size={sizeConfig.iconSize}
                />
            </button>

            {wheelPopover}
        </div>
    );
};

export default TimePickerField;
