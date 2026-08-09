import useDisableNumberInputScroll from '@/hooks/useDisableNumberInputScroll';
import { EInputSize, EInputStatus, EInputType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { forwardRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { IInput } from '@/interfaces/IPrimitives/IInput/IInput';
import Label from '../Label/Label';
import Icon from '../Icon/Icon';
import { INPUT_SIZES, INPUT_STATUS_FIELD, INPUT_STATUS_HINT_COLOR, INPUT_STATUS_ICON_COLOR } from '@/common/Data/Data';

function resolveInputStatus(error?: boolean, status?: EInputStatus): EInputStatus {
    if (error) return EInputStatus.error;
    return status ?? EInputStatus.default;
}

function hasInputValue(value: IInput['value']): boolean {
    return value !== undefined && value !== null && String(value).length > 0;
}

function getHorizontalPadding(
    size: EInputSize,
    hasLeftIcon: boolean,
    hasRightIcon: boolean,
): string {
    if (hasLeftIcon && hasRightIcon) {
        return size === EInputSize.large ? 'px-11' : 'px-10';
    }
    if (hasLeftIcon) {
        return size === EInputSize.large ? 'pl-11 pr-4' : 'pl-10 pr-3';
    }
    if (hasRightIcon) {
        return size === EInputSize.large ? 'pl-4 pr-11' : 'pl-3 pr-10';
    }
    return size === EInputSize.large ? 'px-4' : 'px-3';
}

function getFieldWrapperClassName({
    status,
    size,
    disabled,
    hasValue,
    className,
}: {
    status: EInputStatus;
    size: EInputSize;
    disabled?: boolean;
    hasValue: boolean;
    className?: string;
}): string {
    const sizeConfig = INPUT_SIZES[size];

    return twMerge(
        'relative flex w-full items-center rounded-lg border transition-colors duration-200',
        sizeConfig.field,
        INPUT_STATUS_FIELD[status],
        hasValue && !disabled && 'border-gray-300 bg-gray-50',
        disabled && 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 hover:border-gray-200',
        className,
    );
}

function getFieldClassName(
    size: EInputSize,
    hasLeftIcon: boolean,
    hasRightIcon: boolean,
    isTextArea = false,
): string {
    const sizeConfig = INPUT_SIZES[size];

    return twMerge(
        'min-w-0 flex-1 border-0 bg-transparent outline-none shadow-none ring-0',
        sizeConfig.text,
        'text-gray-900 placeholder:text-gray-400 ds-input-field',
        'disabled:cursor-not-allowed disabled:text-gray-400',
        getHorizontalPadding(size, hasLeftIcon, hasRightIcon),
        isTextArea ? 'w-full resize-none py-2.5' : 'py-0 leading-normal',
    );
}

const Input = forwardRef<HTMLInputElement, IInput>(
    (
        {
            error,
            status,
            size = EInputSize.medium,
            leftIcon,
            rightIcon,
            className = '',
            disabled,
            readOnly,
            isPassword,
            type,
            label,
            hintText,
            required,
            id,
            containerClassName = '',
            onChange,
            onClick,
            isTextArea = false,
            rows,
            placeholder,
            value,
            onKeyDown,
            onRightIconClick,
        },
        ref,
    ) => {
        useDisableNumberInputScroll();

        const [inputType, setInputType] = useState(type);

        const resolvedStatus = resolveInputStatus(error, status);
        const sizeConfig = INPUT_SIZES[size];
        const filled = hasInputValue(value);
        const showPasswordToggle = isPassword && !rightIcon;
        const hasRightSlot = Boolean(rightIcon || showPasswordToggle);
        const iconColor = INPUT_STATUS_ICON_COLOR[resolvedStatus];
        const hintColor = INPUT_STATUS_HINT_COLOR[resolvedStatus];

        const wrapperClassName = getFieldWrapperClassName({
            status: resolvedStatus,
            size,
            disabled,
            hasValue: filled,
            className,
        });

        const fieldClassName = getFieldClassName(size, Boolean(leftIcon), hasRightSlot, isTextArea);

        const handleOnChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            const allowedKeys = new Set(['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
            const keyNumber = Number(e.key);

            if (inputType === EInputType.number) {
                const isNumber = !Number.isNaN(keyNumber);
                const isDecimalSeparator = e.key === '.' || e.key === ',';
                const hasDecimalAlready = e.currentTarget.value.includes('.') || e.currentTarget.value.includes(',');

                if (!isNumber && !isDecimalSeparator && !allowedKeys.has(e.key)) {
                    e.preventDefault();
                }

                if (isDecimalSeparator && hasDecimalAlready) {
                    e.preventDefault();
                }
            }

            if (inputType === EInputType.intNumber) {
                const isNumber = !Number.isNaN(keyNumber);
                if (!isNumber && !allowedKeys.has(e.key)) {
                    e.preventDefault();
                }
            }
        };

        const renderLabel = () => {
            if (!label) return null;

            return (
                <Label className="mb-1.5" variant={EVariantLabel.bodySmall} color="text-gray-900">
                    {label}
                    {required && (
                        <Label color="text-primary-500" className="align-middle" variant={EVariantLabel.bodySmall}>
                            *
                        </Label>
                    )}
                </Label>
            );
        };

        const renderHintText = () => {
            if (!hintText) return null;

            return (
                <div className="mt-1.5 flex items-center gap-1.5">
                    <Icon
                        color={hintColor}
                        name={IconComponentsEnum.info}
                        size={ESize.xs}
                    />
                    <Label variant={EVariantLabel.hint} color={hintColor}>
                        {hintText}
                    </Label>
                </div>
            );
        };

        const renderLeftIcon = () => {
            if (!leftIcon) return null;

            return (
                <Icon
                    color={iconColor}
                    className={twMerge('pointer-events-none absolute top-1/2 -translate-y-1/2', sizeConfig.iconLeft)}
                    name={leftIcon}
                    size={sizeConfig.iconSize}
                />
            );
        };

        const renderRightIcon = () => {
            if (showPasswordToggle) {
                return (
                    <Icon
                        color={iconColor}
                        className={twMerge('absolute top-1/2 -translate-y-1/2 cursor-pointer select-none', sizeConfig.iconRight)}
                        handleClick={() => setInputType(inputType === EInputType.password ? EInputType.text : EInputType.password)}
                        name={inputType === EInputType.password ? IconComponentsEnum.eye : IconComponentsEnum.eyeClose}
                        size={sizeConfig.iconSize}
                    />
                );
            }

            if (!rightIcon) return null;

            return (
                <Icon
                    color={iconColor}
                    className={twMerge(
                        'absolute top-1/2 -translate-y-1/2 select-none',
                        sizeConfig.iconRight,
                        onRightIconClick ? 'cursor-pointer' : 'pointer-events-none',
                    )}
                    name={rightIcon}
                    size={sizeConfig.iconSize}
                    handleClick={onRightIconClick}
                />
            );
        };

        return (
            <div className={twMerge('flex w-full flex-col', containerClassName)}>
                {renderLabel()}
                <div
                    className={twMerge(
                        wrapperClassName,
                        isTextArea && (size === EInputSize.large ? 'h-auto min-h-28' : 'h-auto min-h-24'),
                    )}
                >
                    {renderLeftIcon()}
                    {isTextArea ? (
                        <textarea
                            ref={ref as React.Ref<HTMLTextAreaElement>}
                            className={fieldClassName}
                            disabled={disabled}
                            id={`${id}-textarea`}
                            readOnly={readOnly}
                            rows={rows}
                            value={value}
                            placeholder={placeholder}
                            onChange={(e) => {
                                onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>);
                            }}
                        />
                    ) : (
                        <input
                            ref={ref}
                            type={inputType}
                            className={fieldClassName}
                            disabled={disabled}
                            id={id}
                            readOnly={readOnly}
                            value={value}
                            placeholder={placeholder}
                            onClick={onClick}
                            onChange={handleOnChangeInput}
                            onKeyDown={(e) => {
                                handleKeyDown(e);
                                onKeyDown?.(e);
                            }}
                        />
                    )}
                    {renderRightIcon()}
                </div>
                {renderHintText()}
            </div>
        );
    },
);

Input.displayName = 'Input';

export default Input;
