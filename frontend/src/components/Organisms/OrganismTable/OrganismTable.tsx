'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import {
    EButtonSize,
    EButtonType,
    EBadgeSize,
    EBadgeType,
    ESize,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import {
    ITable,
    ITableAction,
    ITableCell,
    ITableColumnFlat,
    ITableSortConfig,
    TSortDirection,
    TTableSortDirection,
} from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';
import Label from '@/components/Primitives/Label/Label';
import Icon from '@/components/Primitives/Icon/Icon';
import Div from '@/components/Primitives/Div/Div';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Input from '@/components/Primitives/Input/Input';

// ─── Cell ─────────────────────────────────────────────────────────────────────

const TableCell = ({
    mainText,
    supportingText,
    leftChildren,
    rightChildren,
    cellClassName,
}: ITableCell) => (
    <div className={twMerge('flex min-w-0 items-center gap-2.5 px-4 py-3', cellClassName)}>
        {leftChildren && <div className="flex shrink-0 items-center">{leftChildren}</div>}

        {(mainText || supportingText) && (
            <div className="flex min-w-0 flex-col gap-0.5">
                {mainText && (
                    <Label color="text-gray-900" className="truncate" variant={EVariantLabel.bodySmall}>
                        {mainText}
                    </Label>
                )}
                {supportingText && (
                    <Label color="text-gray-500" className="truncate" variant={EVariantLabel.hint}>
                        {supportingText}
                    </Label>
                )}
            </div>
        )}

        {rightChildren && (
            <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">{rightChildren}</div>
        )}
    </div>
);

TableCell.displayName = 'TableCell';

function isTableCell(node: React.ReactNode): boolean {
    return React.isValidElement(node) && (node.type as { displayName?: string })?.displayName === 'TableCell';
}

function renderCellContent<TRow>(
    col: ITableColumnFlat<TRow>,
    rawValue: unknown,
    row: TRow,
): React.ReactNode {
    if (!col.render) {
        return <TableCell mainText={rawValue != null ? String(rawValue) : undefined} />;
    }

    const rendered = col.render(rawValue, row);
    return isTableCell(rendered) ? rendered : <TableCell rightChildren={rendered} />;
}

function getRowKey<TRow>(row: TRow, index: number): string {
    const id = (row as { id?: string | number }).id;
    return id != null ? String(id) : `row-${index}`;
}

// ─── Column header ────────────────────────────────────────────────────────────

interface ITableColumnHeaderProps {
    keyCol: string;
    label: string;
    sortable?: boolean;
    currentSortDirection: TSortDirection;
    onSort: (key: string) => void;
    width?: string;
    headerClassName?: string;
}

function getSortIconName(direction: TSortDirection): IconComponentsEnum {
    if (direction === 'asc') return IconComponentsEnum.arrowUp;
    if (direction === 'desc') return IconComponentsEnum.arrowDown;
    return IconComponentsEnum.arrowUp;
}

function getAriaSort(direction: TSortDirection): React.AriaAttributes['aria-sort'] {
    if (direction === 'asc') return 'ascending';
    if (direction === 'desc') return 'descending';
    return undefined;
}

