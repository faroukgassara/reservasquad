import { ReactNode } from 'react'

export type TSortDirection = 'asc' | 'desc' | null

export interface IMoleculeHeaderElement<TRow = any> {
    value: string
    label: string
    render?: (value: any, row: TRow) => ReactNode
    sortable?: boolean
    width?: string
    cellClassName?: string
    headerClassName?: string
}

export interface IMoleculeTableColumn<TRow = any> {
    headerElement: IMoleculeHeaderElement<TRow>
}

export interface IMoleculeTableColumnHeader<TRow = any> {
    keyCol: string
    label: string
    render?: (value: any, row: TRow) => ReactNode
    sortable?: boolean
    width?: string
    cellClassName?: string
    headerClassName?: string
    currentSortDirection: TSortDirection
    onSort: (key: string) => void
}
export interface IMoleculeTableColumnFlat<TRow = any> {
    key: string
    label: string
    render?: (value: any, row: TRow) => ReactNode
    sortable?: boolean
    width?: string
    cellClassName?: string
    headerClassName?: string
}