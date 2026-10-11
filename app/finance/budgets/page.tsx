"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Loader2, X, PieChart,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

type BudgetStatus = "On Track" | "Near Limit" | "Exceeded";

interface BudgetAllocation {
  _id: string;
  budgetCode: string;
  projectId: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  committedAmount: number;
  remainingAmount: number;
  variancePct: number;
  status: BudgetStatus;
  fiscalYear: string;
  startDate: string;
  endDate: string;
}

const STATUS_BADGES: Record<string, string> = {
  "On Track": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  "Near Limit": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  Exceeded: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
};

const STATUSES: BudgetStatus[] = ["On Track", "Near Limit", "Exceeded"];

function deriveStatus(variancePct: number): BudgetStatus {
  if (variancePct > 100) return "Exceeded";
  if (variancePct > 80) return "Near Limit";
  return "On Track";
}

function mapRecord(r: OperationalRecord): BudgetAllocation {
  const d = r.data || {};
  const allocatedAmount = Number(d.totalAmount ?? d.allocatedAmount) || 0;
  const spentAmount = Number(d.spentAmount) || 0;
  const committedAmount = Number(d.committedAmount) || 0;
  const remainingAmount = allocatedAmount - spentAmount - committedAmount;
  const variancePct =
    allocatedAmount > 0
      ? Math.round(((spentAmount + committedAmount) / allocatedAmount) * 1000) / 10
      : 0;
  const raw = r.status || d.status;
  const status: BudgetStatus =
    raw === "Exceeded" || raw === "Near Limit" || raw === "On Track"
      ? raw
      : deriveStatus(variancePct);
  const startDate = d.startDate || "";
  return {
    _id: r._id,
    budgetCode: d.budgetCode || r.title || r._id.slice(-6),
    projectId: r.projectId,
    category: d.category || d.description || "General",
    allocatedAmount,
    spentAmount,
    committedAmount,
    remainingAmount,
    variancePct,
    status,
    fiscalYear:
      d.fiscalYear || (startDate ? String(new Date(startDate).getFullYear()) : "—"),
    startDate,
    endDate: d.endDate || "",
  };
}

const EMPTY_FORM = {
  projectId: "",
  budgetCode: "",
  category: "",
  totalAmount: "",
  spentAmount: "",
  committedAmount: "",
  startDate: "",
  endDate: "",
  fiscalYear: "",
  status: "On Track" as BudgetStatus,
};

