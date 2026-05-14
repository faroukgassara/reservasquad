import { MultiSelectOption } from "@/components/Molecules/MoleculeMultiSelect/MoleculeMultiSelect";
import { FilterFieldType, FilterValues } from "@/components/Organisms/Organismfilterspanel/Organismfilterspanel";

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  colSpan?: number;
  options?: MultiSelectOption[];
  placeholder?: string;
}

export  default interface IOrganismFiltersPanel {
  fields: FilterField[];
  showSearch?: boolean;
  initialValues?: FilterValues;
  onApply: (values: FilterValues) => void;
  onCancel?: () => void;
  className?: string;
}