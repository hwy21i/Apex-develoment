"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Receipt, Tag, FileText, CheckCircle,
  Clock, XCircle, AlertCircle, Eye, Download, Calendar
} from "lucide-react";

interface ExpenseVoucher {
  _id: string;
  voucherNumber: string;
  projectName: string;
  category: string;
  payee: string;
  expenseDate: string;
  amount: number;
  paymentMethod: "Cash" | "Bank Transfer" | "Check" | "Petty Cash";
  status: "Draft" | "Submitted" | "Approved" | "Paid" | "Rejected";
  approvedBy?: string;
  description: string;
}

const MOCK_EXPENSES: ExpenseVoucher[] = [
  {
    _id: "exp1",
    voucherNumber: "EXP-2024-0312",
    projectName: "Addis Heights Tower",
    category: "Site Fuel & Generator",
    payee: "TotalEnergies Bole",
    expenseDate: "2024-02-06",
    amount: 145000,
    paymentMethod: "Bank Transfer",
    status: "Paid",
    approvedBy: "Henok Tadesse (Finance Dir)",
    description: "Diesel fuel delivery for mobile tower crane and 500kVA backup generator",
  },
  {
    _id: "exp2",
    voucherNumber: "EXP-2024-0313",
    projectName: "Ring Road Expansion",
    category: "Subcontractor Labor Daywork",
    payee: "Abyssinia Shoring & Excavation",
    expenseDate: "2024-02-05",
    amount: 320000,
    paymentMethod: "Check",
    status: "Approved",
    approvedBy: "Henok Tadesse (Finance Dir)",
    description: "Emergency trench shoring labor and water pumping equipment rental",
  },
  {
    _id: "exp3",
    voucherNumber: "EXP-2024-0314",
    projectName: "Bole Business Park",
    category: "Site Welfare & Safety",
    payee: "Alem Health & Safety Consumables",
    expenseDate: "2024-02-07",
    amount: 28500,
    paymentMethod: "Petty Cash",
    status: "Submitted",
    description: "First-aid refills, hydration stations, and safety signage replacements",
  },
  {
    _id: "exp4",
    voucherNumber: "EXP-2024-0315",
    projectName: "Addis Heights Tower",
    category: "Municipal Permits & Inspection",
    payee: "Addis Ababa City Construction Authority",
    expenseDate: "2024-02-04",
    amount: 85000,
    paymentMethod: "Bank Transfer",
    status: "Paid",
    approvedBy: "Abebe Kebede (PM)",
    description: "Structural inspection fee for 12th floor concrete deck pour",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Submitted: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Approved: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Paid: "bg-green-500/20 text-green-400 border border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function FinanceExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>(MOCK_EXPENSES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
    .filter((e) => e.status === "Paid")
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingApproval = expenses
    .filter((e) => e.status === "Submitted" || e.status === "Approved")
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
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            New Expense Voucher
          </button>
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
              {expenses.filter((e) => e.paymentMethod === "Petty Cash").length}
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
                {filtered.map((e) => (
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
                      {new Date(e.expenseDate).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{e.paymentMethod}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{fmt(e.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="View details">
                        <Eye size={16} />
                      </button>
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

