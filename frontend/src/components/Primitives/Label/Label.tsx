import { EVariantLabel } from '@/Enum/Enum'
import typography from '@/theme/typography'
import type { ELabelColor } from '@/theme/labelColors'
import WithChildren from '@/types/WithChildren'
import React from 'react'

type LabelProps = WithChildren<{
    className?: string
    htmlFor?: string
    onClick?: (e: React.MouseEvent<HTMLElement>) => void
    variant: EVariantLabel
    color: ELabelColor
    required?: boolean
}>

// Headings variant → real semantic element for accessibility (document outline).
const HEADING_TAG: Record<EVariantLabel.h1 | EVariantLabel.h2 | EVariantLabel.h3 | EVariantLabel.h4 | EVariantLabel.h5 | EVariantLabel.h6, keyof React.JSX.IntrinsicElements> = {
    [EVariantLabel.h1]: 'h1',
    [EVariantLabel.h2]: 'h2',
    [EVariantLabel.h3]: 'h3',
    [EVariantLabel.h4]: 'h4',
    [EVariantLabel.h5]: 'h5',
    [EVariantLabel.h6]: 'h6',
}

function isHeadingVariant(variant: EVariantLabel): variant is keyof typeof HEADING_TAG {
    return variant in HEADING_TAG
}

const Label: React.FC<LabelProps> = ({
    children,
    className = '',
    htmlFor,
    onClick,
    variant = EVariantLabel.body,
    color,
    required,
    ...rest
}) => {
    const fontSizeKey = typography.variants[variant as keyof typeof typography.variants]
    const token = typography.fontSize[fontSizeKey as keyof typeof typography.fontSize]

    // Charte Biblio Squad: display sizes (headings) use Poppins, body text uses Inter
    const isHeading = typeof fontSizeKey === 'string' && fontSizeKey.startsWith('display-')
    const fontFamily = isHeading ? typography.fontFamily.heading : typography.fontFamily.sans

    const style: React.CSSProperties = Array.isArray(token)
        ? {
            fontFamily,
            fontSize: token[0],
            lineHeight: token[1]?.lineHeight,
            fontWeight: token[1]?.fontWeight,
        }
        : { fontFamily }

    const sharedClassName = [color, 'inline-block', className].filter(Boolean).join(' ')

    if (htmlFor) {
        return (
            <label
                className={sharedClassName}
                style={style}
                htmlFor={htmlFor}
                onClick={onClick}
                {...rest}
            >
                {children}
                {required && <span className="ml-1 text-primary-500">*</span>}
            </label>
        )
    }

    // Semantics: render real <h1>..<h6> for screen readers and document outline.
    if (isHeadingVariant(variant)) {
        const Tag = HEADING_TAG[variant] as React.ElementType
        return (
            <Tag className={sharedClassName} style={style} onClick={onClick} {...rest}>
                {children}
                {required && <span className="ml-1 text-primary-500">*</span>}
            </Tag>
        )
    }

    return (
        <span className={sharedClassName} style={style} onClick={onClick} {...rest}>
            {children}
            {required && <span className="ml-1 text-primary-500">*</span>}
        </span>
    )
}

export default Label
