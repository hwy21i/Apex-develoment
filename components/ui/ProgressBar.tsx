import React from "react";

export function ProgressBar({
  value,
  tone = "steel",
  className = "",
}: {
  value: number;
  tone?: "steel" | "cool" | "light" | "amber" | "sky" | "emerald" | "rose";
  className?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const colors: Record<string, string> = {
    steel: "bg-[#2E4156] dark:bg-[#C0C8CA]",
    cool: "bg-[#C0C8CA]",
    light: "bg-[#D4D8DD]",
    amber: "bg-[#C0C8CA] dark:bg-[#D4D8DD]",
    sky: "bg-[#AAB7B7]",
    emerald: "bg-[#A8C5B5]",
    rose: "bg-[#D29F9F]",
  };
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-[#AAB7B7]/30 dark:bg-[#1A2D42] ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${colors[tone] || colors.steel}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
