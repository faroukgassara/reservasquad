export interface IMoleculeTablePagination {
  page: number
  totalPages: number
  onChange: (page: number) => void
  labelPrev?: string
  labelNext?: string
  className?: string
}