import { colord } from 'colord'
import type { TColorPickerFormat } from '@/interfaces'

/**
 * Convert a color string into the specified format, using a fallback if the input is invalid.
 */
export const toFormattedColor = (
    input: string,
    targetFormat: TColorPickerFormat,
    fallback: string
): string => {
    const parsed = colord(input)
    const safe = parsed.isValid() ? parsed : colord(fallback)

    if (targetFormat === 'hsl') {
        const { h, s, l, a } = safe.toHsl()
        return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`
    }

    if (targetFormat === 'rgb') {
        const { r, g, b, a } = safe.toRgb()
        return `rgba(${r}, ${g}, ${b}, ${a})`
    }

    return safe.toHex().toUpperCase()
}
