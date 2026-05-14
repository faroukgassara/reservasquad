"use client"

import { Label } from '@/components/Atoms'
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum'
import { useEyeDropper } from '@/hooks/useEyeDropper'
import { IMoleculeColorPicker, TColorPickerFormat } from '@/interfaces'
import { colord } from 'colord'
import { useEffect, useId, useRef, useState } from 'react'
import { HexAlphaColorPicker, HexColorInput, HslaStringColorPicker, RgbaStringColorPicker } from 'react-colorful'
import { twMerge } from 'tailwind-merge'
import type { TColorPickerOption } from '@/interfaces'
import { toFormattedColor } from '@/lib/colorUtils'
import { Button, Dropdown, Input } from '..'

const FORMAT_OPTIONS: TColorPickerOption[] = [
    { label: 'HEX', value: 'hex' },
    { label: 'RGB', value: 'rgb' },
    { label: 'HSL', value: 'hsl' },
]

const PickerMap = {
    hex: HexAlphaColorPicker,
    rgb: RgbaStringColorPicker,
    hsl: HslaStringColorPicker,
}

const DEFAULT_FALLBACK = '#000000'

const MoleculeColorPicker = ({
    id,
    value,
    defaultValue,
    defaultColor = DEFAULT_FALLBACK,
    format,
    defaultFormat = 'hex',
    label,
    placeholder,
    disabled,
    enableEyeDropper = true,
    closeOnSelect = false,
    className,
    pickerClassName,
    onChange,
    onFormatChange,
}: IMoleculeColorPicker) => {
    const fallbackId = useId()
    const inputId = id ?? `color-picker-${fallbackId}`
    const containerRef = useRef<HTMLDivElement>(null)
    const { openDropper, isSupported } = useEyeDropper()

    const [internalFormat, setInternalFormat] = useState<TColorPickerFormat>(defaultFormat)
    const [internalValue, setInternalValue] = useState<string>(() =>
        toFormattedColor(defaultValue ?? defaultColor, defaultFormat, defaultColor)
    )
    const [isOpen, setIsOpen] = useState(false)

    const activeFormat = format ?? internalFormat
    const activeColor = value ?? internalValue
    const pickerColor = toFormattedColor(activeColor, activeFormat, defaultColor)

    const handleColorChange = (newColor: string) => {
        const parsed = colord(newColor)
        if (!parsed.isValid()) return

        const normalized = toFormattedColor(newColor, activeFormat, defaultColor)

        if (normalized === pickerColor) return

        setInternalValue(normalized)
        onChange?.(normalized, activeFormat)

        if (closeOnSelect) setIsOpen(false)
    }

    const handleFormatChange = (nextFormatValue: string | number | string[]) => {
        const val = Array.isArray(nextFormatValue) ? nextFormatValue[0] : nextFormatValue
        const nextFormat = val as TColorPickerFormat
        const convertedColor = toFormattedColor(activeColor, nextFormat, defaultColor)

        if (format === undefined) setInternalFormat(nextFormat)
        if (value === undefined) setInternalValue(convertedColor)

        onFormatChange?.(nextFormat)
    }

    const handleEyeDropper = async () => {
        if (!enableEyeDropper || !isSupported || activeFormat !== 'hex') return
        const hex = await openDropper()
        if (hex) handleColorChange(hex)
    }

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    const ActivePicker = PickerMap[activeFormat]

    return (
        <div className={twMerge('relative w-full max-w-90', className)} ref={containerRef}>
            {label && (
                <Label
                    className="mb-1.5 text-gray-700"
                    variant={EVariantLabel.bodySmall}
                    htmlFor={inputId}
                    color="text-gray-700"
                >
                    {label}
                </Label>
            )}

            <div className="relative">
                <Input
                    id={inputId}
                    readOnly
                    disabled={disabled}
                    value={pickerColor}
                    placeholder={placeholder}
                    onClick={() => { if (!disabled) setIsOpen(prev => !prev) }}
                    onKeyDown={(event) => {
                        if (disabled) return
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setIsOpen(prev => !prev)
                        }
                    }}
                    className={twMerge('cursor-pointer pr-10 pl-12', disabled && 'cursor-not-allowed')}
                />
                <span
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: pickerColor }}
                />
            </div>

            {isOpen && !disabled && (
                <div className="absolute left-0 right-0 z-dropdown mt-2 rounded-xxl border border-gray-200 bg-white p-4 shadow-xxl shadow-gray-900/10">
                    <div className="mb-3 flex items-center gap-2">
                        <Dropdown
                            className="h-10"
                            containerClassName="w-[88px]"
                            options={FORMAT_OPTIONS}
                            value={activeFormat}
                            onChange={handleFormatChange}
                        />

                        <div className="flex-1" />

                        {enableEyeDropper && (
                            <Button
                                id={`${inputId}-eyedropper`}
                                icon={{
                                    name: IconComponentsEnum.drop,
                                    size: ESize.md,
                                    color: 'text-gray-700',
                                }}
                                iconPosition="only"
                                size={EButtonSize.small}
                                type={EButtonType.gray}
                                onClick={handleEyeDropper}
                                disabled={!isSupported || activeFormat !== 'hex'}
                                className="h-8! w-8!"
                            />
                        )}
                    </div>

                    <ActivePicker
                        className={twMerge('nexera-color-picker-widget', pickerClassName)}
                        color={pickerColor}
                        onChange={handleColorChange}
                    />

                    <div className="mt-4">
                        {activeFormat === 'hex' ? (
                            <HexColorInput
                                color={pickerColor}
                                onChange={handleColorChange}
                                prefixed
                                alpha
                                className="h-11 w-full rounded-xl border border-transparent bg-gray-100 px-3 text-center text-lg font-semibold text-gray-700 outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary-50"
                            />
                        ) : (
                            <Input
                                id={`${inputId}-${activeFormat}-value`}
                                className="h-11 border border-transparent bg-gray-100 text-center text-lg font-semibold text-gray-700"
                                value={pickerColor}
                                readOnly
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default MoleculeColorPicker