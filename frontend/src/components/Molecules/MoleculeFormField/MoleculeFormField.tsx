import React from "react";
import { twMerge } from "tailwind-merge";
import { EVariantLabel, IconComponentsEnum } from "@/Enum/Enum";
import AtomLabel from "@/components/Atoms/AtomLabel/AtomLabel";
import AtomIcon from "@/components/Atoms/AtomIcon/AtomIcon";

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
        <AtomLabel className="mb-1" variant={EVariantLabel.bodySmall} color="text-gray-900">
          {label}
          {required && (
            <AtomLabel
              className="ml-1 text-accent-500 align-middle"
              variant={EVariantLabel.bodySmall}
              color="text-primary-600"
            >
              *
            </AtomLabel>
          )}
        </AtomLabel>
      )}

      {children}

      {hintText && (
        <div className="flex items-center mt-1 gap-1">
          <AtomIcon
            name={IconComponentsEnum.info}
            size="text-large"
            color={error ? "text-danger-600" : "text-gray-600"}
          />
          <AtomLabel
            color={error ? "text-danger-700" : "text-gray-700"}
            className="mt-1"
            variant={EVariantLabel.bodySmall}
          >
            {hintText}
          </AtomLabel>
        </div>
      )}
    </div>
  );
};

export default MoleculeFormField;
