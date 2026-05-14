import React from "react";
import { twMerge } from "tailwind-merge";
import AtomBadge from "@/components/Atoms/AtomBadge/AtomBadge";
import type IMoleculeTag from "@/interfaces/Molecules/IMoleculeTag/IMoleculeTag";
import { EBadgeColor, EBadgeSize } from "@/Enum/Enum";
import AtomButton from "@/components/Atoms/AtomButton/AtomButton";

const MoleculeTag = ({
  label,
  onRemove,
  color = EBadgeColor.gray,
  size = EBadgeSize.small,
  className = "",
  badgeClassName = "",
  removable,
}: IMoleculeTag) => {
  const canRemove = removable ?? !!onRemove;

  return (
    <div className={twMerge("inline-flex", className)}>
      <AtomBadge
        text={label}
        color={color}
        size={size}
        className={twMerge("pr-1", badgeClassName)} 
        rightSlot={
          canRemove ? (
            <AtomButton 
              id={`button-${label ?? 'text'}`}
              aria-label={`Remove ${label}`}
              onClick={() => onRemove?.(label)}
              className={twMerge(
                "ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full",
                "opacity-70 hover:opacity-100",
                "focus:outline-none focus:ring-2 focus:ring-offset-1"
              )}
            >
              <span className="text-xs leading-none">×</span>
            </AtomButton>
          ) : null
        }
      />
    </div>
  );
};

export default MoleculeTag;
