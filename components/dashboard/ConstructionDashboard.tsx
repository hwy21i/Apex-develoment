"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Banknote, Boxes, Building2, ClipboardList, MapPin, Plus, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Project = { id: string; name: string; projectCode: string; client: string; location: string; manager: string; budget: number; progress: number; status: string; health: string };
type DashboardData = {
  projects: { active: number; total: number; items: Project[] };
  financial: { budget: number; expenses: number; remaining: number; committedCost: number; budgetUsedPercentage: number };
  tasks: { completed: number; inProgress: number; overdue: number; items: Array<{ id: string; title: string; projectName: string; assignedTo: string; status: string; progress: number; dueDate?: string }> };
  materials: { lowStockCount: number; items: Array<{ id: string; name: string; unit: string; currentStock: number; minimumStock: number; status: string }> };
  overallProgress: number;
};

const dateText = (value?: string) => value ? new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "Not scheduled";

function Kpi({ label, value, detail, icon: Icon, tone = "amber" }: { label: string; value: string; detail: string; icon: typeof Building2; tone?: "amber" | "sky" | "green" | "slate" }) {
  const colors = { amber: "bg-blue-50 text-blue-700", sky: "bg-sky-50 text-sky-700", green: "bg-emerald-50 text-emerald-700", slate: "bg-slate-100 text-slate-600" };
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span></div><p className="mt-3 text-xs text-slate-500">{detail}</p></section>;
}

export default function ConstructionDashboard({ userName = "there", onCreate }: { userName?: string; onCreate?: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to load dashboard");
      if (active) setData(result.data);
    }).catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "Unable to load dashboard"));
    return () => { active = false; };
  }, []);

  if (error) return <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800"><h1 className="font-semibold">Dashboard data is unavailable</h1><p className="mt-1 text-sm">{error}</p></section>;
  if (!data) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-200" />)}</div>;
  const budgetUsed = Math.min(100, Math.max(0, data.financial.budgetUsedPercentage));
  const portfolio = data.projects.items.slice(0, 6);

  return <div className="dashboard-reference mx-auto max-w-[1540px] space-y-5">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Construction operations center</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Good day, {userName.split(" ")[0]}.</h1><p className="mt-2 text-sm text-slate-500">Live delivery, cost, material, and site coordination for your accessible portfolio.</p></div>{onCreate ? <button onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-blue-500"><Plus className="h-4 w-4" />New project</button> : <Link href="/projects/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-blue-500"><Plus className="h-4 w-4" />New project</Link>}</header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Total projects" value={String(data.projects.total)} detail={`${data.projects.active} actively executing`} icon={Building2} /><Kpi label="Overall progress" value={`${data.overallProgress}%`} detail={`${data.tasks.completed} tasks completed`} icon={TrendingUp} tone="sky" /><Kpi label="Approved budget" value={formatCurrency(data.financial.budget, true)} detail={`${budgetUsed}% utilized`} icon={Banknote} tone="green" /><Kpi label="Active tasks" value={String(data.tasks.inProgress)} detail={`${data.tasks.overdue} require attention`} icon={ClipboardList} tone="slate" /></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.8fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]"><div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Active projects</h2><p className="mt-1 text-xs text-slate-500">Portfolio progress, responsibility, and site location.</p></div><Link href="/projects" className="text-xs font-bold text-blue-700">View all <ArrowUpRight className="inline h-3.5 w-3.5" /></Link></div><div className="overflow-x-auto"><table className="min-w-[850px] w-full text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3">Project</th><th className="px-3 py-3">Manager</th><th className="px-3 py-3">Budget</th><th className="px-3 py-3">Progress</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{portfolio.map((project) => <tr key={project.id} className="border-t border-slate-100 text-sm"><td className="px-5 py-4"><Link href={`/projects/${project.id}/overview`} className="font-semibold text-slate-800 hover:text-blue-700">{project.name}</Link><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{project.projectCode} · {project.client} · {project.location}</p></td><td className="px-3 py-4 text-xs text-slate-600">{project.manager}</td><td className="px-3 py-4 text-xs font-semibold text-slate-700">{formatCurrency(project.budget, true)}</td><td className="px-3 py-4"><div className="min-w-28"><div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500"><span>Complete</span><span>{project.progress}%</span></div><ProgressBar value={project.progress} /></div></td><td className="px-5 py-4"><StatusBadge value={project.health || project.status} /></td><td className="px-5 py-4 text-right"><Link href={`/projects/${project.id}/overview`} className="text-xs font-bold text-blue-700 hover:text-blue-800">View</Link></td></tr>)}{portfolio.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No accessible projects yet.</td></tr>}</tbody></table></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Budget summary</h2><p className="mt-1 text-xs text-slate-500">ETB portfolio position.</p></div><span className="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-800 ring-4 ring-blue-100">{budgetUsed}%</span></div><div className="mt-7"><ProgressBar value={budgetUsed} className="h-3" /><div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-500"><span>Used</span><span>{budgetUsed}% of approved budget</span></div></div><dl className="mt-6 space-y-4 text-sm"><BudgetRow label="Total budget" value={formatCurrency(data.financial.budget, true)} /><BudgetRow label="Actual spent" value={formatCurrency(data.financial.expenses, true)} /><BudgetRow label="Committed" value={formatCurrency(data.financial.committedCost, true)} /><BudgetRow label="Available balance" value={formatCurrency(data.financial.remaining, true)} strong /></dl></section>
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Current construction activity</h2><p className="mt-1 text-xs text-slate-500">Tasks requiring site coordination.</p></div><Link href="/tasks" className="text-xs font-bold text-blue-700">Task board</Link></div><div className="mt-4 divide-y divide-slate-100">{data.tasks.items.slice(0, 5).map((task) => <div key={task.id} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{task.title}</p><p className="mt-1 truncate text-xs text-slate-500">{task.projectName} · {task.assignedTo}{task.dueDate ? ` · Due ${dateText(task.dueDate)}` : ""}</p></div><div className="flex min-w-24 items-center gap-2"><ProgressBar value={task.progress} tone="sky" className="w-16" /><span className="text-[11px] font-bold text-slate-600">{task.progress}%</span></div><StatusBadge value={task.status} /></div>)}{data.tasks.items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No active tasks available.</p>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Material inventory</h2><p className="mt-1 text-xs text-slate-500">{data.materials.lowStockCount} low-stock materials.</p></div><Boxes className="h-5 w-5 text-blue-600" /></div><div className="mt-4 space-y-4">{data.materials.items.slice(0, 5).map((material) => { const level = material.minimumStock ? Math.min(100, Math.round(material.currentStock / material.minimumStock * 100)) : 100; const low = material.status === "LOW_STOCK"; return <div key={material.id}><div className="flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{material.name}</span><span className={low ? "font-bold text-rose-600" : "text-slate-500"}>{material.currentStock} {material.unit}</span></div><div className="mt-1.5 flex items-center gap-2"><ProgressBar value={level} tone={low ? "rose" : "emerald"} className="flex-1" /><span className="text-[10px] text-slate-400">Min {material.minimumStock}</span></div></div>; })}{data.materials.items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No material records available.</p>}</div></section>
    </div>
  </div>;
}

function BudgetRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className={strong ? "font-bold text-emerald-700" : "font-semibold text-slate-800"}>{value}</dd></div>; }
