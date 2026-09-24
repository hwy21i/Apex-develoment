type StatusTone = "green" | "blue" | "amber" | "red" | "slate";

const toneFor = (value: string): StatusTone => {
  const normalized = value.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("track") || normalized.includes("paid")) return "green";
  if (normalized.includes("delay") || normalized.includes("critical") || normalized.includes("block")) return "red";
  if (normalized.includes("hold") || normalized.includes("risk") || normalized.includes("low")) return "amber";
  if (normalized.includes("active") || normalized.includes("progress") || normalized.includes("planning")) return "blue";
  return "slate";
};

const styles: Record<StatusTone, string> = {
  green: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800/40",
  blue: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-sky-200 dark:ring-sky-800/40",
  amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-amber-200 dark:ring-amber-800/40",
  red: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800/40",
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700",
};

export function StatusBadge({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ${styles[toneFor(value)]} ${className}`}
    >
      {value.replaceAll("_", " ").replaceAll("-", " ")}
    </span>
  );
}
