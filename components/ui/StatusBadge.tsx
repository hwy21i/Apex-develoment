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

// Monochrome status badges with subtle dot indicators
const styles: Record<StatusTone, { badge: string; dot: string }> = {
  green: {
    badge: "bg-[#F3F4F6] dark:bg-[#1F1F1F] text-[#111827] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2A2A]",
    dot: "bg-[#10B981]",
  },
  blue: {
    badge: "bg-[#F3F4F6] dark:bg-[#1F1F1F] text-[#111827] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2A2A]",
    dot: "bg-[#6B7280] dark:bg-[#A1A1A1]",
  },
  amber: {
    badge: "bg-[#F3F4F6] dark:bg-[#1F1F1F] text-[#111827] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2A2A]",
    dot: "bg-[#F59E0B]",
  },
  red: {
    badge: "bg-[#FEF2F2] dark:bg-[#2A1515] text-[#991B1B] dark:text-[#FCA5A5] border border-[#FECACA] dark:border-[#5C2323]",
    dot: "bg-[#EF4444]",
  },
  slate: {
    badge: "bg-[#F3F4F6] dark:bg-[#1F1F1F] text-[#6B7280] dark:text-[#A1A1A1] border border-[#E5E7EB] dark:border-[#2A2A2A]",
    dot: "bg-[#9CA3AF] dark:bg-[#777777]",
  },
};

export function StatusBadge({ value, className = "" }: { value: string; className?: string }) {
  const tone = toneFor(value);
  const cfg = styles[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide capitalize shadow-2xs ${cfg.badge} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span>{value.replaceAll("_", " ").replaceAll("-", " ")}</span>
    </span>
  );
}
