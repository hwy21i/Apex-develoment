import React from "react";

type StatusTone = "solid" | "subtle" | "dashed" | "inverted" | "muted";

const toneFor = (value: string): StatusTone => {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("complete") ||
    normalized.includes("track") ||
    normalized.includes("paid") ||
    normalized.includes("verified") ||
    normalized.includes("active")
  ) {
    return "solid";
  }
  if (
    normalized.includes("progress") ||
    normalized.includes("approved") ||
    normalized.includes("planning")
  ) {
    return "subtle";
  }
  if (
    normalized.includes("hold") ||
    normalized.includes("risk") ||
    normalized.includes("low") ||
    normalized.includes("pending")
  ) {
    return "dashed";
  }
  if (
    normalized.includes("delay") ||
    normalized.includes("critical") ||
    normalized.includes("block") ||
    normalized.includes("discrepancy") ||
    normalized.includes("cancelled")
  ) {
    return "inverted";
  }
  return "muted";
};

// Strict Monochrome Status Badges distinguished by typography, borders, and geometry
const styles: Record<StatusTone, { badge: string; dot: string }> = {
  solid: {
    badge:
      "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold",
    dot: "bg-[#FFFFFF] dark:bg-[#000000]",
  },
  subtle: {
    badge:
      "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
    dot: "bg-[#000000] dark:bg-[#FFFFFF]",
  },
  dashed: {
    badge:
      "bg-transparent text-[#666666] dark:text-[#A3A3A3] border border-dashed border-[#D4D4D4] dark:border-[#303030]",
    dot: "border border-current bg-transparent",
  },
  inverted: {
    badge:
      "bg-[#F0F0F0] dark:bg-[#1F1F1F] text-[#000000] dark:text-[#FFFFFF] border border-[#000000] dark:border-[#FFFFFF] font-mono",
    dot: "bg-[#000000] dark:bg-[#FFFFFF]",
  },
  muted: {
    badge:
      "bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]",
    dot: "bg-[#A3A3A3] dark:bg-[#666666]",
  },
};

export function StatusBadge({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const tone = toneFor(value);
  const cfg = styles[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] tracking-wide capitalize shadow-2xs transition-colors ${cfg.badge} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span>{value.replaceAll("_", " ").replaceAll("-", " ")}</span>
    </span>
  );
}

export default StatusBadge;
