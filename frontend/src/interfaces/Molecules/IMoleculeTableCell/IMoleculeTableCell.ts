import { ReactNode } from 'react'

export interface IMoleculeTableCell {
  mainText?: string
  supportingText?: string
  leftChildren?: ReactNode
  rightChildren?: ReactNode
  cellClassName?: string
}