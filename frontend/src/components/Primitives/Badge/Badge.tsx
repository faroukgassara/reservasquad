import { memo, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { EBadgeSize, EBadgeType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { IBadge } from '@/interfaces/IPrimitives/IBadge/IBadge';
import Icon from '@/components/Primitives/Icon/Icon';
import { BADGE_SIZES, DISMISSIBLE_ICON_COLOR, ICON_ONLY_SIZES_BADGE, TYPE_VARIANT_CLASSES_BADGE } from '@/common/Data/Data';

const Badge = memo(function Badge({
    text,
    icon,
    size = EBadgeSize.tiny,
    type = EBadgeType.primary,
    onClick,
    className = '',
    id,
    isDismissible = false,
    onDismiss,
}: IBadge) {
    const isIconOnly = !text && Boolean(icon);

    const buttonClassName = twMerge(
        [
            'relative flex items-center justify-center transition-colors duration-200',
            ...(isIconOnly
                ? [ICON_ONLY_SIZES_BADGE[size], 'rounded-full']
                : [BADGE_SIZES[size], 'rounded-4xl']),
            TYPE_VARIANT_CLASSES_BADGE[type],
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            className,
        ]
            .filter((c): c is string => Boolean(c))
            .join(' '),
    );

    let content: ReactNode;
    if (isIconOnly && icon) {
        content = (
            <Icon
                name={icon.name}
                size={icon.size}
                color={icon.color}
            />
        );
    } else {
        content = (
            <span className={'relative flex w-full items-center justify-center gap-1 left'}>
                {icon && (
                    <Icon
                        name={icon.name}
                        size={icon.size}
                        color={icon.color}
                    />
                )}
                {text}
                {isDismissible && (
                    <Icon
                        name={IconComponentsEnum.close}
                        size={ESize.xs}
                        color={DISMISSIBLE_ICON_COLOR[type]}
                        className='cursor-pointer'
                        handleClick={onDismiss}
                    />
                )}
            </span>
        );
    }

    return (
        <button
            type="button"
            className={buttonClassName}
            onClick={onClick}
            id={id}
        >
            {content}
        </button>
    );
});

export default Badge;
