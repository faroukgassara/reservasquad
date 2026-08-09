import { twMerge } from 'tailwind-merge';
import { ESize } from '@/Enum/Enum';
import { ICON_SIZE_MAP } from '@/common/Data/Data';
import { ISpinner } from '@/interfaces/IPrimitives/ISpinner/ISpinner';
import Icon from '../Icon/Icon';

function resolveIconSize(size: ESize | string = 'w-6 h-6'): string {
    if (typeof size === 'string' && size in ICON_SIZE_MAP) {
        return ICON_SIZE_MAP[size as ESize];
    }
    return size;
}

const Spinner = ({ className, color, size }: ISpinner) => {
    const sizeClass = resolveIconSize(size);

    return (
        <span
            className={twMerge(
                'inline-flex shrink-0 items-center justify-center',
                sizeClass,
                className,
            )}
            aria-hidden
        >
            <Icon
                name="loader"
                className="block animate-spin origin-center"
                color={color}
                size={sizeClass}
            />
        </span>
    );
};

export default Spinner;
