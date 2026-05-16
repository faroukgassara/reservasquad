import { twMerge } from 'tailwind-merge'
import MoleculeInput from '@/components/Molecules/MoleculeInput/MoleculeInput'
import { EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum'
import { IMoleculeTableSearchBar } from '@/interfaces/Molecules/IMoleculeTableSearchBar/IMoleculeTableSearchBar'
import MoleculeTag from '../MoleculeTag/MoleculeTag'
import MoleculeButton from '../MoleculeButton/MoleculeButton'

const MoleculeTableSearchBar = ({
    searchValue,
    onSearchChange,
    onClickFilter,
    primaryAction,
    filterTags = [],
    onRemoveTag,
    onReset,
    onAddTag,
    clearSearchOnAddTag,
    placeholder = 'Recherche',
    className,
}: Readonly<IMoleculeTableSearchBar>) => (
    <div className={twMerge('flex flex-col gap-2.5', className)}>

        <div className="flex items-center gap-3">
            <div className="relative flex flex-1 items-center">
                <MoleculeInput
                    id="table-search"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    leftIcon={IconComponentsEnum.search}
                    rightIcon={IconComponentsEnum.filter}
                    onRightIconClick={onClickFilter}
                    containerClassName="flex-1"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = searchValue.trim();
                            if (!trimmed) return;
                            onAddTag?.(trimmed);
                            if (clearSearchOnAddTag !== false) {
                                onSearchChange("");
                            }
                        }
                    }}
                />
            </div>

            {primaryAction}
        </div>

        {filterTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
                {onReset && (
                    <MoleculeButton
                        id="button-reset"
                        type={EButtonType.gray}
                        size={EButtonSize.small}
                        text="Réinitialiser"
                        icon={{ name: IconComponentsEnum.eye, color: 'text-primary-500', size: ESize.sm }}
                        iconPosition="right"
                        onClick={onReset}
                    />
                )}
                {filterTags.map((tag) => (
                    <MoleculeTag
                        key={tag}
                        label={tag}
                        onRemove={() => onRemoveTag?.(tag)}
                    />
                ))}

            </div>
        )}
    </div>
)

export default MoleculeTableSearchBar

