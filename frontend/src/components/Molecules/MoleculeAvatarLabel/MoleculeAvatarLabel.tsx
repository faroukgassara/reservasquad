import React from "react";
import { twMerge } from "tailwind-merge";
import AtomAvatar from "../../Atoms/AtomAvatar/AtomAvatar";
import { ESize, EStatus } from "@/Enum/Enum";
import IMoleculeAvatarLabel from "@/interfaces/Molecules/IMoleculeAvatarLabel/IMoleculeAvatarLabel";


export default function MoleculeAvatarLabel({
  id,
  src,
  name,
  email,
  size = ESize.md,
  status = EStatus.none,
  className,
}: IMoleculeAvatarLabel) {
  return (
    <div
      className={twMerge(
        ['flex items-center gap-3', className]
          .filter((c): c is string => Boolean(c))
          .join(' '),
      )}
    >
      <AtomAvatar id={id} src={src} name={name} size={size} status={status} ring />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-gray-900">{name}</div>
        {email && <div className="truncate text-xs text-gray-500">{email}</div>}
      </div>
    </div>
  );
}
