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
  const pageItems =
    totalPages <= 7 ?
        Array.from({ length: totalPages }, (_, i) => i + 1)
    :   [page];

  return (
    <div
      className={twMerge(
        'flex items-center justify-between border-t border-gray-200 bg-white px-5 py-4',
        className
      )}
    >
      <MoleculeButton
        id={`button-${prevLabel}`}
        text={prevLabel}
        icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.sm, color: 'text-gray-600' }}
        iconPosition="left"
        type={EButtonType.gray}
        size={EButtonSize.small}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="!bg-transparent !shadow-none hover:!bg-gray-50"
      />

      <div className="flex items-center gap-1.5">
        {pageItems.map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onChange(pageNum)}
            className={twMerge(
              'flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
              pageNum === page ?
                'bg-primary-600 text-white shadow-sm'
              :   'text-gray-600 hover:bg-gray-100',
            )}
            aria-current={pageNum === page ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}
      </div>

      <MoleculeButton
        id={`button-${nextLabel}`}
        text={nextLabel}
        icon={{ name: IconComponentsEnum.arrowRight, size: ESize.sm, color: 'text-gray-600' }}
        iconPosition="right"
        type={EButtonType.gray}
        size={EButtonSize.small}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="!bg-transparent !shadow-none hover:!bg-gray-50"
      />
    </div>
  )
}

export default MoleculeTablePagination
