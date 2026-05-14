import { Div, Icon } from '@/components/Atoms'
import MoleculeDropdown from '@/components/Molecules/MoleculeDropdown/MoleculeDropdown'
import { IMoleculeTableActionMenu } from '@/interfaces/Molecules/IMoleculeTableAction/IMoleculeTableAction'

const MoleculeTableActionMenu = <TRow,>({
  actions,
  row,
  rowIndex,
}: IMoleculeTableActionMenu<TRow>) => {
  const visibleActions = actions.filter(
    (a) => !a.isVisible || a.isVisible(row)
  )

  if (visibleActions.length === 0) return null

  const options = visibleActions.map((action, index) => ({
    label: action.label,
    value: index,
    icon: action.iconName ? (
      <Icon name={action.iconName} size="text-large" color="text-gray-600" />
    ) : undefined,
  }))

  return (
    <Div onClick={(e) => e.stopPropagation()}>
      <MoleculeDropdown
        options={options}
        placeholder=""
        onChange={(value) => {
          const action = visibleActions[Number(value)]
          action?.onClick(row, rowIndex)
        }}
        containerClassName="inline-block w-auto"
      />
    </Div>
  )
}

export default MoleculeTableActionMenu
