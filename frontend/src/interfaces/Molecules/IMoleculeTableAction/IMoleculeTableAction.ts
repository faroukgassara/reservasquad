import { ReactNode } from 'react'
import { IconComponentsEnum } from '@/Enum/Enum'

export interface ITableAction<TRow = any> {
  label: string
  iconName?: IconComponentsEnum
  onClick: (row: TRow, rowIndex: number) => void
  isVisible?: (row: TRow) => boolean
}

export interface IMoleculeTableActionMenu<TRow = any> {
  actions: ITableAction<TRow>[]
  row: TRow
  rowIndex: number
  trigger?: ReactNode
}