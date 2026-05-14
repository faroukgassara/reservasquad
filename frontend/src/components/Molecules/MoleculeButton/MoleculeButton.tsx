import { memo, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { Icon, Label, Spinner } from '@/components/Atoms';
import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import { EButtonSize, EButtonType, EFontFamily, EVariantLabel } from '@/Enum/Enum';
import IMoleculeButton from '@/interfaces/Molecules/IMoleculeButton/IMoleculeButton';
import type { ELabelColor } from '@/theme/labelColors';
import { BUTTON_LABEL_COLOR, BUTTON_SIZES, ICON_ONLY_SIZES, ICON_SIZES } from '@/common';

const MoleculeButton = memo(function MoleculeButton({
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
  spinnerColor = '#FFFFFF',
  spinnerSize = '24px',
}: IMoleculeButton) {
  const isIconOnly = iconPosition === 'only' && Boolean(icon);

  const composedClassName = twMerge(
    [
      'flex items-center justify-center transition-colors duration-200',
      ...(isIconOnly
        ? [ICON_ONLY_SIZES[size], 'rounded-full', 'p-0']
        : [
          BUTTON_SIZES[size],
          'relative gap-2 rounded-lg',
          iconPosition === 'right' && 'flex-row-reverse',
        ]),
      className,
    ]
      .filter((c): c is string => Boolean(c))
      .join(' '),
  );

  let content: ReactNode;
  if (isLoading) {
    content = (
      <Spinner
        size={spinnerSize}
        color={spinnerColor as ELabelColor}
      />
    );
  } else if (isIconOnly && icon) {
    content = (
      <Icon
        name={icon.name}
        size={ICON_SIZES[size]}
        color={icon.color}
      />
    );
  } else {
    content = (
      <>
        {icon ? (
          <Icon
            name={icon.name}
            size={ICON_SIZES[size]}
            color={icon.color}
          />
        ) : null}
        {text ? (
          <Label
            fontFamily={EFontFamily.Display}
            variant={EVariantLabel.bodySmall}
            color={BUTTON_LABEL_COLOR[type]}
            className={disabled ? "cursor-not-allowed" : 'cursor-pointer'}
          >
            {text}
          </Label>
        ) : null}
      </>
    );
  }

  return (
    <AtomButton
      onClick={onClick}
      disabled={disabled}
      type={type}
      id={`button-${id}`}
      text={isIconOnly ? undefined : text}
      className={composedClassName}
      ariaBusy={isLoading}
    >
      {content}
    </AtomButton>
  );
});

export default MoleculeButton;