const TableColumnHeader = ({
    keyCol,
    label,
    sortable = false,
    currentSortDirection,
    onSort,
    width,
    headerClassName,
}: ITableColumnHeaderProps) => {
    const isSorted = Boolean(currentSortDirection);

    const labelNode = (
        <Label
            color={isSorted ? 'text-primary-700' : 'text-gray-500'}
            className="uppercase"
            variant={EVariantLabel.overline}
        >
            {label}
        </Label>
    );

    return (
        <th
            scope="col"
            style={width ? { width } : undefined}
            aria-sort={sortable ? getAriaSort(currentSortDirection) : undefined}
            className={twMerge(
                'sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-left',
                headerClassName,
            )}
        >
            {sortable ? (
                <button
                    type="button"
                    onClick={() => onSort(keyCol)}
                    className={twMerge(
                        'group inline-flex max-w-full items-center gap-1 rounded-md py-0.5 transition-colors',
                        'hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                    )}
                >
                    {labelNode}
                    <Icon
                        name={getSortIconName(currentSortDirection)}
                        size={ESize.xs}
                        color={isSorted ? 'text-primary-600' : 'text-gray-300'}
                        className={twMerge(
                            'shrink-0 transition-opacity',
                            !isSorted && 'opacity-0 group-hover:opacity-100',
                        )}
                    />
                </button>
            ) : (
                labelNode
            )}
        </th>
    );
};

// ─── Row ──────────────────────────────────────────────────────────────────────

interface ITableRowProps<TRow> {
    row: TRow;
    rowIndex: number;
    columns: ITableColumnFlat<TRow>[];
    actionSlot?: React.ReactNode;
    onClickRow?: (row: TRow, index: number) => void;
    className?: string;
}

const TableRow = <TRow,>({
    row,
    rowIndex,
    columns,
    actionSlot,
    onClickRow,
    className,
}: ITableRowProps<TRow>) => (
    <tr
        onClick={() => onClickRow?.(row, rowIndex)}
        className={twMerge(
            'border-b border-gray-100 transition-colors last:border-b-0',
            onClickRow ? 'cursor-pointer hover:bg-primary-50/50' : 'hover:bg-gray-50',
            className,
        )}
    >
        {columns.map((col) => {
            const rawValue = (row as Record<string, unknown>)[col.key];

            return (
                <td
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={twMerge('align-middle', col.cellClassName)}
                >
                    {renderCellContent(col, rawValue, row)}
                </td>
            );
        })}

        {actionSlot !== undefined && (
            <td className="w-14 align-middle px-3 py-2 text-right">{actionSlot}</td>
        )}
    </tr>
);

// ─── Action menu ──────────────────────────────────────────────────────────────

interface ITableActionMenuProps<TRow> {
    actions: ITable<TRow>['actions'];
    row: TRow;
    rowIndex: number;
}

const actionIconButtonClass = twMerge(
    'inline-flex size-8 cursor-pointer items-center justify-center rounded-lg',
    'text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
);

const TableActionMenu = <TRow,>({ actions = [], row, rowIndex }: ITableActionMenuProps<TRow>) => {
    const tCommon = useTranslations('common');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    const visibleActions = actions.filter((action) => !action.isVisible || action.isVisible(row));

    useEffect(() => {
        if (!open || !triggerRef.current) return;

        const updatePosition = () => {
            const rect = triggerRef.current!.getBoundingClientRect();
            const menuWidth = 176;
            const left = Math.min(
                Math.max(8, rect.right - menuWidth),
                window.innerWidth - menuWidth - 8,
            );
            setMenuStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left,
                zIndex: 10050,
            });
        };

        updatePosition();

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            setOpen(false);
        };

        const onScrollOrResize = () => setOpen(false);

        document.addEventListener('mousedown', onPointerDown);
        window.addEventListener('resize', onScrollOrResize);
        window.addEventListener('scroll', onScrollOrResize, true);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('resize', onScrollOrResize);
            window.removeEventListener('scroll', onScrollOrResize, true);
        };
    }, [open]);

    if (visibleActions.length === 0) return null;

    if (visibleActions.length === 1) {
        const action = visibleActions[0] as ITableAction<TRow>;
        return (
            <Div onClick={(e) => e.stopPropagation()} className="inline-flex justify-end">
                <button
                    type="button"
                    aria-label={action.label}
                    className={actionIconButtonClass}
                    onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(row, rowIndex);
                    }}
                >
                    <Icon
                        name={action.iconName ?? IconComponentsEnum.edit}
                        size={ESize.sm}
                        color="text-gray-500"
                    />
                </button>
            </Div>
        );
    }

    return (
        <Div onClick={(e) => e.stopPropagation()} className="inline-flex justify-end">
            <button
                ref={triggerRef}
                type="button"
                aria-label={tCommon('actions')}
                aria-expanded={open}
                aria-haspopup="menu"
                className={twMerge(actionIconButtonClass, open && 'bg-gray-100 text-gray-800')}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((prev) => !prev);
                }}
            >
                <Icon name={IconComponentsEnum.moreHorizontal} size={ESize.sm} color="text-gray-500" />
            </button>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        style={menuStyle}
                        className="min-w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                    >
                        {visibleActions.map((action, index) => (
                            <button
                                key={`${action.label}-${index}`}
                                type="button"
                                role="menuitem"
                                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(false);
                                    action.onClick(row, rowIndex);
                                }}
                            >
                                {action.iconName && (
                                    <Icon name={action.iconName} size={ESize.sm} color="text-gray-500" />
                                )}
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-800">
                                    {action.label}
                                </Label>
                            </button>
                        ))}
                    </div>,
                    document.body,
                )}
        </Div>
    );
};

