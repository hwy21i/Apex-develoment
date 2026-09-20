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
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function StatusBadge({ value, className = "" }: { value: string; className?: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ${styles[toneFor(value)]} ${className}`}>{value.replaceAll("_", " ").replaceAll("-", " ")}</span>;
}
