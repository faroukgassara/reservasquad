import React, { useState, useMemo } from 'react'
import { twMerge } from 'tailwind-merge'
import MoleculeTableSearchBar from '@/components/Molecules/MoleculeTableSearchBar/MoleculeTableSearchBar'
import MoleculeTableColumnHeader from '@/components/Molecules/MoleculeTableColumnHeader/MoleculeTableColumnHeader'
import MoleculeTableRow from '@/components/Molecules/MoleculeTableRow/MoleculeTableRow'
import MoleculeTableActionMenu from '@/components/Molecules/MoleculeTableActionMenu/MoleculeTableActionMenu'
import MoleculeTablePagination from '@/components/Molecules/MoleculeTablePagination/MoleculeTablePagination'
import MoleculeDropdown from '@/components/Molecules/MoleculeDropdown/MoleculeDropdown'
import { IOrganismTable, ITableSortConfig, TTableSortDirection, } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable'
import { TSortDirection } from '@/interfaces/Molecules/IMoleculeTableColumn/IMoleculeTableColumn'
import { EVariantLabel } from '@/Enum/Enum'
import AtomSpinner from '@/components/Atoms/AtomSpinner/AtomSpinner'
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel'
const OrganismTable = <TRow,>({
  columns,
  rows,
  title,
  badge,
  headerActions,
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
  emptyMessage = 'Aucune donnée disponible',
  className,
  tableClassName,
  footerClassName,
  onFilterRow,
  onAddTag,
  clearSearchOnAddTag,
}: IOrganismTable<TRow>) => {

  const [internalSearch, setInternalSearch] = useState('')
  const [internalSort, setInternalSort] = useState<ITableSortConfig | null>(null)
  const [internalPage, setInternalPage] = useState(1)
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({})

  const isServerSide = controlledPage !== undefined || controlledTotalRows !== undefined
  const search = controlledSearch ?? internalSearch
  const currentSort = controlledSort ?? internalSort
  const currentPage = controlledPage ?? internalPage

  const flatColumns = useMemo(
    () => columns.map((col: any) => {
      if (col.headerElement) {
        const { headerElement } = col
        return {
          key: headerElement.value,
          label: headerElement.label,
          sortable: headerElement.sortable,
          width: headerElement.width,
          render: headerElement.render,
          cellClassName: headerElement.cellClassName,
          headerClassName: headerElement.headerClassName,
        }
      }
      return col
    }),
    [columns]
  )

  React.useEffect(() => {
    setVisibleCols((prev) => {
      const next = { ...prev }
      flatColumns.forEach((c) => {
        if (next[c.key] === undefined) next[c.key] = true
      })
      return next
    })
  }, [flatColumns])

  const visibleFlatColumns = flatColumns.filter((c) => visibleCols[c.key] !== false)

  const handleSearch = (value: string) => {
    onControlledSearchChange?.(value)
    setInternalSearch(value)
    setInternalPage(1)
  }

  const handleSort = (key: string) => {
    const nextDir: TTableSortDirection =
      currentSort?.key === key && currentSort?.direction === 'asc' ? 'desc' : 'asc'
    const next: ITableSortConfig = { key, direction: nextDir }
    onControlledSort?.(key, nextDir)
    setInternalSort(next)
  }

  const handlePageChange = (p: number) => {
    onControlledPageChange?.(p)
    setInternalPage(p)
  }

  const processed = useMemo(() => {
    if (isServerSide) return rows

    let data = [...rows]

    if (filterTags.length > 0) {
      data = data.filter((row) => onFilterRow ? onFilterRow(row, filterTags) : true)
    }

    if (search) {
      const q = search.toLowerCase()
      data = data.filter((row) =>
        visibleFlatColumns.some((col) => {
          const val = (row as any)[col.key]
          return val != null && String(val).toLowerCase().includes(q)
        })
      )
    }

    if (currentSort) {
      const { key, direction } = currentSort
      data = [...data].sort((a, b) => {
        const av = (a as any)[key]
        const bv = (b as any)[key]
        if (av == null) return 1
        if (bv == null) return -1
        if (av < bv) return direction === 'asc' ? -1 : 1
        if (av > bv) return direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return data
  }, [rows, search, currentSort, flatColumns, isServerSide, filterTags, onFilterRow])

  const totalRows = controlledTotalRows ?? processed.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const paginatedRows = isServerSide
    ? processed
    : processed.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const resolvedBadge = badge !== undefined ? badge : `${totalRows}`

  return (
    <div className="flex flex-col gap-4">
      {searchable && (
        <MoleculeTableSearchBar
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
      )}

      {isLoading ? (
        <div className="flex w-full items-center justify-center py-16">
          <AtomSpinner color="text-gray-900" size="lg" />
        </div>
      ) : (
        <div className={twMerge(
          'w-full overflow-hidden rounded-xl border border-gray-200 bg-white',
          className
        )}>
          {(title || resolvedBadge !== null || headerActions) && (
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-2.5">
                {title && (
                  <AtomLabel color="text-gray-900" variant={EVariantLabel.h5}>
                    {title}
                  </AtomLabel>
                )}
                {resolvedBadge !== null && resolvedBadge !== undefined && (
                  <AtomLabel className="rounded-full bg-primary-50 px-3 py-1 text-primary-500" color="text-primary-500" variant={EVariantLabel.bodySmall}>
                    {resolvedBadge}
                  </AtomLabel>
                )}
              </div>

              <div className="flex items-center gap-2">
                {headerActions}
                <MoleculeDropdown
                  placeholder="Colonnes"
                  multiSelect={true}
                  value={Object.keys(visibleCols).filter(k => visibleCols[k])}
                  options={flatColumns.map(c => ({ label: c.label, value: c.key }))}
                  onChange={(selectedKeys) => {
                    if (!Array.isArray(selectedKeys)) return
                    const newVisibleCols: Record<string, boolean> = {}
                    flatColumns.forEach(c => {
                      newVisibleCols[c.key] = selectedKeys.includes(c.key)
                    })
                    setVisibleCols(newVisibleCols)
                  }}
                  containerClassName="min-w-[220px]"
                />
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className={twMerge('min-w-full table-auto border-collapse', tableClassName)}>
              <thead>
                <tr>
                  {visibleFlatColumns.map(({ key, ...colRest }) => (
                    <MoleculeTableColumnHeader
                      key={key}
                      {...colRest}
                      keyCol={key}
                      currentSortDirection={
                        currentSort
                          ? currentSort.key === key
                            ? currentSort.direction as TSortDirection
                            : null
                          : null
                      }
                      onSort={handleSort}
                    />
                  ))}
                  {actions && (
                    <th className="border-b border-gray-200 bg-gray-50 px-4 py-3" />
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, index) => (
                    <MoleculeTableRow
                      key={index}
                      row={row}
                      rowIndex={index}
                      columns={visibleFlatColumns}
                      onClickRow={onClickRow}
                      actionSlot={
                        actions
                          ? <MoleculeTableActionMenu
                            actions={actions}
                            row={row}
                            rowIndex={index}
                          />
                          : undefined
                      }
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={visibleFlatColumns.length + (actions ? 1 : 0)}
                      className="py-12 text-center"
                    >
                      <AtomLabel color="text-gray-500" variant={EVariantLabel.bodySmall}>
                        {emptyMessage}
                      </AtomLabel>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {footer && footer.length > 0 && (
            <div className={twMerge('border-t border-gray-200', footerClassName)}>
              {footer.map((item, i) => (
                <div key={i} className="border-b border-gray-100 last:border-b-0">
                  {item}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <MoleculeTablePagination
              page={currentPage}
              totalPages={totalPages}
              onChange={handlePageChange}
              labelPrev={labelPrev}
              labelNext={labelNext}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default OrganismTable