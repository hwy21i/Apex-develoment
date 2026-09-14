"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, FileText, CheckCircle, Clock, AlertTriangle,
  Eye, Download, Send, ArrowUpRight, DollarSign
} from "lucide-react";

interface ClientInvoice {
  _id: string;
  invoiceNumber: string;
  ipcNumber: string; // Interim Payment Certificate #
  projectName: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  certifiedWorkValue: number;
  retentionDeduction: number; // 5% or 10%
  advanceRecovery: number;
  netBilledAmount: number;
  receivedAmount: number;
  status: "Draft" | "Submitted" | "Certified" | "Paid" | "Partially Paid" | "Overdue";
}

const MOCK_CLIENT_INVOICES: ClientInvoice[] = [
  {
    _id: "cinv1",
    invoiceNumber: "INV-CL-2024-001",
    ipcNumber: "IPC-04",
    projectName: "Addis Heights Tower",
    clientName: "Zemen Real Estate S.C.",
    issueDate: "2024-01-20",
    dueDate: "2024-02-20",
    certifiedWorkValue: 12500000,
    retentionDeduction: 625000, // 5%
    advanceRecovery: 1250000,
    netBilledAmount: 10625000,
    receivedAmount: 10625000,
    status: "Paid",
  },
  {
    _id: "cinv2",
    invoiceNumber: "INV-CL-2024-002",
    ipcNumber: "IPC-05",
    projectName: "Addis Heights Tower",
    clientName: "Zemen Real Estate S.C.",
    issueDate: "2024-02-15",
    dueDate: "2024-03-15",
    certifiedWorkValue: 14800000,
    retentionDeduction: 740000,
    advanceRecovery: 1480000,
    netBilledAmount: 12580000,
    receivedAmount: 5000000,
    status: "Partially Paid",
  },
  {
    _id: "cinv3",
    invoiceNumber: "INV-CL-2024-003",
    ipcNumber: "IPC-02",
    projectName: "Ring Road Expansion",
    clientName: "Ethiopian Roads Administration (ERA)",
    issueDate: "2024-02-10",
    dueDate: "2024-03-12",
    certifiedWorkValue: 18200000,
    retentionDeduction: 910000,
    advanceRecovery: 1820000,
    netBilledAmount: 15470000,
    receivedAmount: 0,
    status: "Certified",
  },
  {
    _id: "cinv4",
    invoiceNumber: "INV-CL-2024-004",
    ipcNumber: "IPC-01",
    projectName: "Bole Business Park",
    clientName: "Midroc Investment Group",
    issueDate: "2023-12-05",
    dueDate: "2024-01-05",
    certifiedWorkValue: 8600000,
    retentionDeduction: 430000,
    advanceRecovery: 860000,
    netBilledAmount: 7310000,
    receivedAmount: 0,
    status: "Overdue",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Submitted: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Certified: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Paid: "bg-green-500/20 text-green-400 border border-green-500/30",
  "Partially Paid": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  Overdue: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function FinanceInvoicesPage() {
  const [invoices, setInvoices] = useState<ClientInvoice[]>(MOCK_CLIENT_INVOICES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = invoices.filter((i) => {
    const matchSearch =
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.ipcNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.clientName.toLowerCase().includes(search.toLowerCase()) ||
      i.projectName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  const totalBilled = invoices.reduce((sum, i) => sum + i.netBilledAmount, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + i.receivedAmount, 0);
  const totalOutstanding = totalBilled - totalCollected;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Client Progress Invoices (IPC)</h1>
            <p className="text-gray-400 text-sm mt-1">
              Interim payment certificates, retention deduction holding, and revenue receivables
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Generate IPC Invoice
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Net Billed</p>
            <p className="text-xl font-bold text-white mt-1">{fmt(totalBilled)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Cash Collected</p>
            <p className="text-xl font-bold text-green-400 mt-1">{fmt(totalCollected)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Outstanding Receivables</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">{fmt(totalOutstanding)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Overdue IPCs</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {invoices.filter((i) => i.status === "Overdue").length}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Invoice#, IPC#, Client, Project..."
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
            <option value="Certified">Certified</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Invoices list */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Invoice & IPC #</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project & Client</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Due Date</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Gross Work</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Retention / Adv.</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Net Payable</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Collected</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((inv) => {
                  const deductions = inv.retentionDeduction + inv.advanceRecovery;
                  return (
                    <tr key={inv._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <span className="text-blue-400 font-medium">{inv.invoiceNumber}</span>
                        <span className="ml-2 bg-blue-500/20 text-blue-300 text-[11px] px-1.5 py-0.5 rounded font-bold">
                          {inv.ipcNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{inv.projectName}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{inv.clientName}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {new Date(inv.dueDate).toLocaleDateString("en-ET")}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">{fmt(inv.certifiedWorkValue)}</td>
                      <td className="px-4 py-3 text-right text-red-400 text-xs">-{fmt(deductions)}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{fmt(inv.netBilledAmount)}</td>
                      <td className="px-4 py-3 text-right text-green-400 font-medium">{fmt(inv.receivedAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-blue-400 hover:text-blue-300 p-1" title="View Certificate">
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

