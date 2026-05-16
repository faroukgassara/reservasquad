import { twMerge } from 'tailwind-merge'
import AtomIcon from '@/components/Atoms/AtomIcon/AtomIcon'
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel'
import { EVariantLabel, IconComponentsEnum } from '@/Enum/Enum'
import { IMoleculeTableColumnHeader } from '@/interfaces/Molecules/IMoleculeTableColumn/IMoleculeTableColumn'

const MoleculeTableColumnHeader = ({
    keyCol,
    label,
    sortable = false,
    currentSortDirection,
    onSort,
    width,
    headerClassName,
}: IMoleculeTableColumnHeader) => {
    const sortIconName =
        currentSortDirection === 'asc'
            ? IconComponentsEnum.arrowUp
            : currentSortDirection === 'desc'
                ? IconComponentsEnum.arrowDown
                : IconComponentsEnum.arrowUp

    return (
        <th
            style={width ? { width } : undefined}
            onClick={() => sortable && onSort(keyCol)}
            className={twMerge(
                'border-b border-gray-200 bg-gray-50 px-6 py-3 text-left',
                sortable ? 'cursor-pointer select-none' : '',
                headerClassName
            )}
        >
            <div className="flex items-center gap-1 whitespace-nowrap">
                <AtomLabel color="text-gray-600" className="text-gray-600" variant={EVariantLabel.bodySmall}>
                    {label}
                </AtomLabel>
                {sortable && (
                    <AtomIcon
                        name={sortIconName as IconComponentsEnum}
                        size="text-sm"
                        color={currentSortDirection ? 'text-primary-600' : 'text-gray-300'}
                    />
                )}
            </div>
        </th>
    )
}

export default MoleculeTableColumnHeader