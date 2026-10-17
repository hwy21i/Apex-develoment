import React from "react";

export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  tone?: "steel" | "cool" | "light" | "amber" | "sky" | "emerald" | "rose";
  className?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#2A2A2A] ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-300 bg-[#111111] dark:bg-[#FFFFFF]"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
