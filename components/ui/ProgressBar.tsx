export function ProgressBar({ value, tone = "amber", className = "" }: { value: number; tone?: "amber" | "sky" | "emerald" | "rose"; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const colors = { amber: "bg-amber-500", sky: "bg-sky-500", emerald: "bg-emerald-500", rose: "bg-rose-500" };
  return <div className={`h-1.5 overflow-hidden rounded-full bg-slate-100 ${className}`}><div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${safeValue}%` }} /></div>;
}
