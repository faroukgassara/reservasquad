import React from "react";
import OrganismFiltersPanel from "@/components/Organisms/Organismfilterspanel/Organismfilterspanel";
import {
  IOrganismResourcesFiltersPanelProps,
} from "@/interfaces/Organisms/IOrganismRessourcesFiltersPanel/IOrganismRessourcesFilterPanel";
import { DEFAULT_RESOURCES_FILTERS, buildFields } from "@/types/Filter-helper";

const OrganismResourcesFiltersPanel = ({
  competenceOptions = [],
  posteOptions = [],
  clientOptions = [],
  projetOptions = [],
  initialValues = DEFAULT_RESOURCES_FILTERS,
  onApply,
  onCancel,
  className,
}: IOrganismResourcesFiltersPanelProps) => {
  const fields = buildFields(
    competenceOptions,
    posteOptions,
    clientOptions,
    projetOptions
  );

  return (
    <OrganismFiltersPanel
      fields={fields}
      showSearch
      initialValues={initialValues}
      onApply={onApply}
      onCancel={onCancel}
      className={className}
    />
  );
};

export default OrganismResourcesFiltersPanel;
