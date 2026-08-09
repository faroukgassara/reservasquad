import IProgressBar from "@/interfaces/IPrimitives/IProgressBar/IProgressBar";
import { twMerge } from "tailwind-merge";

export default function ProgressBar({ value, className, showPercent = true }: Readonly<IProgressBar>) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className={twMerge("flex items-center gap-3", className)}>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${safe}%` }} />
      </div>
      {showPercent && <span className="text-sm text-gray-700">{safe}%</span>}
    </div>
  );
}
