"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, DollarSign, TrendingUp, AlertCircle,
  PieChart, BarChart3, CheckCircle, Clock, ChevronRight
} from "lucide-react";

interface BudgetAllocation {
  _id: string;
  projectName: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  committedAmount: number;
  remainingAmount: number;
  variancePct: number;
  status: "On Track" | "Near Limit" | "Exceeded";
  fiscalYear: string;
}

const MOCK_BUDGETS: BudgetAllocation[] = [
  {
    _id: "b1",
    projectName: "Addis Heights Tower",
    category: "Substructure & Concrete Works",
    allocatedAmount: 18500000,
    spentAmount: 14200000,
    committedAmount: 2100000,
    remainingAmount: 2200000,
    variancePct: 88.1,
    status: "Near Limit",
    fiscalYear: "2023/24",
  },
  {
    _id: "b2",
    projectName: "Addis Heights Tower",
    category: "Structural Steel Framing",
    allocatedAmount: 12000000,
    spentAmount: 6500000,
    committedAmount: 3200000,
    remainingAmount: 2300000,
    variancePct: 80.8,
    status: "On Track",
    fiscalYear: "2023/24",
  },
  {
    _id: "b3",
    projectName: "Ring Road Expansion",
    category: "Earthwork & Grading",
    allocatedAmount: 8500000,
    spentAmount: 7900000,
    committedAmount: 1100000,
    remainingAmount: -500000,
    variancePct: 105.8,
    status: "Exceeded",
    fiscalYear: "2023/24",
  },
  {
    _id: "b4",
    projectName: "Ring Road Expansion",
    category: "Asphalt Surfacing & Drainage",
    allocatedAmount: 15000000,
    spentAmount: 5200000,
    committedAmount: 4300000,
    remainingAmount: 5500000,
    variancePct: 63.3,
    status: "On Track",
    fiscalYear: "2023/24",
  },
  {
    _id: "b5",
    projectName: "Bole Business Park",
    category: "MEP (Electrical & Plumbing)",
    allocatedAmount: 9400000,
    spentAmount: 3100000,
    committedAmount: 1500000,
    remainingAmount: 4800000,
    variancePct: 48.9,
    status: "On Track",
    fiscalYear: "2023/24",
  },
];

const STATUS_BADGES: Record<string, string> = {
  "On Track": "bg-green-500/20 text-green-400 border border-green-500/30",
  "Near Limit": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Exceeded: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function FinanceBudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetAllocation[]>(MOCK_BUDGETS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = budgets.filter((b) => {
    const matchSearch =
      b.projectName.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const totalCommitted = budgets.reduce((acc, b) => acc + b.committedAmount, 0);
  const totalRemaining = budgets.reduce((acc, b) => acc + b.remainingAmount, 0);

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Project Budgets & CSI Divisions</h1>
            <p className="text-gray-400 text-sm mt-1">
              Track allocated capital, committed purchase orders, actual expenditures, and cost variance
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            New Budget Line
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Capital Allocated</p>
            <p className="text-xl font-bold text-white mt-1">{fmt(totalAllocated)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Actual Expenditures</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{fmt(totalSpent)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Committed (POs/Contracts)</p>
            <p className="text-xl font-bold text-purple-400 mt-1">{fmt(totalCommitted)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Net Uncommitted Balance</p>
            <p className="text-xl font-bold text-green-400 mt-1">{fmt(totalRemaining)}</p>
          </div>
        </div>

        {/* Search & filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by project or work breakdown category..."
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
            <option value="On Track">On Track</option>
            <option value="Near Limit">Near Limit (&gt;80%)</option>
            <option value="Exceeded">Exceeded (&gt;100%)</option>
          </select>
        </div>

        {/* Budget list */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project & WBS Category</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">FY</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Allocated</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Spent</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Committed</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Remaining</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-32">Burn Rate</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{b.projectName}</span>
                      <p className="text-gray-400 text-xs mt-0.5">{b.category}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{b.fiscalYear}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{fmt(b.allocatedAmount)}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{fmt(b.spentAmount)}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{fmt(b.committedAmount)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${b.remainingAmount < 0 ? "text-red-400" : "text-green-400"}`}>
                      {fmt(b.remainingAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.variancePct > 100
                              ? "bg-red-500"
                              : b.variancePct > 80
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(b.variancePct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 block">{b.variancePct}% used</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

