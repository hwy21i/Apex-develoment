"use client";

import { useState, useEffect } from "react";
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
  "On Track": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "Near Limit": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Exceeded: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
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

  // Auto-select first accessible project if none selected yet
  useEffect(() => {
    if (projects.length > 0 && !form.projectId) {
      setForm((prev) => ({ ...prev, projectId: projects[0]._id }));
    }
  }, [projects, form.projectId]);

  const filtered = budgets.filter((b) => {
    const matchSearch =
      b.budgetCode.toLowerCase().includes(search.toLowerCase()) ||
      projectName(b.projectId).toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const hasLineItems = budgets.length > 0;
  const projectTotalAllocated = projects.reduce((acc, p) => acc + (p.budget ?? p.totalBudget ?? 0), 0);
  const projectTotalSpent = projects.reduce((acc, p) => acc + (p.amountSpent ?? 0), 0);
  const projectTotalCommitted = projects.reduce((acc, p) => acc + (p.committedCost ?? 0), 0);
  const projectTotalRemaining = projects.reduce((acc, p) => acc + (p.remainingBudget ?? 0), 0);

  const totalAllocated = hasLineItems
    ? budgets.reduce((acc, b) => acc + b.allocatedAmount, 0)
    : projectTotalAllocated;
  const totalSpent = hasLineItems
    ? budgets.reduce((acc, b) => acc + b.spentAmount, 0)
    : projectTotalSpent;
  const totalCommitted = hasLineItems
    ? budgets.reduce((acc, b) => acc + b.committedAmount, 0)
    : projectTotalCommitted;
  const totalRemaining = hasLineItems
    ? budgets.reduce((acc, b) => acc + b.remainingAmount, 0)
    : projectTotalRemaining;

  const fmt = (n: number) => formatCurrency(n);

  const openForm = () => {
    setForm({ ...EMPTY_FORM, projectId: form.projectId || projects[0]?._id || "" });
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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <PieChart className="w-4 h-4" /> Capital Allocation &amp; Controls
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Project Budgets &amp; CSI Divisions
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Track allocated capital, committed purchase orders, actual expenditures, and cost variance
            </p>
          </div>
          <button
            onClick={openForm}
            className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] shrink-0"
          >
            <Plus size={16} />
            <span>New Budget Line</span>
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">Total Capital Allocated</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalAllocated)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">Actual Expenditures</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalSpent)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">Committed (POs/Contracts)</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalCommitted)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">Net Uncommitted Balance</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalRemaining)}</p>
          </div>
        </div>

        {/* Search & filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Filter by project or work breakdown category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          >
            <option value="All">All Statuses</option>
            <option value="On Track">On Track</option>
            <option value="Near Limit">Near Limit (&gt;80%)</option>
            <option value="Exceeded">Exceeded (&gt;100%)</option>
          </select>
        </div>

        {/* Budget list */}
        <div className="glass-card border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#888888] dark:text-[#888888]">
              <Loader2 size={24} className="animate-spin text-[#666666] dark:text-[#A3A3A3]" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#000000] dark:text-[#FFFFFF]">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:underline">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            budgets.length === 0 && projects.length > 0 ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
                  <div>
                    <h3 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                      Portfolio Project Budgets Overview
                    </h3>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                      Aggregated from active construction project contracts. Click &quot;New Budget Line&quot; to break down by CSI divisions.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
                      <tr>
                        <th className="px-4 py-2.5">Project Name</th>
                        <th className="px-4 py-2.5 text-right">Total Contract Budget</th>
                        <th className="px-4 py-2.5 text-right">Actual Spent</th>
                        <th className="px-4 py-2.5 text-right">Committed POs</th>
                        <th className="px-4 py-2.5 text-right">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                      {projects.map((p) => (
                        <tr key={p._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F]">
                          <td className="px-4 py-3 font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {p.name}
                            {p.projectCode && (
                              <span className="block text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                                {p.projectCode}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-right font-semibold text-[#000000] dark:text-[#FFFFFF]">
                            {fmt(p.budget ?? p.totalBudget ?? 0)}
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-[#666666] dark:text-[#A3A3A3]">
                            {fmt(p.amountSpent ?? 0)}
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-[#666666] dark:text-[#A3A3A3]">
                            {fmt(p.committedCost ?? 0)}
                          </td>
                          <td className="px-4 py-3 font-mono text-right font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {fmt(p.remainingBudget ?? 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-[#888888] dark:text-[#888888]">
                <PieChart size={32} className="mx-auto mb-2 opacity-40 text-[#666666] dark:text-[#A3A3A3]" />
                <p className="text-sm">
                  {budgets.length === 0 ? "No budget lines recorded yet." : "No budgets match your filters."}
                </p>
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717]/80 dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
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
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030] dark:divide-[#303030]">
                  {filtered.map((b) => (
                    <tr key={b._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-[#000000] dark:text-[#FFFFFF] font-bold">{projectName(b.projectId)}</span>
                        <p className="text-[#666666] dark:text-[#A3A3A3] text-[11px] mt-0.5">
                          <span className="font-mono text-[#666666] dark:text-[#A3A3A3] font-semibold">{b.budgetCode}</span>
                          {b.budgetCode && " · "}
                          {b.category}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3] dark:text-[#FFFFFF] font-mono text-[11px]">{b.fiscalYear}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">{fmt(b.allocatedAmount)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-[#000000] dark:text-[#FFFFFF]">{fmt(b.spentAmount)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-[#666666] dark:text-[#A3A3A3]">{fmt(b.committedAmount)}</td>
                      <td className={`px-5 py-3.5 text-right font-mono font-bold ${b.remainingAmount < 0 ? "text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF]" : "text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF]"}`}>
                        {fmt(b.remainingAmount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-full bg-[#E5E5E5] dark:bg-[#303030] dark:bg-[#111111] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              b.variancePct > 100
                                ? "bg-black/5 dark:bg-white/10"
                                : b.variancePct > 80
                                ? "bg-black/5 dark:bg-white/10"
                                : "bg-[#000000] dark:bg-[#FFFFFF]"
                            }`}
                            style={{ width: `${Math.min(b.variancePct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#666666] dark:text-[#A3A3A3] font-mono mt-1 block">{b.variancePct}% used</span>
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
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4 sm:p-6 flex items-center justify-center bg-black/70 backdrop-blur-xs animate-v18-backdrop">
          <div className="my-auto max-h-[88vh] flex flex-col overflow-hidden w-full erp-modal-md v18-card bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl shadow-2xl animate-v18-modal">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] p-6 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">New Budget Line</h2>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Allocate budget by CSI work breakdown</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-[#888888] hover:text-[#444444] dark:text-[#A3A3A3] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 py-4 space-y-3 pr-2">
              <div>
                <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">Project *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">Budget code</label>
                  <input className={inputCls} value={form.budgetCode} onChange={(e) => setForm({ ...form, budgetCode: e.target.value })} placeholder="CSI-03-CONC" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">WBS category / description</label>
                  <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Substructure & Concrete" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">Total allocated (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">Spent to date (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.spentAmount} onChange={(e) => setForm({ ...form, spentAmount: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">Committed (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.committedAmount} onChange={(e) => setForm({ ...form, committedAmount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">Start date</label>
                  <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">End date</label>
                  <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">Fiscal year</label>
                  <input className={inputCls} value={form.fiscalYear} onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })} placeholder="2023/24" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#A3A3A3] block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BudgetStatus })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF] font-medium">{formError}</p>}
            </div>

            <div className="flex justify-end gap-2 p-6 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] shrink-0">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all disabled:opacity-60"
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
