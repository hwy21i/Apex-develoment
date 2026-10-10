"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Receipt, CheckCircle, Clock, AlertCircle,
  Eye, FileText, ArrowDownLeft, DollarSign, Calendar, X
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);

  const [form, setForm] = useState({
    invoiceNumber: `INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`,
    poNumber: "PO-2024-0004",
    supplierName: "",
    projectName: "Addis Heights Tower",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    amount: "",
    status: "Pending Approval" as SupplierInvoice["status"],
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierName || !form.amount) return;
    const numAmount = parseFloat(form.amount) || 0;
    const newInv: SupplierInvoice = {
      _id: `inv-${Date.now()}`,
      invoiceNumber: form.invoiceNumber,
      poNumber: form.poNumber,
      supplierName: form.supplierName,
      projectName: form.projectName,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      amount: numAmount,
      paidAmount: 0,
      taxAmount: Math.round(numAmount * 0.15 * 100) / 100,
      status: form.status,
    };
    setInvoices([newInv, ...invoices]);
    setIsCreateOpen(false);
    setForm({
      invoiceNumber: `INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      poNumber: "PO-2024-0004",
      supplierName: "",
      projectName: "Addis Heights Tower",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      amount: "",
      status: "Pending Approval",
    });
  };

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
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#C9A15A] hover:bg-[#B89248] text-slate-950 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
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
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(i)}
                          className="text-[#C9A15A] hover:text-[#d4b06f] p-1.5 rounded transition-colors"
                          title="View Invoice"
                        >
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

        {/* Record Invoice Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-[#16181D] border border-[#2F333A] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2F333A]">
                <div>
                  <h3 className="text-lg font-bold text-white">Record Supplier Invoice</h3>
                  <p className="text-xs text-slate-400">Log incoming voucher for PO matching & payment disbursement</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Invoice Voucher #</label>
                    <input
                      required
                      value={form.invoiceNumber}
                      onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white font-mono focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Associated PO #</label>
                    <input
                      required
                      value={form.poNumber}
                      onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white font-mono focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Supplier Name</label>
                  <input
                    required
                    placeholder="e.g. Tekle Steel Works Plc"
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Project Site</label>
                  <input
                    required
                    value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                    className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Total Amount (ETB)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="e.g. 500000"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Initial Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as SupplierInvoice["status"] })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                    >
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={form.issueDate}
                      onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#2F333A]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#2A2D34] hover:bg-[#343842] text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#C9A15A] hover:bg-[#B89248] text-slate-950 font-bold"
                  >
                    Save Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Invoice Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-[#16181D] border border-[#2F333A] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2F333A]">
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-xs text-slate-400">Supplier Billing Voucher Details</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#1C1F26] rounded-xl border border-[#2F333A]">
                  <div>
                    <p className="text-slate-400">Supplier</p>
                    <p className="font-semibold text-white mt-0.5">{selectedInvoice.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Purchase Order</p>
                    <p className="font-mono text-[#C9A15A] mt-0.5">{selectedInvoice.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Project</p>
                    <p className="text-slate-200 mt-0.5">{selectedInvoice.projectName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full mt-0.5 text-[11px] font-semibold ${STATUS_BADGES[selectedInvoice.status]}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-[#1C1F26] rounded-xl border border-[#2F333A] text-center">
                  <div>
                    <p className="text-slate-400">Total Billed</p>
                    <p className="font-bold text-white text-sm mt-0.5">{fmt(selectedInvoice.amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Paid Amount</p>
                    <p className="font-bold text-green-400 text-sm mt-0.5">{fmt(selectedInvoice.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Outstanding</p>
                    <p className="font-bold text-yellow-400 text-sm mt-0.5">{fmt(selectedInvoice.amount - selectedInvoice.paidAmount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div className="flex justify-between border-b border-[#2F333A]/50 py-1">
                    <span className="text-slate-400">Issue Date:</span>
                    <span>{new Date(selectedInvoice.issueDate).toLocaleDateString("en-ET")}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2F333A]/50 py-1">
                    <span className="text-slate-400">Due Date:</span>
                    <span>{new Date(selectedInvoice.dueDate).toLocaleDateString("en-ET")}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#2F333A]">
                {selectedInvoice.status !== "Paid" && (
                  <button
                    type="button"
                    onClick={() => {
                      setInvoices(invoices.map((inv) =>
                        inv._id === selectedInvoice._id
                          ? { ...inv, status: "Paid", paidAmount: inv.amount }
                          : inv
                      ));
                      setSelectedInvoice(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-xs"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#2A2D34] hover:bg-[#343842] text-slate-300 font-medium text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

