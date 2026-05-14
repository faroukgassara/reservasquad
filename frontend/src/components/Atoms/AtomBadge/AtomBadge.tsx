import { EBadgeColor, EBadgeSize } from "@/Enum/Enum"
import { IAtomBadge } from "@/interfaces"

const AtomBadge = ({
    className = '',
    size = EBadgeSize.small,
    color = EBadgeColor.gray,
    text,
    leftSlot,
    rightSlot
}: IAtomBadge & {
    leftSlot?: React.ReactNode
    rightSlot?: React.ReactNode
}) => {
    const defaultColors: Record<any, string> = {
        [EBadgeColor.gray]: 'bg-gray-100 text-gray-700',
        [EBadgeColor.primary]: 'bg-primary-100 text-primary-700',
        [EBadgeColor.danger]: 'bg-danger-100 text-danger-700',
        [EBadgeColor.success]: 'bg-success-100 text-success-700',
        [EBadgeColor.warning]: 'bg-warning-100 text-warning-700',
    }

    const badgeClasses = [
        'inline-flex items-center gap-1 rounded-full font-medium',
        defaultColors[color] || color,
        size === EBadgeSize.small ? 'px-1.5 py-1 text-xs' : '',
        size === EBadgeSize.medium ? 'px-2.5 py-2 text-sm' : '',
        size === EBadgeSize.large ? 'px-4 py-2 text-base' : '',
        className
    ].filter(Boolean).join(' ')

    return (
        <span className={badgeClasses}>
            {leftSlot}
            {text}
            {rightSlot}
        </span>
    )
}

export default AtomBadge