import colors from './colors'

type GrayShade = keyof typeof colors.gray
type PrimaryShade = keyof typeof colors.primary
type DangerShade = keyof typeof colors.danger
type SuccessShade = keyof typeof colors.success
type WarningShade = keyof typeof colors.warning

/** Strongly-typed Tailwind text color classes for labels, derived from theme colors */
export type ELabelColor =
    | 'text-white'
    | 'text-black'
    | 'text-error'
    | `text-gray-${GrayShade}`
    | `text-primary-${PrimaryShade}`
    | `text-danger-${DangerShade}`
    | `text-success-${SuccessShade}`
    | `text-warning-${WarningShade}`
