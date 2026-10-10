"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  DollarSign,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface ExpenseItem {
  _id: string;
  expenseNumber: string;
  projectName: string;
  category: string;
  amount: number;
  date: string;
  payee: string;
  status: string;
}

const STATUSES = ["PENDING", "APPROVED", "PAID", "REJECTED"];

function mapRecord(r: OperationalRecord, projectName: (id: string) => string): ExpenseItem {
  const d = r.data || {};
  return {
    _id: r._id,
    expenseNumber: d.expenseNumber || d.voucherNumber || "EXP-" + r._id.slice(-4).toUpperCase(),
    projectName: projectName(r.projectId),
    category: d.category || "Materials",
    amount: Number(d.amount) || 0,
    date: d.date || d.expenseDate || (r.createdAt ? r.createdAt.slice(0, 10) : "—"),
    payee: d.payee || "—",
    status: r.status || "PENDING",
  };
}

const EMPTY_FORM = {
  projectId: "",
  expenseNumber: "",
  category: "",
  payee: "",
  date: "",
  amount: "",
  status: "PENDING",
  description: "",
};

export default function FinancePage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("expenses");
  const expenses = records.map((r) => mapRecord(r, projectName));

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (!form.payee.trim()) {
      setFormError("Payee / vendor is required.");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.expenseNumber.trim() || form.payee.trim(),
        status: form.status,
        data: {
          expenseNumber: form.expenseNumber || undefined,
          category: form.category,
          payee: form.payee.trim(),
          amount: Number(form.amount) || 0,
          date: form.date || undefined,
          expenseDate: form.date || undefined,
          description: form.description,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to record expense");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-[#141720] border border-[#262C3D] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <DollarSign className="w-4 h-4" /> Financial Control & Cost Accounting
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Project Finances & Costs (ETB)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time monitoring of budgets, committed purchase orders, site expenses, and cash flow.
            </p>
          </div>

          <button
            onClick={openForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Record Expense
          </button>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5 shadow-sm">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total Portfolio Budget
            </span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              ETB 82,000,000.00
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Approved project baselines</span>
          </div>

          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5 shadow-sm">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Actual Expenditure
            </span>
            <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
              ETB {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Sum of recorded expenses</span>
          </div>

          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5 shadow-sm">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Committed Cost (POs)
            </span>
            <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">
              ETB 14,800,000.00
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Issued purchase orders</span>
          </div>

          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5 shadow-sm">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Remaining Contingency
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              ETB 32,000,000.00
            </div>
            <span className="text-[11px] text-emerald-500/80 mt-1 block">Healthy financial runway</span>
          </div>
        </div>

        {/* Expenses Log Table */}
        <div className="bg-[#141720] border border-[#232733] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#232733] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Project Expense Register</h2>
            <span className="text-xs text-slate-400 font-mono">All currencies in ETB</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181B24] text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-[#232733]">
                <tr>
                  <th className="px-5 py-3">Expense ID</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Payee / Vendor</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount (ETB)</th>
                  <th className="px-5 py-3">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202432]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading financial ledger entries...
                      </span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center">
                      <p className="text-slate-400">{error}</p>
                      <button
                        onClick={() => reload()}
                        className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No expense records logged yet. Click &quot;Record Expense&quot; above.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp._id} className="hover:bg-[#1A1E29] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-blue-400">
                        {exp.expenseNumber}
                      </td>
                      <td className="px-5 py-3.5 text-white font-medium">
                        {exp.projectName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {exp.category}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {exp.payee}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">
                        {exp.date}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-white">
                        ETB {exp.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111420] border border-[#262C3D] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#232733] pb-4">
              <h2 className="text-base font-bold text-white">Record Expense</h2>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Project</label>
                <select
                  className={inputCls}
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                >
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Expense ID</label>
                  <input
                    className={inputCls}
                    value={form.expenseNumber}
                    onChange={(e) => setForm({ ...form, expenseNumber: e.target.value })}
                    placeholder="EXP-2026-0001"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Category</label>
                  <input
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Materials"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Payee / Vendor *</label>
                <input
                  className={inputCls}
                  value={form.payee}
                  onChange={(e) => setForm({ ...form, payee: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Amount (ETB) *</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Approval Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Description</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            {formError && <p className="text-xs text-rose-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFormOpen(false)}
                className="bg-[#1A1E29] hover:bg-[#232733] text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
