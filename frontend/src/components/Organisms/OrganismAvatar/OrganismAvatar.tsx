import React from "react";
import { twMerge } from "tailwind-merge";
import AtomAvatar from "../../Atoms/AtomAvatar/AtomAvatar";
import { ESize } from "@/Enum/Enum";
import IOrganismAvatar from "@/interfaces/Organisms/IOrganismAvatar/IOrganismAvatar";


const overlapMap: Record<ESize, string> = {
  xs: "-space-x-1.5",
  sm: "-space-x-2",
  md: "-space-x-2.5",
  lg: "-space-x-3",
  xl: "-space-x-3.5",
};

export default function OrganismAvatar({
  items,
  size = ESize.md,
  max = 5,
  className,
}: IOrganismAvatar) {
  const visible = items.slice(0, max);
  const remaining = Math.max(0, items.length - visible.length);

  return (
    <div
      className={twMerge(
        ['flex items-center', overlapMap[size], className]
          .filter((c): c is string => Boolean(c))
          .join(' '),
      )}
    >
      {visible.map((avatar) => (
        <AtomAvatar
          key={avatar.id}      
          {...avatar}            
          size={size}          
          ring={false}       
          stacked={true}       
          className=""
        />
      ))}
      
      {remaining > 0 && (
        <div
          className={twMerge(
            [
              'grid place-items-center rounded-full bg-primary-50 text-primary-700 ring-2 ring-white font-semibold',
              size === 'xs' && 'h-6 w-6 text-[10px]',
              size === 'sm' && 'h-8 w-8 text-xs',
              size === 'md' && 'h-10 w-10 text-sm',
              size === 'lg' && 'h-12 w-12 text-base',
              size === 'xl' && 'h-16 w-16 text-lg',
            ]
              .filter((c): c is string => Boolean(c))
              .join(' '),
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}