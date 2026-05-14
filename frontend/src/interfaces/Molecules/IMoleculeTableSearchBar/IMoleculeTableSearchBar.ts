import { ReactNode } from 'react'

export interface IMoleculeTableSearchBar {
  searchValue: string
  onSearchChange: (value: string) => void
  onClickFilter?: () => void
  primaryAction?: ReactNode
  filterTags?: string[]
  onRemoveTag?: (tag: string) => void
  onReset?: () => void
  placeholder?: string
  className?: string
  onAddTag?: (tag: string) => void;
clearSearchOnAddTag?: boolean;

}