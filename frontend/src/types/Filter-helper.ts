import { MultiSelectOption } from "@/components/Molecules/MoleculeMultiSelect/MoleculeMultiSelect";
import { FilterField } from "@/interfaces/Organisms/IOrganismFiltersPanel/IOrganismFiltersPanel";


export const DEFAULT_RESOURCES_FILTERS = {
  search: "",
  competences: [],
  disponibilites: {},
  postes: [],
  clients: [],
  projet: undefined,
};

export const buildFields = (
  competenceOptions: MultiSelectOption[],
  posteOptions: MultiSelectOption[],
  clientOptions: MultiSelectOption[],
  projetOptions: MultiSelectOption[]
): FilterField[] => [
  {
    key: "competences",
    label: "Compétences",
    type: "multiselect",
    placeholder: "Sélectionner une compétence",
    options: competenceOptions,
  },
  {
    key: "disponibilites",
    label: "Disponibilités",
    type: "daterange",
    colSpan: 2,
  },
  {
    key: "postes",
    label: "Postes",
    type: "multiselect",
    placeholder: "Sélectionner un poste",
    options: posteOptions,
  },
  {
    key: "clients",
    label: "Clients",
    type: "multiselect",
    placeholder: "Sélectionner un client",
    options: clientOptions,
  },
  {
    key: "projet",
    label: "Projets",
    type: "dropdown",
    placeholder: "Sélectionner un projet",
    options: projetOptions,
  },
];
