import { memo, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import Icon from '@/components/Primitives/Icon/Icon';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { EButtonSize, EButtonType, ESize } from '@/Enum/Enum';
import type { ELabelColor } from '@/theme/labelColors';
import IButton from '@/interfaces/IPrimitives/IButton/IButton';
import { BUTTON_SIZES, ICON_ONLY_SIZES, TYPE_VARIANT_CLASSES } from '@/common/Data/Data';

const Button = memo(function Button({
  text,
  icon,
  iconPosition = 'left',
  size = EButtonSize.medium,
  type = EButtonType.primary,
  disabled = false,
  isLoading = false,
  onClick,
  className = '',
  id,
  spinnerColor = 'text-white',
  spinnerSize = ESize.md,
  'aria-label': ariaLabel,
  'aria-expanded': ariaExpanded,
}: IButton) {
  const isIconOnly = iconPosition === 'only' && Boolean(icon);

  const buttonClassName = twMerge(
    [
      'relative flex items-center justify-center transition-colors duration-200',
      ...(isIconOnly
        ? [ICON_ONLY_SIZES[size], 'rounded-full']
        : [BUTTON_SIZES[size], 'rounded-xl px-4 py-2']),
      TYPE_VARIANT_CLASSES[type],
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      className,
    ]
      .filter((c): c is string => Boolean(c))
      .join(' '),
  );

  let content: ReactNode;
  if (isLoading) {
    content = (
      <Spinner
        size={icon?.size || spinnerSize || ESize.md}
        color={spinnerColor as ELabelColor}
      />
    );
  } else if (isIconOnly && icon) {
    content = (
      <Icon
        name={icon.name}
        size={icon.size}
        color={icon.color}
      />
    );
  } else {
    content = (
      <span
        className={twMerge(
          'relative flex w-full items-center justify-center gap-1',
          iconPosition === 'right' && 'flex-row-reverse',
        )}
      >
        {icon && (
          <Icon
            name={icon.name}
            size={icon.size}
            color={icon.color}
          />
        )}
        {text}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={buttonClassName}
      disabled={disabled}
      onClick={onClick}
      id={id}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
    >
      {content}
    </button>
  );
});

export default Button;
