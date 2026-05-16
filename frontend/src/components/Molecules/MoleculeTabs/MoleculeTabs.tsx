
import { EButtonSize, EButtonType } from "@/Enum/Enum";
import IMoleculeTabs from "@/interfaces/Molecules/IMoleculeTabs/IMoleculeTabs";
import MoleculeButton from "../MoleculeButton/MoleculeButton";

const MoleculeTabs = ({
  options,
  value,
  onChange,
  variant = 'underline',
  disabled = false,
  className = "",
}: Readonly<IMoleculeTabs>) => {

  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-gray-200 ${className}`} role="tablist">
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <MoleculeButton
              id={`tab-button-${opt.value}`}
              key={opt.value}
              text={opt.label}
              type={EButtonType.gray}
              size={EButtonSize.small}
              disabled={disabled || opt.disabled}
              onClick={() => onChange(opt.value)}
              className={`
                -mb-px rounded-none border-b-2 bg-transparent hover:bg-transparent shadow-none
                ${isActive
                  ? 'border-primary-600 text-primary-700 hover:text-primary-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={`inline-flex gap-1 p-1 bg-gray-100 rounded-lg ${className}`} role="tablist">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <MoleculeButton
            id={`tab-button-${opt.value}`}
            key={opt.value}
            text={opt.label}
            type={EButtonType.gray}
            size={EButtonSize.small}
            disabled={disabled || opt.disabled}
            onClick={() => onChange(opt.value)}
            className={`
              rounded-md
              ${isActive
                ? 'bg-white text-gray-900 shadow-sm hover:bg-white'
                : 'bg-transparent text-gray-600 hover:text-gray-900 shadow-none'
              }
            `}
          />
        );
      })}
    </div>
  );
};

export default MoleculeTabs;