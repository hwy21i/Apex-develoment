import React from "react";

type StatusTone = "green" | "blue" | "amber" | "red" | "slate";

const toneFor = (value: string): StatusTone => {
  const normalized = value.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("track") || normalized.includes("paid") || normalized.includes("verified")) return "green";
  if (normalized.includes("delay") || normalized.includes("critical") || normalized.includes("block") || normalized.includes("discrepancy")) return "red";
  if (normalized.includes("hold") || normalized.includes("risk") || normalized.includes("low") || normalized.includes("pending")) return "amber";
  if (normalized.includes("active") || normalized.includes("progress") || normalized.includes("planning") || normalized.includes("approved")) return "blue";
  return "slate";
};

// Restrained architectural status badges aligned with the steel/slate palette
const styles: Record<StatusTone, string> = {
  green: "bg-[#2E4156]/40 dark:bg-[#2E4156] text-[#A8C5B5] dark:text-[#A8C5B5] border border-[#6E9E88]/40",
  blue: "bg-[#2E4156]/50 dark:bg-[#1A2D42] text-[#D4D8DD] dark:text-[#C0C8CA] border border-[#AAB7B7]/40",
  amber: "bg-[#2E4156]/30 dark:bg-[#2E4156] text-[#D5BC95] dark:text-[#D5BC95] border border-[#C49F6A]/40",
  red: "bg-[#2E4156]/40 dark:bg-[#2E4156] text-[#D29F9F] dark:text-[#D29F9F] border border-[#B56B6B]/40",
  slate: "bg-[#C0C8CA]/40 dark:bg-[#2E4156] text-[#1A2D42] dark:text-[#D4D8DD] border border-[#AAB7B7]/30",
};

export function StatusBadge({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide capitalize ${styles[toneFor(value)]} ${className}`}
    >
      {value.replaceAll("_", " ").replaceAll("-", " ")}
    </span>
  );
}
