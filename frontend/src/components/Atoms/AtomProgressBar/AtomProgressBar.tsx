import IAtomProgressBar from "@/interfaces/Atoms/IAtomProgressBar/IAtomProgressBar";

import React from "react";
import { twMerge } from "tailwind-merge";



export default function AtomProgressBar({ value, className, showPercent = true }: IAtomProgressBar) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className={twMerge("flex items-center gap-3", className)}>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-primary-600" style={{ width: `${safe}%` }} />
      </div>
      {showPercent && <span className="text-sm text-gray-700">{safe}%</span>}
    </div>
  );
}
