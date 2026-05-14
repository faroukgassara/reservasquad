import React from "react";
import { twMerge } from "tailwind-merge";
import { EVariantLabel, IconComponentsEnum } from "@/Enum/Enum";
import { Icon, Label } from "@/components/Atoms";

interface IMoleculeFormField {
  label?: string;
  required?: boolean;
  error?: boolean;
  hintText?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

const MoleculeFormField = ({
  label,
  required,
  error,
  hintText,
  containerClassName,
  children,
}: IMoleculeFormField) => {
  return (
    <div className={twMerge("flex flex-col", containerClassName)}>
      {label && (
        <Label className="mb-1" variant={EVariantLabel.bodySmall} color="text-gray-900">
          {label}
          {required && (
            <Label
              className="ml-1 text-accent-500 align-middle"
              variant={EVariantLabel.bodySmall}
              color="text-primary-600"
            >
              *
            </Label>
          )}
        </Label>
      )}

      {children}

      {hintText && (
        <div className="flex items-center mt-1 gap-1">
          <Icon
            name={IconComponentsEnum.info}
            size="text-large"
            color={error ? "text-danger-600" : "text-gray-600"}
          />
          <Label
            color={error ? "text-danger-700" : "text-gray-700"}
            className="mt-1"
            variant={EVariantLabel.bodySmall}
          >
            {hintText}
          </Label>
        </div>
      )}
    </div>
  );
};

export default MoleculeFormField;
