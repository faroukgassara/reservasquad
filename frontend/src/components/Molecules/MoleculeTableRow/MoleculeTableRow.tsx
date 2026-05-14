import React from 'react'
import { twMerge } from 'tailwind-merge'
import MoleculeTableCell from '@/components/Molecules/MoleculeTableCell/MoleculeTableCell'
import { IMoleculeTableRow } from '@/interfaces/Molecules/IMoleculeTableRow/IMoleculeTableRow'

/**
 * MoleculeTableRow
 *
 * Each <td> always renders through MoleculeTableCell for consistent
 * padding and layout. The two cases are kept strictly separate:
 *
 *   col.render defined
 *     → call it to get a ReactNode
 *     → if it's already a <MoleculeTableCell>, pass it through untouched
 *     → otherwise wrap it in MoleculeTableCell as rightChildren
 *
 *   col.render undefined
 *     → build MoleculeTableCell props directly (mainText fallback)
 *     → no spreading of unknown types, no null/undefined risk
 */
const MoleculeTableRow = <TRow,>({
  row,
  rowIndex,
  columns,
  actionSlot,
  onClickRow,
 
  className,
}: IMoleculeTableRow<TRow>) => (
  <tr
    onClick={() => onClickRow?.(row, rowIndex)}
    className={twMerge(
      'border-b border-gray-100 transition-colors hover:bg-gray-50',
      onClickRow ? 'cursor-pointer' : '',
      className
    )}
  >
    {columns.map((col) => {
      const rawValue = (row as any)[col.key]

      return (
        <td
          key={col.key}
          style={col.width ? { width: col.width } : undefined}
          className={twMerge('align-middle', col.cellClassName)}
        >
          {col.render ? (
            (() => {
              const rendered = col.render(rawValue, row)
              return isMoleculeTableCell(rendered)
                ? rendered
                : <MoleculeTableCell rightChildren={rendered} />
            })()
          ) : (
            <MoleculeTableCell
              mainText={rawValue != null ? String(rawValue) : undefined}
            />
          )}
        </td>
      )
    })}

    {actionSlot !== undefined && (
      <td className="align-middle pr-4 text-right">{actionSlot}</td>
    )}
  </tr>
)

function isMoleculeTableCell(node: React.ReactNode): boolean {
  return (
    React.isValidElement(node) &&
    (node.type as any)?.displayName === 'MoleculeTableCell'
  )
}

export default MoleculeTableRow