// ─── Search bar ───────────────────────────────────────────────────────────────

interface ITableSearchBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onClickFilter?: () => void;
    primaryAction?: React.ReactNode;
    filterTags?: string[];
    onRemoveTag?: (tag: string) => void;
    onReset?: () => void;
    placeholder?: string;
    className?: string;
    onAddTag?: (tag: string) => void;
    clearSearchOnAddTag?: boolean;
}

const TableSearchBar = ({
    searchValue,
    onSearchChange,
    onClickFilter,
    primaryAction,
    filterTags = [],
    onRemoveTag,
    onReset,
    onAddTag,
    clearSearchOnAddTag,
    placeholder,
    className,
}: ITableSearchBarProps) => {
    const tCommon = useTranslations('common');

    return (
        <div className={twMerge('flex flex-col gap-3', className)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                    id="table-search"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder ?? tCommon('search')}
                    leftIcon={IconComponentsEnum.search}
                    rightIcon={onClickFilter ? IconComponentsEnum.filter : undefined}
                    onRightIconClick={onClickFilter}
                    containerClassName="min-w-0 flex-1"
                    onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        const trimmed = searchValue.trim();
                        if (!trimmed) return;
                        onAddTag?.(trimmed);
                        if (clearSearchOnAddTag !== false) onSearchChange('');
                    }}
                />

                {primaryAction && (
                    <div className="w-full shrink-0 sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
                        {primaryAction}
                    </div>
                )}
            </div>

            {filterTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {filterTags.map((tag) => (
                        <Badge
                            key={tag}
                            id={`table-filter-${tag}`}
                            text={tag}
                            type={EBadgeType.revprimary}
                            size={EBadgeSize.tiny}
                            isDismissible={Boolean(onRemoveTag)}
                            onDismiss={() => onRemoveTag?.(tag)}
                        />
                    ))}
                    {onReset && (
                        <Button
                            id="button-reset"
                            type={EButtonType.secondary}
                            size={EButtonSize.small}
                            text={tCommon('reset')}
                            icon={{ name: IconComponentsEnum.close, color: 'text-gray-500', size: ESize.sm }}
                            iconPosition="right"
                            onClick={onReset}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Pagination ───────────────────────────────────────────────────────────────

type PageItem = number | 'ellipsis';

function range(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getPageItems(page: number, totalPages: number): PageItem[] {
    if (totalPages <= 7) return range(1, totalPages);

    const siblingCount = 1;

    if (page <= 3 + siblingCount) {
        return [...range(1, 4 + siblingCount), 'ellipsis', totalPages];
    }

    if (page >= totalPages - (2 + siblingCount)) {
        return [1, 'ellipsis', ...range(totalPages - (3 + siblingCount), totalPages)];
    }

    return [1, 'ellipsis', ...range(page - siblingCount, page + siblingCount), 'ellipsis', totalPages];
}

const navButtonClass =
    'inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent';

const pageButtonClass = (isActive: boolean) =>
    twMerge(
        'inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors',
        isActive ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100',
    );

interface ITablePaginationProps {
    page: number;
    totalPages: number;
    totalRows?: number;
    pageSize?: number;
    onChange: (page: number) => void;
    labelPrev?: string;
    labelNext?: string;
    className?: string;
}

const TablePagination = ({
    page,
    totalPages,
    totalRows,
    pageSize = 10,
    onChange,
    labelPrev,
    labelNext,
    className,
}: ITablePaginationProps) => {
    const tCommon = useTranslations('common');
    const pageItems = getPageItems(page, totalPages);
    const hasRange = totalRows != null && totalRows > 0;
    const rangeStart = hasRange ? (page - 1) * pageSize + 1 : 0;
    const rangeEnd = hasRange ? Math.min(page * pageSize, totalRows) : 0;
    const prevLabel = labelPrev ?? tCommon('previous');
    const nextLabel = labelNext ?? tCommon('next');

    return (
        <div
            className={twMerge(
                'flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5',
                className,
            )}
        >
            <Label variant={EVariantLabel.hint} color="text-gray-500" className="shrink-0">
                {hasRange
                    ? tCommon('showingRange', { from: rangeStart, to: rangeEnd, total: totalRows })
                    : tCommon('pageOf', { page, totalPages })}
            </Label>

            <nav
                className="flex flex-wrap items-center justify-center gap-0.5 sm:justify-end"
                aria-label={tCommon('paginationAria')}
            >
                <button
                    type="button"
                    id="table-pagination-prev"
                    className={navButtonClass}
                    disabled={page === 1}
                    onClick={() => onChange(page - 1)}
                    aria-label={prevLabel}
                >
                    <Icon name={IconComponentsEnum.chevronLeft} size={ESize.sm} color="text-gray-500" />
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="hidden sm:inline">
                        {prevLabel}
                    </Label>
                </button>

                <div className="flex items-center gap-0.5 px-1">
                    {pageItems.map((item, index) =>
                        item === 'ellipsis' ? (
                            <span
                                key={`ellipsis-${String(pageItems[index - 1])}-${String(pageItems[index + 1])}`}
                                className="inline-flex size-8 items-center justify-center text-gray-400"
                                aria-hidden
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                id={`table-pagination-page-${item}`}
                                className={pageButtonClass(item === page)}
                                onClick={() => onChange(item)}
                                aria-label={tCommon('pageAria', { page: item })}
                                aria-current={item === page ? 'page' : undefined}
                            >
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color={item === page ? 'text-white' : 'text-gray-600'}
                                >
                                    {item}
                                </Label>
                            </button>
                        ),
                    )}
                </div>

                <button
                    type="button"
                    id="table-pagination-next"
                    className={navButtonClass}
                    disabled={page === totalPages}
                    onClick={() => onChange(page + 1)}
                    aria-label={nextLabel}
                >
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="hidden sm:inline">
                        {nextLabel}
                    </Label>
                    <Icon name={IconComponentsEnum.chevronRight} size={ESize.sm} color="text-gray-500" />
                </button>
            </nav>
        </div>
    );
};

// ─── Mobile card row ──────────────────────────────────────────────────────────

const MobileTableRow = <TRow,>({
    row,
    rowIndex,
    columns,
    actions,
    onClickRow,
}: {
    row: TRow;
    rowIndex: number;
    columns: ITableColumnFlat<TRow>[];
    actions?: ITable<TRow>['actions'];
    onClickRow?: (row: TRow, index: number) => void;
}) => {
    const body = (
        <div className="flex flex-col gap-3">
            {columns.map((col) => {
                const rawValue = (row as Record<string, unknown>)[col.key];
                return (
                    <div key={col.key} className="flex flex-col gap-1">
                        <Label variant={EVariantLabel.overline} color="text-gray-500" className="uppercase">
                            {col.label}
                        </Label>
                        <div className={col.cellClassName}>
                            {col.render ? (
                                col.render(rawValue, row)
                            ) : (
                                <TableCell
                                    mainText={rawValue != null ? String(rawValue) : undefined}
                                    cellClassName="px-0 py-0"
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            {onClickRow ? (
                <button
                    type="button"
                    className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors active:bg-primary-50/40"
                    onClick={() => onClickRow(row, rowIndex)}
                >
                    {body}
                </button>
            ) : (
                <div className="px-4 py-4">{body}</div>
            )}
            {actions && (
                <div className="flex justify-end px-4 pb-3">
                    <TableActionMenu actions={actions} row={row} rowIndex={rowIndex} />
                </div>
            )}
        </div>
    );
};

// ─── Table ────────────────────────────────────────────────────────────────────

const OrganismTable = <TRow,>({
    columns,
    rows,
    searchable = true,
    searchValue: controlledSearch,
    onSearchChange: onControlledSearchChange,
    filterTags = [],
    onRemoveTag,
    onReset,
    primaryAction,
    placeholder,
    sortConfig: controlledSort,
    onSort: onControlledSort,
    pageSize = 10,
    page: controlledPage,
    totalRows: controlledTotalRows,
    onPageChange: onControlledPageChange,
    labelPrev,
    labelNext,
    onClickRow,
    onClickFilter,
    actions,
    footer,
    isLoading = false,
    emptyMessage,
    className,
    tableClassName,
    footerClassName,
    onFilterRow,
    onAddTag,
    clearSearchOnAddTag,
}: ITable<TRow>) => {
    const tCommon = useTranslations('common');
    const [internalSearch, setInternalSearch] = useState('');
    const [internalSort, setInternalSort] = useState<ITableSortConfig | null>(null);
    const [internalPage, setInternalPage] = useState(1);

    const isServerSide = controlledPage !== undefined || controlledTotalRows !== undefined;
    const search = controlledSearch ?? internalSearch;
    const currentSort = controlledSort ?? internalSort;
    const currentPage = controlledPage ?? internalPage;
    const resolvedEmptyMessage = emptyMessage ?? tCommon('noResults');

    const flatColumns = useMemo(
        () =>
            columns.map((col) => {
                if (col.headerElement) {
                    const { headerElement } = col;
                    return {
                        key: headerElement.value,
                        label: headerElement.label,
                        sortable: headerElement.sortable,
                        width: headerElement.width,
                        render: headerElement.render,
                        cellClassName: headerElement.cellClassName,
                        headerClassName: headerElement.headerClassName,
                    };
                }
                return col as unknown as ITableColumnFlat<TRow>;
            }),
        [columns],
    );

    const handleSearch = (value: string) => {
        onControlledSearchChange?.(value);
        setInternalSearch(value);
        setInternalPage(1);
    };

    const handleSort = (key: string) => {
        const nextDir: TTableSortDirection =
            currentSort?.key === key && currentSort?.direction === 'asc' ? 'desc' : 'asc';
        const next: ITableSortConfig = { key, direction: nextDir };
        onControlledSort?.(key, nextDir);
        setInternalSort(next);
    };

    const handlePageChange = (page: number) => {
        onControlledPageChange?.(page);
        setInternalPage(page);
    };

    const processed = useMemo(() => {
        if (isServerSide) return rows;

        let data = [...rows];

        if (filterTags.length > 0) {
            data = data.filter((row) => (onFilterRow ? onFilterRow(row, filterTags) : true));
        }

        if (search) {
            const query = search.toLowerCase();
            data = data.filter((row) =>
                flatColumns.some((col) => {
                    const value = (row as Record<string, unknown>)[col.key];
                    return value != null && String(value).toLowerCase().includes(query);
                }),
            );
        }

        if (currentSort) {
            const { key, direction } = currentSort;
            data = [...data].sort((a, b) => {
                const av = (a as Record<string, unknown>)[key];
                const bv = (b as Record<string, unknown>)[key];
                if (av == null) return 1;
                if (bv == null) return -1;
                if (av < bv) return direction === 'asc' ? -1 : 1;
                if (av > bv) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [rows, search, currentSort, flatColumns, isServerSide, filterTags, onFilterRow]);

    const totalRows = controlledTotalRows ?? processed.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const paginatedRows = isServerSide
        ? processed
        : processed.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const emptyState = (
        <div className="flex flex-col items-center gap-2.5 px-4 py-14">
            <div className="flex size-11 items-center justify-center rounded-full bg-gray-100">
                <Icon name={IconComponentsEnum.search} size={ESize.md} color="text-gray-400" />
            </div>
            <Label color="text-gray-500" variant={EVariantLabel.bodySmall}>
                {resolvedEmptyMessage}
            </Label>
        </div>
    );

    return (
        <div
            className={twMerge(
                'w-full overflow-hidden rounded-2xl border border-gray-200 bg-white',
                className,
            )}
        >
            {searchable && (
                <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                    <TableSearchBar
                        searchValue={search}
                        onSearchChange={handleSearch}
                        primaryAction={primaryAction}
                        filterTags={filterTags}
                        onRemoveTag={onRemoveTag}
                        onReset={onReset}
                        placeholder={placeholder}
                        onAddTag={onAddTag}
                        clearSearchOnAddTag={clearSearchOnAddTag}
                        onClickFilter={onClickFilter}
                    />
                </div>
            )}

            {isLoading ? (
                <div className="flex min-h-48 w-full items-center justify-center py-16">
                    <Spinner color="text-primary-500" size="lg" />
                </div>
            ) : (
                <>
                    <div className="hidden overflow-x-auto md:block">
                        <table className={twMerge('min-w-full table-auto border-collapse', tableClassName)}>
                            <thead>
                                <tr>
                                    {flatColumns.map(({ key, ...colRest }) => (
                                        <TableColumnHeader
                                            key={key}
                                            {...colRest}
                                            keyCol={key}
                                            currentSortDirection={
                                                currentSort?.key === key
                                                    ? (currentSort.direction as TSortDirection)
                                                    : null
                                            }
                                            onSort={handleSort}
                                        />
                                    ))}
                                    {actions && (
                                        <th
                                            scope="col"
                                            className="sticky top-0 z-10 w-14 border-b border-gray-200 bg-gray-50 px-3 py-2.5 text-right"
                                        >
                                            <span className="sr-only">{tCommon('actions')}</span>
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedRows.length > 0 ? (
                                    paginatedRows.map((row, index) => (
                                        <TableRow
                                            key={getRowKey(row, index)}
                                            row={row}
                                            rowIndex={index}
                                            columns={flatColumns}
                                            onClickRow={onClickRow}
                                            actionSlot={
                                                actions ? (
                                                    <TableActionMenu
                                                        actions={actions}
                                                        row={row}
                                                        rowIndex={index}
                                                    />
                                                ) : undefined
                                            }
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={flatColumns.length + (actions ? 1 : 0)}>
                                            {emptyState}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden">
                        {paginatedRows.length > 0 ? (
                            paginatedRows.map((row, index) => (
                                <MobileTableRow
                                    key={getRowKey(row, index)}
                                    row={row}
                                    rowIndex={index}
                                    columns={flatColumns}
                                    actions={actions}
                                    onClickRow={onClickRow}
                                />
                            ))
                        ) : (
                            emptyState
                        )}
                    </div>

                    {footer && footer.length > 0 && (
                        <div className={twMerge('border-t border-gray-100', footerClassName)}>
                            {footer.map((item, index) => (
                                <div key={index} className="border-b border-gray-100 last:border-b-0">
                                    {item}
                                </div>
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <TablePagination
                            page={currentPage}
                            totalPages={totalPages}
                            totalRows={totalRows}
                            pageSize={pageSize}
                            onChange={handlePageChange}
                            labelPrev={labelPrev}
                            labelNext={labelNext}
                        />
                    )}
                </>
            )}
        </div>
    );
};

OrganismTable.Cell = TableCell;

type OrganismTableComponent = typeof OrganismTable & {
    Cell: typeof TableCell;
};

export default OrganismTable as OrganismTableComponent;
