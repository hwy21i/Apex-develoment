"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Receipt, CheckCircle, Clock, AlertCircle,
  Eye, FileText, ArrowDownLeft, DollarSign, Calendar
} from "lucide-react";

interface SupplierInvoice {
  _id: string;
  invoiceNumber: string;
  poNumber: string;
  supplierName: string;
  projectName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  taxAmount: number;
  status: "Draft" | "Pending Approval" | "Approved" | "Paid" | "Partially Paid" | "Overdue";
}

const MOCK_INVOICES: SupplierInvoice[] = [
  {
    _id: "inv1",
    invoiceNumber: "INV-SUP-8821",
    poNumber: "PO-2024-0002",
    supplierName: "Ethiopian Aggregate Industries",
    projectName: "Ring Road Expansion",
    issueDate: "2024-02-05",
    dueDate: "2024-03-06",
    amount: 225000,
    paidAmount: 225000,
    taxAmount: 29347.83,
    status: "Paid",
  },
  {
    _id: "inv2",
    invoiceNumber: "INV-SUP-8822",
    poNumber: "PO-2024-0003",
    supplierName: "Tekle Steel Works Plc",
    projectName: "Bole Business Park",
    issueDate: "2024-02-03",
    dueDate: "2024-03-20",
    amount: 1950000,
    paidAmount: 975000,
    taxAmount: 254347.82,
    status: "Partially Paid",
  },
  {
    _id: "inv3",
    invoiceNumber: "INV-SUP-8823",
    poNumber: "PO-2024-0001",
    supplierName: "Addis Construction Supply Co.",
    projectName: "Addis Heights Tower",
    issueDate: "2024-02-07",
    dueDate: "2024-03-08",
    amount: 1350000,
    paidAmount: 0,
    taxAmount: 176086.95,
    status: "Pending Approval",
  },
  {
    _id: "inv4",
    invoiceNumber: "INV-SUP-8790",
    poNumber: "PO-2023-0914",
    supplierName: "Rift Valley Bitumen Imports",
    projectName: "Ring Road Expansion",
    issueDate: "2023-12-15",
    dueDate: "2024-01-15",
    amount: 540000,
    paidAmount: 0,
    taxAmount: 70434.78,
    status: "Overdue",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  "Pending Approval": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Approved: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Paid: "bg-green-500/20 text-green-400 border border-green-500/30",
  "Partially Paid": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  Overdue: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>(MOCK_INVOICES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = invoices.filter((i) => {
    const matchSearch =
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      i.projectName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  const totalPayable = invoices.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Supplier Invoices</h1>
            <p className="text-gray-400 text-sm mt-1">
              Accounts payable, supplier billing vouchers, and payment disbursement tracking
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Record Invoice
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Invoiced</p>
            <p className="text-xl font-bold text-white mt-1">
              {fmt(invoices.reduce((sum, i) => sum + i.amount, 0))}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Outstanding Payable</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">{fmt(totalPayable)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Disbursed Payments</p>
            <p className="text-xl font-bold text-green-400 mt-1">{fmt(totalPaid)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Overdue Vouchers</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {invoices.filter((i) => i.status === "Overdue").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Invoice#, PO#, Supplier..."
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
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Invoices table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Invoice #</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Supplier & PO</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Due Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Total Amount</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Paid / Balance</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((i) => {
                  const balance = i.amount - i.paidAmount;
                  return (
                    <tr key={i._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-blue-400 font-medium">
                        {i.invoiceNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">{i.supplierName}</span>
                        <p className="font-mono text-gray-400 text-xs mt-0.5">{i.poNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{i.projectName}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {new Date(i.dueDate).toLocaleDateString("en-ET")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{fmt(i.amount)}</td>
                      <td className="px-4 py-3">
                        <p className="text-green-400 text-xs">{fmt(i.paidAmount)} paid</p>
                        <p className="text-gray-400 text-xs font-medium">Bal: {fmt(balance)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[i.status]}`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-blue-400 hover:text-blue-300 p-1" title="View Invoice">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

