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
  Draft: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Submitted: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Approved: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Paid: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Rejected: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" /> Cost &amp; Expenditure Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Expense Vouchers
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Direct site costs, petty cash requests, subcontractor billing, and field expenditures
            </p>
          </div>
          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-black/10 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} />
            <span>New Expense Voucher</span>
          </button>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">Total Vouchers</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">{expenses.length}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">Disbursed (Paid)</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalSpent)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">Committed / Pending</p>
            <p className="text-2xl font-extrabold text-[#666666] dark:text-[#A3A3A3] mt-1">{fmt(pendingApproval)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">Petty Cash Items</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {expenses.filter((e) => e.paymentMethod === "Petty Cash").length}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by Voucher#, Payee, Project, Category..."
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
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Expenses table */}
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
            <div className="p-12 text-center text-[#888888] dark:text-[#888888]">
              <Receipt size={32} className="mx-auto mb-2 opacity-40 text-[#666666] dark:text-[#A3A3A3]" />
              <p className="text-sm">
                {expenses.length === 0 ? "No expense vouchers recorded yet." : "No vouchers match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717]/80 dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
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
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030] dark:divide-[#303030]">
                  {filtered.map((e) => (
                    <tr key={e._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3] font-bold">{e.voucherNumber}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-[#000000] dark:text-[#FFFFFF] font-bold">{projectName(e.projectId)}</p>
                        <p className="text-[#666666] dark:text-[#A3A3A3] text-[11px] mt-0.5">{e.category}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[#000000] dark:text-[#FFFFFF] font-medium">{e.payee}</td>
                      <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3]">
                        {e.expenseDate ? new Date(e.expenseDate).toLocaleDateString("en-ET") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3] dark:text-[#FFFFFF]">{e.paymentMethod}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">{fmt(e.amount)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGES[e.status] || STATUS_BADGES.Draft}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewing(e)}
                          className="text-[#666666] dark:text-[#A3A3A3] hover:underline p-1 text-xs font-semibold inline-flex items-center gap-1"
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
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] font-mono">{viewing.voucherNumber}</h2>
                <p className="text-[#666666] dark:text-[#A3A3A3] text-xs font-semibold">{projectName(viewing.projectId)}</p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] font-medium">Category</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] font-semibold mt-0.5">{viewing.category}</dd></div>
              <div><dt className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] font-medium">Payee</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] font-semibold mt-0.5">{viewing.payee}</dd></div>
              <div><dt className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] font-medium">Amount</dt><dd className="text-[#666666] dark:text-[#A3A3A3] font-mono font-bold mt-0.5">{fmt(viewing.amount)}</dd></div>
              <div><dt className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] font-medium">Method</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] font-semibold mt-0.5">{viewing.paymentMethod}</dd></div>
              <div><dt className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] font-medium">Status</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] font-semibold mt-0.5">{viewing.status}</dd></div>
              <div><dt className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] font-medium">Date</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] mt-0.5">{viewing.expenseDate ? new Date(viewing.expenseDate).toLocaleDateString("en-ET") : "—"}</dd></div>
            </dl>
            {viewing.description && (
              <p className="text-xs text-[#666666] dark:text-[#A3A3A3] dark:text-[#FFFFFF] bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] rounded-xl p-3">
                {viewing.description}
              </p>
            )}
            <div className="pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold transition-colors shadow-xs"
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
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">New Expense Voucher</h2>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Disbursement or field requisition</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Project *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Voucher #</label>
                  <input className={inputCls} value={form.voucherNumber} onChange={(e) => setForm({ ...form, voucherNumber: e.target.value })} placeholder="EXP-2026-0001" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Category</label>
                  <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Fuel / Site Supplies" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Payee</label>
                <input className={inputCls} value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} placeholder="Vendor or employee name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Expense date</label>
                  <input type="date" className={inputCls} value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Amount (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Payment method</label>
                  <select className={inputCls} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}>
                    {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Description</label>
                <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details of expense..." />
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF] font-medium font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md shadow-black/10 transition-all disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin text-[#FFFFFF] dark:text-[#000000]" />}
                Create Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
