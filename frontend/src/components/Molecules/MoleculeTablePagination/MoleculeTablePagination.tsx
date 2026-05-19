'use client';

import { twMerge } from 'tailwind-merge'
import { EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum'
import { IMoleculeTablePagination } from '@/interfaces/Molecules/IMoleculeTablePagination/IMoleculeTablePagination'
import MoleculeButton from '../MoleculeButton/MoleculeButton'
import { useTranslations } from 'next-intl'

const MoleculeTablePagination = ({
  page,
  totalPages,
  onChange,
  labelPrev,
  labelNext,
  className,
}: IMoleculeTablePagination) => {
  const t = useTranslations();
  const prevLabel = labelPrev ?? t('table.previous');
  const nextLabel = labelNext ?? t('table.next');

  return (
    <div
      className={twMerge(
        'flex items-center justify-between border-t border-gray-200 bg-white px-5 py-3.5',
        className
      )}
    >
      <MoleculeButton
        id={`button-${prevLabel}`}
        text={prevLabel}
        icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.sm, color: 'text-gray-700' }}
        iconPosition="left"
        type={EButtonType.gray}
        size={EButtonSize.small}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      />

      <MoleculeButton
        id={`button-${nextLabel}`}
        text={nextLabel}
        icon={{ name: IconComponentsEnum.arrowRight, size: ESize.sm, color: 'text-gray-700' }}
        iconPosition="right"
        type={EButtonType.gray}
        size={EButtonSize.small}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      />
    </div>
  )
}

export default MoleculeTablePagination
