import { IAtomIcon } from '@/interfaces';
import { iconComponents } from './IconTypes';
import { twMerge } from 'tailwind-merge';
import { ESize } from '@/Enum/Enum';

const ICON_SIZE_MAP: Record<ESize, string> = {
    [ESize.xs]: 'w-4 h-4',
    [ESize.sm]: 'w-5 h-5',
    [ESize.md]: 'w-6 h-6',
    [ESize.lg]: 'w-8 h-8',
    [ESize.xl]: 'w-12 h-12',
};

const AtomIcon = ({
    name,
    size = 'w-6 h-6',
    color,
    className,
    handleClick,
    style,
}: IAtomIcon) => {
    const IconComponent = iconComponents[name]
    if (!IconComponent) return null

    let sizeClass = 'w-6 h-6';
    if (typeof size === 'string') {
        sizeClass = size in ICON_SIZE_MAP ? ICON_SIZE_MAP[size as ESize] : size;
    }

    return (
        <IconComponent
            className={twMerge('inline-block shrink-0', sizeClass, color, className)}
            onClick={handleClick}
            style={style}
            role="img"
            aria-label={name}
        />
    )
}

export default AtomIcon
