import { twMerge } from 'tailwind-merge'
import { Label } from '@/components/Atoms'
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
            <Label color="text-gray-900" className="text-gray-900" variant={EVariantLabel.bodySmall}>
              {mainText}
            </Label>
          )}
          {supportingText && (
            <Label color="text-gray-600" className="text-gray-600" variant={EVariantLabel.bodySmall}>
              {supportingText}
            </Label>
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