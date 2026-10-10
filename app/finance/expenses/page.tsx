"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Eye, X, Loader2, Receipt,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

type PaymentMethod = "Cash" | "Bank Transfer" | "Check" | "Petty Cash";

interface ExpenseVoucher {
  _id: string;
  voucherNumber: string;
  projectId: string;
  category: string;
  payee: string;
  expenseDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: string;
  description: string;
}

const STATUS_BADGES: Record<string, string> = {
  Draft: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30",
  Submitted: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  Approved: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
  Paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  Rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
};

const STATUSES = ["Draft", "Submitted", "Approved", "Paid", "Rejected"];
const METHODS: PaymentMethod[] = ["Cash", "Bank Transfer", "Check", "Petty Cash"];

function mapRecord(r: OperationalRecord): ExpenseVoucher {
  const d = r.data || {};
  return {
    _id: r._id,
    voucherNumber: d.voucherNumber || r.title || r._id.slice(-6),
    projectId: r.projectId,
    category: d.category || "General",
    payee: d.payee || "—",
    expenseDate: d.expenseDate || r.createdAt,
    amount: Number(d.amount) || 0,
    paymentMethod: (d.paymentMethod as PaymentMethod) || "Cash",
    status: r.status || d.status || "Draft",
    description: d.description || "",
  };
}

const EMPTY_FORM = {
  projectId: "",
  voucherNumber: "",
  category: "",
  payee: "",
  expenseDate: "",
  amount: "",
  paymentMethod: "Bank Transfer" as PaymentMethod,
  status: "Draft",
  description: "",
};

export default function FinanceExpensesPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("expenses");
  const expenses = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewing, setViewing] = useState<ExpenseVoucher | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = expenses.filter((e) => {
    const matchSearch =
      e.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      projectName(e.projectId).toLowerCase().includes(search.toLowerCase()) ||
      e.payee.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) => formatCurrency(n);

  const totalSpent = expenses.filter((e) => e.status === "Paid").reduce((s, e) => s + e.amount, 0);
  const pendingApproval = expenses
    .filter((e) => e.status === "Submitted" || e.status === "Approved")
    .reduce((s, e) => s + e.amount, 0);

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
        title: form.voucherNumber || undefined,
        status: form.status,
        data: {
          voucherNumber: form.voucherNumber || undefined,
          category: form.category,
          payee: form.payee,
          expenseDate: form.expenseDate || undefined,
          amount: Number(form.amount) || 0,
          paymentMethod: form.paymentMethod,
          description: form.description,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create expense");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C9A15A]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C9A15A] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" /> Cost & Expenditure Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#F4F4F5] tracking-tight">
              Expense Vouchers
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#A7ABB3] mt-1">
              Direct site costs, petty cash requests, subcontractor billing, and field expenditures
            </p>
          </div>
          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} />
            <span>New Expense Voucher</span>
          </button>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Vouchers</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{expenses.length}</p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Disbursed (Paid)</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{fmt(totalSpent)}</p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Committed / Pending</p>
            <p className="text-2xl font-extrabold text-[#C9A15A] mt-1">{fmt(pendingApproval)}</p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Petty Cash Items</p>
            <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
              {expenses.filter((e) => e.paymentMethod === "Petty Cash").length}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by Voucher#, Payee, Project, Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#C9A15A] shadow-xs transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#C9A15A]"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Expenses table */}
        <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={24} className="animate-spin text-[#C9A15A]" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-rose-500">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-semibold text-[#C9A15A] hover:underline">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt size={32} className="mx-auto mb-2 opacity-40 text-[#C9A15A]" />
              <p className="text-sm">
                {expenses.length === 0 ? "No expense vouchers recorded yet." : "No vouchers match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-[#121418]/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-[#2F333A]">
                  <tr>
                    <th className="px-5 py-3">Voucher #</th>
                    <th className="px-5 py-3">Project &amp; Category</th>
                    <th className="px-5 py-3">Payee</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2F333A]">
                  {filtered.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-50/70 dark:hover:bg-[#1A1D24]/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[#C9A15A] font-bold">{e.voucherNumber}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-900 dark:text-white font-bold">{projectName(e.projectId)}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{e.category}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-medium">{e.payee}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {e.expenseDate ? new Date(e.expenseDate).toLocaleDateString("en-ET") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{e.paymentMethod}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">{fmt(e.amount)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGES[e.status] || STATUS_BADGES.Draft}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewing(e)}
                          className="text-[#C9A15A] hover:underline p-1 text-xs font-semibold inline-flex items-center gap-1"
                          title="View details"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2F333A] pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">{viewing.voucherNumber}</h2>
                <p className="text-[#C9A15A] text-xs font-semibold">{projectName(viewing.projectId)}</p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-slate-400 font-medium">Category</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.category}</dd></div>
              <div><dt className="text-slate-400 font-medium">Payee</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.payee}</dd></div>
              <div><dt className="text-slate-400 font-medium">Amount</dt><dd className="text-[#C9A15A] font-mono font-bold mt-0.5">{fmt(viewing.amount)}</dd></div>
              <div><dt className="text-slate-400 font-medium">Method</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.paymentMethod}</dd></div>
              <div><dt className="text-slate-400 font-medium">Status</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.status}</dd></div>
              <div><dt className="text-slate-400 font-medium">Date</dt><dd className="text-slate-800 dark:text-slate-200 mt-0.5">{viewing.expenseDate ? new Date(viewing.expenseDate).toLocaleDateString("en-ET") : "—"}</dd></div>
            </dl>
            {viewing.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] rounded-xl p-3">
                {viewing.description}
              </p>
            )}
            <div className="pt-3 border-t border-slate-100 dark:border-[#2F333A] flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1C1F24] hover:bg-slate-200 dark:hover:bg-[#252A34] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2F333A] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#C9A15A]/15 text-[#C9A15A]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">New Expense Voucher</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Disbursement or field requisition</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Project *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Voucher #</label>
                  <input className={inputCls} value={form.voucherNumber} onChange={(e) => setForm({ ...form, voucherNumber: e.target.value })} placeholder="EXP-2026-0001" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Fuel / Site Supplies" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Payee</label>
                <input className={inputCls} value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} placeholder="Vendor or employee name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Expense date</label>
                  <input type="date" className={inputCls} value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Amount (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Payment method</label>
                  <select className={inputCls} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}>
                    {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details of expense..." />
              </div>
            </div>

            {formError && <p className="text-xs text-rose-500 font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#2F333A]">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2F333A] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Create Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
