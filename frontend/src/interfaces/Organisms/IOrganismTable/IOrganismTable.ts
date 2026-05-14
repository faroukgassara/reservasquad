import { ReactNode } from 'react'
import { IMoleculeTableColumn } from '@/interfaces/Molecules/IMoleculeTableColumn/IMoleculeTableColumn'
import { ITableAction } from '@/interfaces/Molecules/IMoleculeTableAction/IMoleculeTableAction'

export type TTableSortDirection = 'asc' | 'desc'

export interface ITableSortConfig {
  key: string
  direction: TTableSortDirection
}

export interface IOrganismTable<TRow = any> {

  columns: IMoleculeTableColumn<TRow>[]
  rows: TRow[]
  title?: string
  badge?: string | number | null
  headerActions?: ReactNode
  searchable?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  filterTags?: string[]
  onRemoveTag?: (tag: string) => void
  onReset?: () => void
  primaryAction?: ReactNode
  placeholder?: string
  sortConfig?: ITableSortConfig | null
  onSort?: (key: string, direction: TTableSortDirection) => void
  pageSize?: number
  page?: number
  totalRows?: number
  onPageChange?: (page: number) => void
  labelPrev?: string
  labelNext?: string
  onClickRow?: (row: TRow, index: number) => void
  actions?: ITableAction<TRow>[]
  footer?: ReactNode[]
  isLoading?: boolean
  emptyMessage?: string
  className?: string
  tableClassName?: string
  footerClassName?: string

  onFilterRow?: (row: TRow, tags: string[]) => boolean;
  onClickFilter?: () => void;
  onAddTag?: (tag: string) => void;
  clearSearchOnAddTag?: boolean;

}