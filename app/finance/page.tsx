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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <DollarSign className="w-4 h-4" /> Financial Control & Cost Accounting
            </div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Project Finances & Costs (ETB)
            </h1>
            <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Real-time monitoring of budgets, committed purchase orders, site expenses, and cash flow.
            </p>
          </div>

          <button
            onClick={openForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-semibold shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Record Expense
          </button>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-5 shadow-sm">
            <span className="text-[#666666] dark:text-[#A3A3A3] text-xs font-semibold uppercase tracking-wider">
              Total Portfolio Budget
            </span>
            <div className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1 font-mono">
              ETB 82,000,000.00
            </div>
            <span className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-1 block">Approved project baselines</span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-5 shadow-sm">
            <span className="text-[#666666] dark:text-[#A3A3A3] text-xs font-semibold uppercase tracking-wider">
              Actual Expenditure
            </span>
            <div className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1 font-mono">
              ETB {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-1 block">Sum of recorded expenses</span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-5 shadow-sm">
            <span className="text-[#666666] dark:text-[#A3A3A3] text-xs font-semibold uppercase tracking-wider">
              Committed Cost (POs)
            </span>
            <div className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1 font-mono">
              ETB 14,800,000.00
            </div>
            <span className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-1 block">Issued purchase orders</span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-5 shadow-sm">
            <span className="text-[#666666] dark:text-[#A3A3A3] text-xs font-semibold uppercase tracking-wider">
              Remaining Contingency
            </span>
            <div className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1 font-mono">
              ETB 32,000,000.00
            </div>
            <span className="text-[11px] text-[#000000] dark:text-[#FFFFFF] mt-1 block">Healthy financial runway</span>
          </div>
        </div>

        {/* Expenses Log Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#D4D4D4] dark:border-[#303030] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">Project Expense Register</h2>
            <span className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono">All currencies in ETB</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#333333] dark:text-[#D4D4D4]">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[11px] border-b border-[#D4D4D4] dark:border-[#303030]">
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
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading financial ledger entries...
                      </span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center">
                      <p className="text-[#888888] dark:text-[#888888]">{error}</p>
                      <button
                        onClick={() => reload()}
                        className="mt-2 text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#666666] dark:text-[#A3A3A3]">
                      No expense records logged yet. Click &quot;Record Expense&quot; above.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#000000] dark:text-[#FFFFFF]">
                        {exp.expenseNumber}
                      </td>
                      <td className="px-5 py-3.5 text-[#000000] dark:text-[#FFFFFF] font-medium">
                        {exp.projectName}
                      </td>
                      <td className="px-5 py-3.5 text-[#888888] dark:text-[#888888]">
                        {exp.category}
                      </td>
                      <td className="px-5 py-3.5 text-[#333333] dark:text-[#D4D4D4]">
                        {exp.payee}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#888888] dark:text-[#888888]">
                        {exp.date}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#000000] dark:text-[#FFFFFF]">
                        ETB {exp.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold">
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
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Record Expense</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#888888] dark:text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Project</label>
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
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Expense ID</label>
                  <input
                    className={inputCls}
                    value={form.expenseNumber}
                    onChange={(e) => setForm({ ...form, expenseNumber: e.target.value })}
                    placeholder="EXP-2026-0001"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Category</label>
                  <input
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Materials"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Payee / Vendor *</label>
                <input
                  className={inputCls}
                  value={form.payee}
                  onChange={(e) => setForm({ ...form, payee: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Amount (ETB) *</label>
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
                <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Approval Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Description</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/10 p-2 rounded">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFormOpen(false)}
                className="bg-[#FAFAFA] hover:bg-[#E5E5E5] dark:bg-[#171717] dark:hover:bg-[#1F1F1F] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
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
