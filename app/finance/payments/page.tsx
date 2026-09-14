"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, ArrowDownLeft, ArrowUpRight, CheckCircle,
  Clock, Filter, Eye, DollarSign, Building2, CreditCard
} from "lucide-react";

interface PaymentRecord {
  _id: string;
  transactionRef: string;
  type: "Inflow" | "Outflow";
  sourceOrDestination: string;
  projectName: string;
  bankAccount: string;
  amount: number;
  paymentDate: string;
  method: "CBE Birr / Telebirr" | "CBE Bank Transfer" | "Awash Bank" | "Dashen Bank" | "Check";
  status: "Completed" | "Pending Clearing" | "Reversed";
  referenceType: "Client IPC" | "Supplier PO" | "Subcontractor" | "Payroll";
}

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    _id: "pay1",
    transactionRef: "TRX-ETB-2024-881",
    type: "Inflow",
    sourceOrDestination: "Zemen Real Estate S.C.",
    projectName: "Addis Heights Tower",
    bankAccount: "Commercial Bank of Ethiopia - 1000234891",
    amount: 10625000,
    paymentDate: "2024-02-01",
    method: "CBE Bank Transfer",
    status: "Completed",
    referenceType: "Client IPC",
  },
  {
    _id: "pay2",
    transactionRef: "TRX-ETB-2024-882",
    type: "Outflow",
    sourceOrDestination: "Addis Construction Supply Co.",
    projectName: "Addis Heights Tower",
    bankAccount: "Commercial Bank of Ethiopia - 1000234891",
    amount: 750000,
    paymentDate: "2024-02-02",
    method: "CBE Bank Transfer",
    status: "Completed",
    referenceType: "Supplier PO",
  },
  {
    _id: "pay3",
    transactionRef: "TRX-ETB-2024-883",
    type: "Outflow",
    sourceOrDestination: "Tekle Steel Works Plc",
    projectName: "Bole Business Park",
    bankAccount: "Awash Bank - 01320045892",
    amount: 975000,
    paymentDate: "2024-02-05",
    method: "Awash Bank",
    status: "Completed",
    referenceType: "Supplier PO",
  },
  {
    _id: "pay4",
    type: "Outflow",
    transactionRef: "TRX-ETB-2024-884",
    sourceOrDestination: "Monthly Site Workforce & Staff",
    projectName: "Portfolio Wide",
    bankAccount: "Commercial Bank of Ethiopia - 1000234891",
    amount: 1840000,
    paymentDate: "2024-01-31",
    method: "CBE Bank Transfer",
    status: "Completed",
    referenceType: "Payroll",
  },
  {
    _id: "pay5",
    transactionRef: "TRX-ETB-2024-885",
    type: "Inflow",
    sourceOrDestination: "Midroc Investment Group",
    projectName: "Bole Business Park",
    bankAccount: "Dashen Bank - 5500129841",
    amount: 5000000,
    paymentDate: "2024-02-06",
    method: "Dashen Bank",
    status: "Pending Clearing",
    referenceType: "Client IPC",
  },
];

export default function FinancePaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>(MOCK_PAYMENTS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.transactionRef.toLowerCase().includes(search.toLowerCase()) ||
      p.sourceOrDestination.toLowerCase().includes(search.toLowerCase()) ||
      p.projectName.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  const totalInflow = payments
    .filter((p) => p.type === "Inflow" && p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutflow = payments
    .filter((p) => p.type === "Outflow" && p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Transactions & Treasury</h1>
            <p className="text-gray-400 text-sm mt-1">
              Bank receipts, vendor disbursements, payroll funding, and cash clearing ledger
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Record Payment
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Transactions</p>
            <p className="text-xl font-bold text-white mt-1">{payments.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Cleared Inflows</p>
            <p className="text-xl font-bold text-green-400 mt-1">{fmt(totalInflow)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Cleared Outflows</p>
            <p className="text-xl font-bold text-red-400 mt-1">{fmt(totalOutflow)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Net Treasury Position</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{fmt(totalInflow - totalOutflow)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Transaction Ref, Party, Project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Cash Flows</option>
            <option value="Inflow">Incoming (Inflows)</option>
            <option value="Outflow">Outgoing (Disbursements)</option>
          </select>
        </div>

        {/* Payments table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Ref & Type</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Entity & Category</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Bank Account & Method</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Amount</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.type === "Inflow" ? (
                          <span className="p-1 bg-green-500/20 text-green-400 rounded">
                            <ArrowDownLeft size={14} />
                          </span>
                        ) : (
                          <span className="p-1 bg-red-500/20 text-red-400 rounded">
                            <ArrowUpRight size={14} />
                          </span>
                        )}
                        <span className="font-mono text-blue-400 font-medium text-xs">
                          {p.transactionRef}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{p.sourceOrDestination}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{p.referenceType}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{p.projectName}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-200 text-xs font-medium">{p.bankAccount}</p>
                      <p className="text-gray-400 text-xs">{p.method}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {new Date(p.paymentDate).toLocaleDateString("en-ET")}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${p.type === "Inflow" ? "text-green-400" : "text-white"}`}>
                      {p.type === "Inflow" ? "+" : "-"}{fmt(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "Completed"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {p.status}
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

