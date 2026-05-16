import { twMerge } from 'tailwind-merge'
import { EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum'
import { IMoleculeTablePagination } from '@/interfaces/Molecules/IMoleculeTablePagination/IMoleculeTablePagination'
import MoleculeButton from '../MoleculeButton/MoleculeButton'

const MoleculeTablePagination = ({
  page,
  totalPages,
  onChange,
  labelPrev = 'Précédent',
  labelNext = 'Suivant',
  className,
}: IMoleculeTablePagination) => {
  return (
    <div
      className={twMerge(
        'flex items-center justify-between border-t border-gray-200 bg-white px-5 py-3.5',
        className
      )}
    >
      {/* Prev */}
      <MoleculeButton
        id={`button-${labelPrev}`}
        text={labelPrev}
        icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.sm, color: 'text-gray-700' }}
        iconPosition="left"
        type={EButtonType.gray}
        size={EButtonSize.small}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      />


      {/* Next */}
      <MoleculeButton
        id={`button-${labelNext}`}
        text={labelNext}
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
