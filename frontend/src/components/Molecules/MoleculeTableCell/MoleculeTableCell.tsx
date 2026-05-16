import { twMerge } from 'tailwind-merge'
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel'
import { IMoleculeTableCell } from '@/interfaces/Molecules/IMoleculeTableCell/IMoleculeTableCell'
import { EVariantLabel } from '@/Enum/Enum'

const MoleculeTableCell = ({
  mainText,
  supportingText,
  leftChildren,
  rightChildren,
  cellClassName,
}: IMoleculeTableCell) => {
  const containerClassName = 'flex py-4 px-6 items-center gap-3 flex-shrink-0'
  const leftChildrenClassName = 'flex items-center'
  const rightChildrenClassName = 'flex items-center gap-2 whitespace-nowrap'

  return (
    <div className={twMerge(containerClassName, cellClassName)}>
      {leftChildren && (
        <div className={leftChildrenClassName}>{leftChildren}</div>
      )}

      {(mainText || supportingText) && (
        <div className="flex flex-col">
          {mainText && (
            <AtomLabel color="text-gray-900" className="text-gray-900" variant={EVariantLabel.bodySmall}>
              {mainText}
            </AtomLabel>
          )}
          {supportingText && (
            <AtomLabel color="text-gray-600" className="text-gray-600" variant={EVariantLabel.bodySmall}>
              {supportingText}
            </AtomLabel>
          )}
        </div>
      )}

      {rightChildren && (
        <div className={rightChildrenClassName}>{rightChildren}</div>
      )}
    </div>
  )
}

MoleculeTableCell.displayName = 'MoleculeTableCell'

export default MoleculeTableCell