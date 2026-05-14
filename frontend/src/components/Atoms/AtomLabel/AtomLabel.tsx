import { EFontFamily, EVariantLabel } from '@/Enum/Enum'
import typography from '@/theme/typography'
import type { ELabelColor } from '@/theme/labelColors'
import WithChildren from '@/types/WithChildren'
import React from 'react'

type LabelProps = WithChildren<{
    className?: string
    htmlFor?: string
    onClick?: (e: React.MouseEvent<HTMLLabelElement>) => void
    variant: EVariantLabel
    fontFamily?: EFontFamily
    color: ELabelColor
    required?: boolean
}>

const AtomLabel: React.FC<LabelProps> = ({
    children,
    className = '',
    htmlFor,
    onClick,
    variant = 'body',
    fontFamily = EFontFamily.Sans,
    color,
    required,
    ...rest
}) => {
    const getTypographyStyle = () => {
        const variantKey = variant as keyof typeof typography.variants
        const fontSizeKey = typography.variants[variantKey]
        const token = typography.fontSize[fontSizeKey as keyof typeof typography.fontSize]
        if (Array.isArray(token)) {
            const [fontSizeValue, options] = token
            return {
                fontSize: fontSizeValue,
                lineHeight: options?.lineHeight,
            }
        }
        return {}
    }

    const style: React.CSSProperties = getTypographyStyle()
    const fontClass = fontFamily === EFontFamily.Display ? 'font-display' : 'font-sans'

    return (
        <label
            role='none'
            className={`${fontClass} ${color ?? ''} ${className}`}
            style={style}
            htmlFor={htmlFor}
            onClick={onClick}
            {...rest}
        >
            {children}
            {required && <span className={`ml-1 ${fontClass} text-accent-500`}>*</span>}
        </label>
    )
}

export default AtomLabel