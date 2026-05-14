import React, { useState, useRef, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import AtomInput from "@/components/Atoms/AtomInput/AtomInput";
import MoleculeTag from "@/components/Molecules/MoleculeTag/MoleculeTag";
import { IconComponentsEnum, EBadgeColor, EBadgeSize, EVariantLabel } from "@/Enum/Enum";
import AtomButton from "@/components/Atoms/AtomButton/AtomButton";
import { Icon, Label } from "@/components/Atoms";

export interface MultiSelectOption {
  label: string;
  value: string | number;
}

interface IMoleculeMultiSelect {
  label?: string;
  required?: boolean;
  error?: boolean;
  hintText?: string;
  disabled?: boolean;
  placeholder?: string;
  containerClassName?: string;
  options: MultiSelectOption[];
  values?: (string | number)[];
  onChange?: (values: (string | number)[]) => void;
  searchable?: boolean;
}

const MoleculeMultiSelect = ({
  label,
  required,
  error,
  hintText,
  disabled,
  placeholder = "Select...",
  containerClassName,
  options,
  values = [],
  onChange,
  searchable = true,
}: IMoleculeMultiSelect) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptions = options.filter((o) => values.includes(o.value));
  const filteredOptions = options.filter(
    (o) =>
      !values.includes(o.value) &&
      o.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (value: string | number) => {
    onChange?.([...values, value]);
  };

  const handleRemove = (value: string | number) => {
    onChange?.(values.filter((v) => v !== value));
  };


  const lastSelected = selectedOptions[selectedOptions.length - 1];

  return (
    <div
      ref={containerRef}
      className={twMerge("flex flex-col", containerClassName)}
    >
      {label && (
        <Label color="text-gray-900" className="mb-1" variant={EVariantLabel.bodySmall}>
          {label}
          {required && (
            <Label color="text-primary-10" className="ml-1 align-middle" variant={EVariantLabel.bodySmall}>*</Label>
          )}
        </Label>
      )}

      <div className="relative">
        {/* Trigger */}
        <AtomButton
          id={`multi-select-trigger-${label ?? 'field'}`}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={twMerge(
            "w-full flex items-center justify-between",
            "py-2 px-3 rounded-lg border border-gray-300 bg-white shadow-sm",
            "text-sm text-gray-900 text-left",
            "outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary-50",
            "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger-300 focus:ring-4 focus:ring-danger-50",
            isOpen && "border-primary-300 ring-4 ring-primary-50"
          )}
        >
          <span className={lastSelected ? "text-gray-900" : "text-gray-500 text-sm"}>
            {lastSelected ? lastSelected.label : placeholder}
          </span>
          <Icon
            name={IconComponentsEnum.chevronDown}
            size="text-large"
            color="text-gray-500"
            className={twMerge("transition-transform duration-200", isOpen && "rotate-180")}
          />
        </AtomButton>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-gray-100">
                <AtomInput
                  id={`multi-select-search-${label ?? "field"}`}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                  className="text-sm"
                />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className="px-3 py-2 text-sm text-gray-900 hover:bg-primary-50 cursor-pointer select-none"
                  >
                    {opt.label}
                  </div>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-gray-400">
                  {search ? "No results" : "All selected"}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Selected chips */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedOptions.map((opt) => (
            <MoleculeTag
              key={opt.value}
              label={opt.label}
              onRemove={() => handleRemove(opt.value)}
              color={EBadgeColor.primary}
              size={EBadgeSize.small}
              removable
            />
          ))}
        </div>
      )}

      {hintText && (
        <div className="flex items-center mt-1 gap-1">
          <Icon
            color={error ? "text-danger-600" : "text-gray-600"}
            name={IconComponentsEnum.info}
            size="text-large"
          />
          <Label
            color={error ? "text-danger-600" : "text-gray-600"}
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

export default MoleculeMultiSelect;