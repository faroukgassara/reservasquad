import { iconComponents } from './IconTypes';
import { twMerge } from 'tailwind-merge';
import { ESize } from '@/Enum/Enum';
import { IIcon } from '@/interfaces/IPrimitives/IIcon/IIcon';
import { ICON_SIZE_MAP } from '@/common/Data/Data';

const Icon = ({
    name,
    size = 'w-6 h-6',
    color,
    className,
    handleClick,
    style,
}: IIcon) => {
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

export default Icon
