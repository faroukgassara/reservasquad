import { MultiSelectOption } from "@/components/Molecules/MoleculeMultiSelect/MoleculeMultiSelect";
import IOrganismFiltersPanel from "../IOrganismFiltersPanel/IOrganismFiltersPanel";

export interface ResourcesFilterValues {
  search: string;
  competences: (string | number)[];
  disponibilites: { from?: string; to?: string };
  postes: (string | number)[];
  clients: (string | number)[];
  projet?: string | number;
}

export interface IOrganismResourcesFiltersPanelProps
  extends Omit<IOrganismFiltersPanel, "fields"> {
  competenceOptions?: MultiSelectOption[];
  posteOptions?: MultiSelectOption[];
  clientOptions?: MultiSelectOption[];
  projetOptions?: MultiSelectOption[];
}
