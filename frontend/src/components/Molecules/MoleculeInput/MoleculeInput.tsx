import { AtomInput, Icon, Label } from '@/components/Atoms/'
import AtomButton from '@/components/Atoms/AtomButton/AtomButton'
import { EInputType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum'
import { IMoleculeInput } from '@/interfaces'
import { forwardRef, useState, useRef } from 'react'

const MoleculeInput = forwardRef<HTMLInputElement, IMoleculeInput>(
    (
        {
            error,
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
            accept,
            onKeyDown,
            onRightIconClick
        },
        ref
    ) => {
        const [inputType, setInputType] = useState(type)
        const fileInputRef = useRef<HTMLInputElement>(null)
        const hintClassName = ["text-gray-600"]
        const defaultIconClassName = ['absolute right-4 cursor-pointer select-none']
        const defaultLeftIconClassName = ['absolute left-4 select-none']
        if (error) hintClassName.push('!text-danger-600')

        const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => onClick?.(e);
        const handleOnChangeInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e);
        };
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e)
        }

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

        const renderHintText = () => {
            return <div className='flex flex-row items-center mt-1 gap-1'>
                <div>
                    <Icon
                        color={error ? 'text-danger-600' : 'text-gray-600'}
                        className={''}
                        name={IconComponentsEnum.info}
                        size="text-large"
                    />
                </div>

                <div>
                    <Label
                        className={hintClassName.join(' ')}
                        variant={EVariantLabel.hint}
                        color="text-gray-600"
                    >
                        {hintText}
                    </Label>
                </div>

            </div>
        }

        if (type === 'file') {
            return (
                <div className={`w-full flex flex-col ${containerClassName}`}>
                    {label && (
                        <Label
                            className={'mb-1'}
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-900"
                        >
                            {label}
                            {required && (
                                <Label color="text-primary-500" className="align-middle" variant={EVariantLabel.bodySmall}>*</Label>
                            )}
                        </Label>
                    )}
                    <div className="relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            id={id}
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={disabled}
                            accept={accept}
                        />
                        <AtomButton
                            id={id}
                            onClick={onRightIconClick ? undefined : (e: React.MouseEvent<HTMLButtonElement>) => onClick?.(e as any)}
                            disabled={disabled}
                            className={`flex items-center justify-between w-full h-12 bg-  gray: {
-25 border border-gray-500 rounded-md px-4 py-4 text-left cursor-pointer
    hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''}
    ${className || ''}`
                            }
                        >
                            <div className="w-full flex items-center justify-between">
                                <span className={value ? 'text-gray-700' : 'text-gray-500 opacity-70'}>
                                    {value || placeholder || 'Choose a file...'}
                                </span>
                                {rightIcon && (
                                    <Icon
                                        color={error ? 'text-danger-600' : 'text-primary-600'}
                                        name={rightIcon}
                                        size="text-large"
                                        handleClick={onRightIconClick}
                                    />
                                )}
                            </div>
                        </AtomButton>
                    </div>
                    {hintText && renderHintText()}
                </div>
            )
        }

        return (
            <div className={`w-full flex flex-col ${containerClassName}`}>
                {label && (
                    <Label
                        className={'mb-1'}
                        variant={EVariantLabel.bodySmall}
                        color="text-gray-900"
                    >
                        {label}
                        {required && (
                            <Label color="text-primary-500" className="align-middle" variant={EVariantLabel.bodySmall}>*</Label>
                        )}
                    </Label>
                )}
                <div className="relative flex items-center">
                    <AtomInput
                        className={`${className} ${leftIcon ? 'pl-11' : ''}`}
                        ref={ref}
                        disabled={disabled}
                        readOnly={readOnly}
                        error={error}
                        type={inputType}
                        id={id}
                        onClick={handleInputClick}
                        onChange={handleOnChangeInput}
                        isTextArea={isTextArea}
                        rows={rows}
                        onKeyDown={(e: any) => {
                            handleKeyDown(e);
                            onKeyDown?.(e);
                        }}

                        placeholder={placeholder}
                        value={value}
                    />
                    {isPassword && !rightIcon && (
                        <Icon
                            color={error ? 'text-danger-600' : 'text-gray-600'}
                            className={defaultIconClassName.join(' ')}
                            handleClick={() =>
                                setInputType(inputType === 'password' ? 'text' : 'password')
                            }
                            name={inputType === 'password' ? 'eye' : 'eyeClose'}
                            size="text-large"
                        />
                    )}
                    {leftIcon && (
                        <Icon
                            color={error ? 'text-danger-600' : 'text-gray-600'}
                            className={defaultLeftIconClassName.join(' ')}
                            name={leftIcon}
                            size="text-large"
                        />
                    )}
                    {rightIcon && (
                        <Icon
                            color={error ? 'text-danger-600' : 'text-gray-600'}
                            className={defaultIconClassName.join(' ')}
                            name={rightIcon}
                            size="text-large"
                            handleClick={() => onRightIconClick?.()}
                        />
                    )}
                </div>
                {hintText && renderHintText()}
            </div >
        )
    }
)

MoleculeInput.displayName = 'MoleculeInput'

export default MoleculeInput