export default function FinanceBudgetsPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("budgets");
  const budgets = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = budgets.filter((b) => {
    const matchSearch =
      b.budgetCode.toLowerCase().includes(search.toLowerCase()) ||
      projectName(b.projectId).toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const totalCommitted = budgets.reduce((acc, b) => acc + b.committedAmount, 0);
  const totalRemaining = budgets.reduce((acc, b) => acc + b.remainingAmount, 0);

  const fmt = (n: number) => formatCurrency(n);

  const openForm = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?._id || "" });
    setFormError(null);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.projectId) {
      setFormError("Please select a project.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.budgetCode || undefined,
        status: form.status,
        data: {
          budgetCode: form.budgetCode || undefined,
          category: form.category,
          totalAmount: Number(form.totalAmount) || 0,
          spentAmount: Number(form.spentAmount) || 0,
          committedAmount: Number(form.committedAmount) || 0,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          fiscalYear: form.fiscalYear || undefined,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create budget line");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 focus:outline-none focus:border-[#C0C8CA]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C0C8CA] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <PieChart className="w-4 h-4" /> Capital Allocation &amp; Controls
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#D4D8DD] tracking-tight">
              Project Budgets &amp; CSI Divisions
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#AAB7B7] mt-1">
              Track allocated capital, committed purchase orders, actual expenditures, and cost variance
            </p>
          </div>
          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#C0C8CA] hover:bg-white text-[#1A2D42] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-black/10 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} />
            <span>New Budget Line</span>
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/25 bg-white dark:bg-[#2E4156]/30 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#AAB7B7] font-medium">Total Capital Allocated</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-[#D4D8DD] mt-1">{fmt(totalAllocated)}</p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/25 bg-white dark:bg-[#2E4156]/30 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#AAB7B7] font-medium">Actual Expenditures</p>
            <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">{fmt(totalSpent)}</p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/25 bg-white dark:bg-[#2E4156]/30 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#AAB7B7] font-medium">Committed (POs/Contracts)</p>
            <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{fmt(totalCommitted)}</p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/25 bg-white dark:bg-[#2E4156]/30 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#AAB7B7] font-medium">Net Uncommitted Balance</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{fmt(totalRemaining)}</p>
          </div>
        </div>

        {/* Search & filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAB7B7]" />
            <input
              type="text"
              placeholder="Filter by project or work breakdown category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#1A2D42]/80 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 outline-none focus:border-[#C0C8CA] shadow-xs transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#1A2D42]/80 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-[#D4D8DD] focus:outline-none focus:border-[#C0C8CA]"
          >
            <option value="All">All Statuses</option>
            <option value="On Track">On Track</option>
            <option value="Near Limit">Near Limit (&gt;80%)</option>
            <option value="Exceeded">Exceeded (&gt;100%)</option>
          </select>
        </div>

        {/* Budget list */}
        <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/20 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={24} className="animate-spin text-[#C0C8CA]" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-rose-500">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-semibold text-[#C0C8CA] hover:underline">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <PieChart size={32} className="mx-auto mb-2 opacity-40 text-[#C0C8CA]" />
              <p className="text-sm">
                {budgets.length === 0 ? "No budget lines recorded yet." : "No budgets match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-[#1A2D42]/90 text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-[#AAB7B7]/20">
                  <tr>
                    <th className="px-5 py-3">Project &amp; WBS Category</th>
                    <th className="px-5 py-3">FY</th>
                    <th className="px-5 py-3 text-right">Allocated</th>
                    <th className="px-5 py-3 text-right">Spent</th>
                    <th className="px-5 py-3 text-right">Committed</th>
                    <th className="px-5 py-3 text-right">Remaining</th>
                    <th className="px-5 py-3 w-36">Burn Rate</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#AAB7B7]/15">
                  {filtered.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70 dark:hover:bg-[#2E4156]/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-slate-900 dark:text-[#D4D8DD] font-bold">{projectName(b.projectId)}</span>
                        <p className="text-slate-500 dark:text-[#AAB7B7] text-[11px] mt-0.5">
                          <span className="font-mono text-[#C0C8CA] font-semibold">{b.budgetCode}</span>
                          {b.budgetCode && " · "}
                          {b.category}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-[#D4D8DD] font-mono text-[11px]">{b.fiscalYear}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-[#D4D8DD]">{fmt(b.allocatedAmount)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-[#D4D8DD]">{fmt(b.spentAmount)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-500 dark:text-[#AAB7B7]">{fmt(b.committedAmount)}</td>
                      <td className={`px-5 py-3.5 text-right font-mono font-bold ${b.remainingAmount < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {fmt(b.remainingAmount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-full bg-slate-200 dark:bg-[#1A2D42] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              b.variancePct > 100
                                ? "bg-rose-500"
                                : b.variancePct > 80
                                ? "bg-amber-500"
                                : "bg-[#C0C8CA]"
                            }`}
                            style={{ width: `${Math.min(b.variancePct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-[#AAB7B7] font-mono mt-1 block">{b.variancePct}% used</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGES[b.status] || STATUS_BADGES["On Track"]}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2E4156] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#2E4156] text-[#C0C8CA] border border-[#AAB7B7]/25">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-[#D4D8DD]">New Budget Line</h2>
                  <p className="text-xs text-slate-500 dark:text-[#AAB7B7]">Allocate budget by CSI work breakdown</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#AAB7B7] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Project *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Budget code</label>
                  <input className={inputCls} value={form.budgetCode} onChange={(e) => setForm({ ...form, budgetCode: e.target.value })} placeholder="CSI-03-CONC" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">WBS category / description</label>
                  <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Substructure & Concrete" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Total allocated (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Spent to date (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.spentAmount} onChange={(e) => setForm({ ...form, spentAmount: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Committed (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.committedAmount} onChange={(e) => setForm({ ...form, committedAmount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Start date</label>
                  <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">End date</label>
                  <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Fiscal year</label>
                  <input className={inputCls} value={form.fiscalYear} onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })} placeholder="2023/24" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BudgetStatus })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-rose-500 font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#2E4156]">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-700 dark:text-[#D4D8DD] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C0C8CA] hover:bg-white text-[#1A2D42] text-xs font-bold shadow-md transition-all disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Create Budget Line
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
