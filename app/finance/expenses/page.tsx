"use client";

import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { hasPermission } from "@/lib/rbac/permissions";
import { Plus, Search, Eye } from "lucide-react";

interface ExpenseVoucher {
  _id: string;
  voucherNumber: string;
  projectName: string;
  category: string;
  payee: string;
  expenseDate: string;
  amount: number;
  paymentMethod: string;
  status: string;
  approvedBy?: string;
  description: string;
}

interface ProjectOption { _id: string; name: string }
interface OperationalExpense { _id: string; title?: string; status?: string; projectId?: { name?: string } | string; data?: { expenseNumber?: string; category?: string; payee?: string; date?: string; amount?: number; paymentMethod?: string; description?: string } }

const formatStatus = (value?: string) => value ? value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "Unspecified";

const STATUS_BADGES: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Submitted: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Approved: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Paid: "bg-green-500/20 text-green-400 border border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function FinanceExpensesPage() {
  const { user } = useAuth();
  const canCreateExpense = hasPermission(user, "EXPENSE_CREATE");
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<ExpenseVoucher | null>(null);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const response = await fetch("/api/records/expenses", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setError(json.error?.message || "Unable to load expense records.");
        return;
      }
      setExpenses(((json.data?.items || []) as OperationalExpense[]).map((record) => ({
        _id: record._id,
        voucherNumber: record.data?.expenseNumber || `EXP-${record._id.slice(-8).toUpperCase()}`,
        projectName: typeof record.projectId === "object" ? record.projectId?.name || "Project unavailable" : "Project unavailable",
        category: record.data?.category || "Uncategorized",
        payee: record.data?.payee || "—",
        expenseDate: record.data?.date || "",
        amount: Number(record.data?.amount || 0),
        paymentMethod: record.data?.paymentMethod || "—",
        status: formatStatus(record.status),
        description: record.data?.description || "",
      })));
      setError("");
    } catch {
      setError("Unable to connect to the expense service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => { void fetchExpenses(); });
    fetch("/api/projects?limit=100").then(async (response) => {
      const json = await response.json();
      if (response.ok && json.success) setProjects(json.data?.items || []);
    }).catch(() => {});
  }, []);

  async function createExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    const voucherNumber = String(form.get("voucherNumber") || "").trim();
    try {
      const response = await fetch("/api/records/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.get("projectId"),
          title: voucherNumber,
          status: "SUBMITTED",
          data: {
            expenseNumber: voucherNumber,
            category: form.get("category"),
            payee: form.get("payee"),
            date: form.get("date"),
            amount: Number(form.get("amount")),
            paymentMethod: form.get("paymentMethod"),
            description: form.get("description"),
          },
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setFormError(json.error?.message || "Unable to submit expense voucher.");
        return;
      }
      setShowCreateForm(false);
      await fetchExpenses();
    } catch {
      setFormError("Unable to connect to the expense service.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = expenses.filter((e) => {
    const matchSearch =
      e.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.projectName.toLowerCase().includes(search.toLowerCase()) ||
      e.payee.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  const totalSpent = expenses
    .filter((e) => e.status.toLowerCase() === "paid")
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingApproval = expenses
    .filter((e) => ["submitted", "approved"].includes(e.status.toLowerCase()))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Expense Vouchers</h1>
            <p className="text-gray-400 text-sm mt-1">
              Direct site costs, petty cash requests, subcontractor billing, and field expenditures
            </p>
          </div>
          {canCreateExpense && <button type="button" onClick={() => { setFormError(""); setShowCreateForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50" disabled={!projects.length}>
            <Plus size={16} />
            New Expense Voucher
          </button>}
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Vouchers</p>
            <p className="text-xl font-bold text-white mt-1">{expenses.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Disbursed (Paid)</p>
            <p className="text-xl font-bold text-green-400 mt-1">{fmt(totalSpent)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Committed / Pending</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">{fmt(pendingApproval)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Petty Cash Items</p>
            <p className="text-xl font-bold text-purple-400 mt-1">
              {expenses.filter((e) => e.paymentMethod.toLowerCase() === "petty cash").length}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Voucher#, Payee, Project, Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

        {/* Expenses table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Voucher #</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project & Category</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Payee</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Method</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading expense vouchers…</td></tr> : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">{expenses.length ? "No expense vouchers match your filters." : "No expense vouchers are available."}</td></tr> : filtered.map((e) => (
                  <tr key={e._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-400 font-medium">
                      {e.voucherNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{e.projectName}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{e.category}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{e.payee}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {e.expenseDate && !Number.isNaN(new Date(e.expenseDate).getTime()) ? new Date(e.expenseDate).toLocaleDateString("en-ET") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{e.paymentMethod}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{fmt(e.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[e.status] || "border border-gray-600 text-gray-300"}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" aria-label={`View ${e.voucherNumber} details`} onClick={() => setSelectedExpense(e)} className="text-blue-400 hover:text-blue-300 p-1" title="View details">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedExpense && <section className="rounded-xl border border-gray-700 bg-gray-800 p-5" aria-label={`${selectedExpense.voucherNumber} details`}><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-white">{selectedExpense.voucherNumber} details</h2><button type="button" onClick={() => setSelectedExpense(null)} className="rounded-md border border-gray-600 px-3 py-1.5 text-sm text-gray-200">Close</button></div><dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">{[["Project", selectedExpense.projectName], ["Category", selectedExpense.category], ["Payee", selectedExpense.payee], ["Date", selectedExpense.expenseDate || "—"], ["Payment method", selectedExpense.paymentMethod], ["Amount", fmt(selectedExpense.amount)], ["Description", selectedExpense.description || "—"]].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-400">{label}</dt><dd className="mt-1 text-white">{value}</dd></div>)}</dl></section>}

        {showCreateForm && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><form role="dialog" aria-modal="true" aria-labelledby="expense-dialog-title" onSubmit={createExpense} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="expense-dialog-title" className="text-lg font-semibold text-white">New expense voucher</h2><p className="mt-1 text-sm text-gray-400">Submit a project expense for review.</p></div><button type="button" aria-label="Close expense form" disabled={saving} onClick={() => setShowCreateForm(false)} className="px-2 text-xl text-gray-400">×</button></div>{formError && <p role="alert" className="text-sm text-rose-300">{formError}</p>}<label className="grid gap-1 text-sm text-gray-300">Project<select name="projectId" required className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"><option value="">Select a project</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm text-gray-300">Voucher number<input name="voucherNumber" required minLength={2} maxLength={40} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Category<input name="category" required minLength={2} maxLength={100} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Payee<input name="payee" required minLength={2} maxLength={160} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Date<input name="date" type="date" required className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Amount (ETB)<input name="amount" type="number" min="0.01" step="0.01" required className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Payment method<select name="paymentMethod" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"><option>Bank Transfer</option><option>Cash</option><option>Check</option><option>Petty Cash</option></select></label></div><label className="grid gap-1 text-sm text-gray-300">Description<textarea name="description" maxLength={1000} rows={3} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setShowCreateForm(false)} className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200">Cancel</button><button type="submit" disabled={saving || !projects.length} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Submitting…" : "Submit voucher"}</button></div></form></div>}
      </div>
    </AppShell>
  );
}
