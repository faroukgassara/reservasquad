import { twMerge } from "tailwind-merge";
import { ESize, EStatus, Ebadge } from "@/Enum/Enum";
import IAtomAvatar from "@/interfaces/Atoms/IAtomAvatar/IAtomAvatar";

const sizeMap: Record<ESize, { root: string; text: string; dot: string; badge: string }> = {
  xs: { root: "h-6 w-6", text: "text-[10px]", dot: "h-2 w-2", badge: "h-2.5 w-2.5" },
  sm: { root: "h-8 w-8", text: "text-xs", dot: "h-2.5 w-2.5", badge: "h-3 w-3" },
  md: { root: "h-10 w-10", text: "text-sm", dot: "h-3 w-3", badge: "h-3.5 w-3.5" },
  lg: { root: "h-12 w-12", text: "text-base", dot: "h-3.5 w-3.5", badge: "h-4 w-4" },
  xl: { root: "h-16 w-16", text: "text-lg", dot: "h-4 w-4", badge: "h-5 w-5" },
};

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export default function AtomAvatar({
  id,
  src,
  alt,
  name,
  size = ESize.md,
  variant = "circle",
  ring = false,
  status = EStatus.none,
  badge,
  stacked = false,
  className,
}: IAtomAvatar) {
  const s = sizeMap[size];
  const shapeClass = variant === "circle" ? "rounded-full" : "rounded-md";

  const showGreenActiveDot = status === EStatus.online;
  const showPurpleBadge = badge === Ebadge.purple;

  return (
    <div
        className={twMerge(
            ['relative inline-flex', className].filter((c): c is string => Boolean(c)).join(' '),
        )}
    >
      <div
        id={id}
        className={twMerge(
          [
            "relative grid place-items-center overflow-hidden bg-gray-100 text-gray-600",
            s.root,
            shapeClass,
            ring && "ring-2 ring-violet-200",
            stacked && "ring-2 ring-white",
          ]
            .filter((c): c is string => Boolean(c))
            .join(' '),
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt ?? name ?? "Avatar"}
            className={twMerge(
              ['h-full w-full object-cover', shapeClass]
                .filter((c): c is string => Boolean(c))
                .join(' '),
            )}
            draggable={false}
          />
        ) : (
          <span
            className={twMerge(
              ['font-medium', s.text].filter((c): c is string => Boolean(c)).join(' '),
            )}
          >
            {getInitials(name)}
          </span>
        )}
      </div>


      {showGreenActiveDot && (
        <span
          className={twMerge(
            [
              'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
              s.dot,
              'bg-emerald-500',
            ].join(' '),
          )}
        />
      )}


      {showPurpleBadge && (
        <span
          className={twMerge(
            [
              'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
              s.badge,
              'bg-violet-500',
            ].join(' '),
          )}
        />
      )}
    </div>
  );
}
