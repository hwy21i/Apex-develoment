"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  CreditCard,
  Receipt,
  Banknote,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

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

export default function FinancePage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("expenses");

  async function fetchExpenses() {
    setLoading(true);
    try {
      const res = await fetch("/api/records/expenses");
      const json = await res.json();
      if (json.success && json.data?.items) {
        setExpenses(
          json.data.items.map((e: any) => ({
            _id: e._id,
            expenseNumber: e.data?.expenseNumber || "EXP-2026-" + e._id.slice(-4).toUpperCase(),
            projectName: e.title || "Addis Heights Mixed-Use Tower",
            category: e.data?.category || "Materials",
            amount: e.data?.amount || 185000,
            date: e.data?.date || "2026-09-01",
            payee: e.data?.payee || "National Cement Share Company",
            status: e.status || "APPROVED",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

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

          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
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
              ETB 35,200,000.00
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">42.9% budget utilization</span>
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
                      Loading financial ledger entries...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No expense records logged yet.
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
    </AppShell>
  );
}

