import { EInputSize } from "@/Enum/Enum"

type TColorPickerFormat = 'hex' | 'rgb' | 'hsl'

type TColorPickerOption = {
    label: string
    value: TColorPickerFormat
}

interface IColorPicker {
    id?: string
    size?: EInputSize
    value?: string
    defaultValue?: string
    format?: TColorPickerFormat
    defaultFormat?: TColorPickerFormat
    defaultColor?: string
    label?: string
    placeholder?: string
    disabled?: boolean
    enableEyeDropper?: boolean
    closeOnSelect?: boolean
    className?: string
    pickerClassName?: string
    onChange?: (color: string, format: TColorPickerFormat) => void
    onFormatChange?: (format: TColorPickerFormat) => void
}

export type { IColorPicker, TColorPickerFormat, TColorPickerOption }
