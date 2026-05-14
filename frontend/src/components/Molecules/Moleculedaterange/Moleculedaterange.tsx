import { twMerge } from "tailwind-merge";
import { IconComponentsEnum } from "@/Enum/Enum";
import IMoleculeDateRange from "@/interfaces/Molecules/IMoleculeDateRange/IMoleculeDateRange";
import MoleculeFormField from "@/components/Molecules/MoleculeFormField/MoleculeFormField";
import { Icon } from "@/components/Atoms";

const DateField = ({
  prefix,
  value,
  disabled,
  error,
  onChange,
}: {
  prefix: string;
  value?: string;
  disabled?: boolean;
  error?: boolean;
  onChange?: (val: string) => void;
}) => (
  <div
    className={twMerge(
      "flex items-center gap-2 flex-1",
      "py-2 px-3 rounded-lg border border-gray-300 bg-white shadow-sm",
      "outline-none focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-50",
      disabled && "bg-gray-100 opacity-50 cursor-not-allowed",
      error && "border-danger-300 focus-within:ring-4 focus-within:ring-danger-50"
    )}
  >
    <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">{prefix} :</span>
    <input
      type="date"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className="flex-1 text-sm text-gray-900 bg-transparent outline-none min-w-0 cursor-pointer"
    />
    <Icon
      name={IconComponentsEnum.eye}
      size="text-large"
      color={error ? "text-danger-600" : "text-gray-500"}
    />
  </div>
);

const MoleculeDateRange = ({
  label,
  required,
  error,
  disabled,
  containerClassName,
  value = {},
  onChange,
}: IMoleculeDateRange) => {
  return (
    <MoleculeFormField
      label={label}
      required={required}
      error={error}
      containerClassName={containerClassName}
    >
      <div className="flex gap-2">
        <DateField
          prefix="A partir de"
          value={value.from}
          disabled={disabled}
          error={error}
          onChange={(from) => onChange?.({ ...value, from })}
        />
        <DateField
          prefix="Jusqu'à"
          value={value.to}
          disabled={disabled}
          error={error}
          onChange={(to) => onChange?.({ ...value, to })}
        />
      </div>
    </MoleculeFormField>
  );
};

export default MoleculeDateRange;