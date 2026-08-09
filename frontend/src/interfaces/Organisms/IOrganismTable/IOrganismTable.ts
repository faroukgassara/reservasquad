import { ReactNode } from 'react';
import { IconComponentsEnum } from '@/Enum/Enum';

export type TSortDirection = 'asc' | 'desc' | null;
export type TTableSortDirection = 'asc' | 'desc';

export interface ITableSortConfig {
    key: string;
    direction: TTableSortDirection;
}

export interface ITableCell {
    mainText?: string;
    supportingText?: string;
    leftChildren?: ReactNode;
    rightChildren?: ReactNode;
    cellClassName?: string;
}

export interface ITableAction<TRow = unknown> {
    label: string;
    iconName?: IconComponentsEnum;
    onClick: (row: TRow, rowIndex: number) => void;
    isVisible?: (row: TRow) => boolean;
}

export interface ITableActionMenu<TRow = unknown> {
    actions: ITableAction<TRow>[];
    row: TRow;
    rowIndex: number;
    trigger?: ReactNode;
}

export interface IHeaderElement<TRow = unknown> {
    value: string;
    label: string;
    render?: (value: any, row: TRow) => ReactNode;
    sortable?: boolean;
    width?: string;
    cellClassName?: string;
    headerClassName?: string;
}

export interface ITableColumn<TRow = unknown> {
    headerElement: IHeaderElement<TRow>;
}

export interface ITableColumnFlat<TRow = unknown> {
    key: string;
    label: string;
    render?: (value: any, row: TRow) => ReactNode;
    sortable?: boolean;
    width?: string;
    cellClassName?: string;
    headerClassName?: string;
}

export interface ITableColumnHeader<TRow = unknown> {
    keyCol: string;
    label: string;
    render?: (value: any, row: TRow) => ReactNode;
    sortable?: boolean;
    width?: string;
    cellClassName?: string;
    headerClassName?: string;
    currentSortDirection: TSortDirection;
    onSort: (key: string) => void;
}

export interface ITableRow<TRow = unknown> {
    row: TRow;
    rowIndex: number;
    columns: ITableColumnFlat<TRow>[];
    actionSlot?: ReactNode;
    onClickRow?: (row: TRow, index: number) => void;
    className?: string;
}

export interface ITableSearchBar {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onClickFilter?: () => void;
    primaryAction?: ReactNode;
    filterTags?: string[];
    onRemoveTag?: (tag: string) => void;
    onReset?: () => void;
    placeholder?: string;
    className?: string;
    onAddTag?: (tag: string) => void;
    clearSearchOnAddTag?: boolean;
}

export interface ITablePagination {
    page: number;
    totalPages: number;
    totalRows?: number;
    pageSize?: number;
    onChange: (page: number) => void;
    labelPrev?: string;
    labelNext?: string;
    className?: string;
}

export interface ITable<TRow = unknown> {
    columns: ITableColumn<TRow>[];
    rows: TRow[];
    searchable?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filterTags?: string[];
    onRemoveTag?: (tag: string) => void;
    onReset?: () => void;
    primaryAction?: ReactNode;
    placeholder?: string;
    sortConfig?: ITableSortConfig | null;
    onSort?: (key: string, direction: TTableSortDirection) => void;
    pageSize?: number;
    page?: number;
    totalRows?: number;
    onPageChange?: (page: number) => void;
    labelPrev?: string;
    labelNext?: string;
    onClickRow?: (row: TRow, index: number) => void;
    onClickFilter?: () => void;
    actions?: ITableAction<TRow>[];
    footer?: ReactNode[];
    isLoading?: boolean;
    emptyMessage?: string;
    className?: string;
    tableClassName?: string;
    footerClassName?: string;
    onFilterRow?: (row: TRow, tags: string[]) => boolean;
    onAddTag?: (tag: string) => void;
    clearSearchOnAddTag?: boolean;
}

export type IOrganismTable<TRow = unknown> = ITable<TRow>;
