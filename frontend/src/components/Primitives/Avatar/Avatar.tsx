import { twMerge } from "tailwind-merge";
import { ESize } from "@/Enum/Enum";
import IAvatar from "@/interfaces/IPrimitives/IAvatar/IAvatar";
import { CommonFunction } from "@/common/Function/Function";
import { AVATAR_SIZE_MAP } from "@/common/Data/Data";

export default function Avatar({
  id,
  name,
  size = ESize.md,
  className,
  email,
}: Readonly<IAvatar>) {
  const s = AVATAR_SIZE_MAP[size];

  const withLabel = email !== undefined;

  const avatarNode = (
    <div
      className={twMerge(
        [
          'relative inline-flex',
          withLabel ? '' : className,
        ].filter((c): c is string => Boolean(c)).join(' '),
      )}
    >
      <div
        id={id}
        className={twMerge(
          [
            "ring-2 ring-primary-900/20 relative grid place-items-center overflow-hidden bg-gray-100 text-gray-600 rounded-full",
            s.root,
          ]
            .filter((c): c is string => Boolean(c))
            .join(' '),
        )}
      >
        <span
          className={twMerge(
            ['font-medium', s.text].filter((c): c is string => Boolean(c)).join(' '),
          )}
        >
          {CommonFunction.getInstance().getInitials(name)}
        </span>
      </div>
    </div>
  );

  if (withLabel) {
    return (
      <div className={twMerge(['flex items-center gap-3', className].filter((c): c is string => Boolean(c)).join(' '))}>
        {avatarNode}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">{name}</div>
          {email && <div className="truncate text-xs text-gray-500">{email}</div>}
        </div>
      </div>
    );
  }

  return avatarNode;
}
