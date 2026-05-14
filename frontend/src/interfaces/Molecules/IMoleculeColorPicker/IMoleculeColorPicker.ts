type TColorPickerFormat = 'hex' | 'rgb' | 'hsl'

type TColorPickerOption = {
    label: string
    value: TColorPickerFormat
}

interface IMoleculeColorPicker {
    id?: string
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

export type { IMoleculeColorPicker, TColorPickerFormat, TColorPickerOption }
