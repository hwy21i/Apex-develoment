"use client";

import AppShell from "@/components/layout/AppShell";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  PieChart, BarChart3, AlertCircle, Building2, CheckCircle, ShieldCheck
} from "lucide-react";

export default function FinancialOverviewPage() {
  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  const financialKPIs = [
    { label: "Portfolio Contract Backlog", value: fmt(117500000), change: "+12.4%", isPositive: true },
    { label: "Total Recognized Revenue", value: fmt(48810000), change: "+8.1%", isPositive: true },
    { label: "Actual Site Costs (YTD)", value: fmt(37750000), change: "+5.3%", isPositive: false },
    { label: "Operating Gross Profit", value: fmt(11060000), change: "22.7% margin", isPositive: true },
  ];

  const cashPositions = [
    { bank: "Commercial Bank of Ethiopia (Main Account)", balance: 18450000, accNum: "...4891" },
    { bank: "Awash Bank (Project Escrow)", balance: 8200000, accNum: "...5892" },
    { bank: "Dashen Bank (Operational & Payroll)", balance: 5350000, accNum: "...9841" },
  ];

  const agingReceivables = [
    { bracket: "Current (0-30 days)", amount: 15470000, color: "text-green-400" },
    { bracket: "31-60 days", amount: 7580000, color: "text-yellow-400" },
    { bracket: "61-90 days", amount: 3200000, color: "text-orange-400" },
    { bracket: "90+ days overdue", amount: 7310000, color: "text-red-400" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Enterprise Financial Overview</h1>
          <p className="text-gray-400 text-sm mt-1">
            Consolidated treasury, working capital, WIP accounting, and cash liquidity position
          </p>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialKPIs.map((kpi, idx) => (
            <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <p className="text-xs text-gray-400">{kpi.label}</p>
              <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <span className={kpi.isPositive ? "text-green-400" : "text-gray-400"}>
                  {kpi.change}
                </span>
                <span className="text-gray-500">vs target</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash & Treasury Balances */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign size={18} className="text-blue-400" />
              Cash & Bank Liquidity (ETB)
            </h2>
            <div className="divide-y divide-gray-700">
              {cashPositions.map((c, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{c.bank}</p>
                    <p className="text-gray-500 text-xs font-mono">{c.accNum}</p>
                  </div>
                  <p className="text-green-400 font-bold text-sm">{fmt(c.balance)}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-300">Total Liquid Reserves</span>
              <span className="text-base font-bold text-white">
                {fmt(cashPositions.reduce((s, c) => s + c.balance, 0))}
              </span>
            </div>
          </div>

          {/* Accounts Receivable Aging */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-400" />
              Client Receivables Aging (IPC Progress Billings)
            </h2>
            <div className="divide-y divide-gray-700">
              {agingReceivables.map((a, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{a.bracket}</span>
                  <span className={`font-bold text-sm ${a.color}`}>{fmt(a.amount)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-300">Total Uncollected Billings</span>
              <span className="text-base font-bold text-yellow-400">
                {fmt(agingReceivables.reduce((s, a) => s + a.amount, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

