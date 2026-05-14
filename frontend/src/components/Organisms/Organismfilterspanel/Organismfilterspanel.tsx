import { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import MoleculeDropdown from "@/components/Molecules/MoleculeDropdown/MoleculeDropdown";
import MoleculeMultiSelect from "@/components/Molecules/MoleculeMultiSelect/MoleculeMultiSelect";
import MoleculeDateRange from "@/components/Molecules/Moleculedaterange/Moleculedaterange";
import AtomButton from "@/components/Atoms/AtomButton/AtomButton";
import IOrganismFiltersPanel, { FilterField } from "@/interfaces/Organisms/IOrganismFiltersPanel/IOrganismFiltersPanel";

export type FilterFieldType = "multiselect" | "dropdown" | "daterange";



export type FilterValues = Record<string, any> & {
  search?: string;
};


const defaultValueForType = (type: FilterFieldType) => {
  if (type === "multiselect") return [];
  if (type === "daterange") return {};
  return undefined;
};



const buildDefaultDraft = (fields: FilterField[], initial: FilterValues = {}): FilterValues => {
  const base: FilterValues = { search: "", ...initial };
  fields.forEach((f) => {
    if (!(f.key in base)) {
      base[f.key] = defaultValueForType(f.type);
    }
  });
  return base;
};

const OrganismFiltersPanel = ({
  fields,
  showSearch: _showSearch = true,
  initialValues = {},
  onApply,
  onCancel,
  className,
}: IOrganismFiltersPanel) => {
  void _showSearch;
  const [draft, setDraft] = useState<FilterValues>(() =>
    buildDefaultDraft(fields, initialValues)
  );

  useEffect(() => {
    setDraft(buildDefaultDraft(fields, initialValues));
  }, [JSON.stringify(initialValues)]);

  const update = (key: string, value: any) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleCancel = () => {
    setDraft(buildDefaultDraft(fields, initialValues));
    onCancel?.();
  };

  const handleApply = () => {
    onApply(draft);
  };

  const renderField = (field: FilterField) => {
    switch (field.type) {
      case "multiselect":
        return (
          <MoleculeMultiSelect
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            options={field.options ?? []}
            values={draft[field.key] ?? []}
            onChange={(v) => update(field.key, v)}
          />
        );
      case "dropdown":
        return (
          <MoleculeDropdown
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            options={field.options ?? []}
            value={draft[field.key]}
            onChange={(v) => update(field.key, v)}
          />
        );
      case "daterange":
        return (
          <MoleculeDateRange
            key={field.key}
            label={field.label}
            value={draft[field.key] ?? {}}
            onChange={(v:any) => update(field.key, v)}
          />
        );
    }
  };

  return (
    <div
      className={twMerge(
        "bg-white rounded-xxl p-4 flex flex-col gap-4 shadow-sm",
        className
      )}
    >
  
      <div className="grid grid-cols-3 gap-x-4 gap-y-4">
        {fields.map((field) => (
          <div
            key={field.key}
            className={field.colSpan ? `col-span-${field.colSpan}` : ""}
          >
            {renderField(field)}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <AtomButton 
         id="cancelButton"
          onClick={handleCancel}
          className={twMerge(
            "px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white",
            "hover:bg-gray-50 transition-colors"
          )}
        >
          Annuler
        </AtomButton>
        <AtomButton 
        id="applyButton"
          onClick={handleApply}
          className={twMerge(
            "px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600",
            "hover:bg-primary-700 transition-colors"
          )}
        >
          Appliquer
        </AtomButton>
      </div>
    </div>
  );
};

export default OrganismFiltersPanel;