import { ReactNode } from 'react'
import { IMoleculeTableColumnFlat } from '../IMoleculeTableColumn/IMoleculeTableColumn'

export interface IMoleculeTableRow<TRow = any> {
  row: TRow
  rowIndex: number
  columns: IMoleculeTableColumnFlat<TRow>[]
  actionSlot?: ReactNode
  onClickRow?: (row: TRow, index: number) => void
  className?: string
}