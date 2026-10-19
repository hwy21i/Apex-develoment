"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Receipt, Eye, X
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
  Draft: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "Pending Approval": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Approved: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Paid: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "Partially Paid": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Overdue: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

export default function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>(MOCK_INVOICES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);

  const [form, setForm] = useState({
    invoiceNumber: "INV-SUP-8824",
    poNumber: "PO-2024-0004",
    supplierName: "",
    projectName: "Addis Heights Tower",
    issueDate: "2024-03-01",
    dueDate: "2024-03-31",
    amount: "",
    status: "Pending Approval" as SupplierInvoice["status"],
  });

  const openCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    const due = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    setForm({
      invoiceNumber: `INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      poNumber: "PO-2024-0004",
      supplierName: "",
      projectName: "Addis Heights Tower",
      issueDate: today,
      dueDate: due,
      amount: "",
      status: "Pending Approval",
    });
    setIsCreateOpen(true);
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" /> Accounts Payable &amp; Billing
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Supplier Invoices
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Accounts payable, supplier billing vouchers, and payment disbursement tracking
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto shrink-0"
          >
            <Plus size={16} />
            Record Invoice
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider">Total Invoiced</p>
            <p className="text-xl sm:text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1">
              {fmt(invoices.reduce((sum, i) => sum + i.amount, 0))}
            </p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider">Outstanding Payable</p>
            <p className="text-xl sm:text-2xl font-black text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalPayable)}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider">Disbursed Payments</p>
            <p className="text-xl sm:text-2xl font-black text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalPaid)}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider">Overdue Vouchers</p>
            <p className="text-xl sm:text-2xl font-black text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] mt-1">
              {invoices.filter((i) => i.status === "Overdue").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by Invoice#, PO#, Supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs"
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
        <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border-b border-[#D4D4D4] dark:border-[#303030]">
                <tr>
                  <th className="text-left text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3.5">Invoice #</th>
                  <th className="text-left text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3.5">Supplier &amp; PO</th>
                  <th className="text-left text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3.5">Project</th>
                  <th className="text-left text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3.5">Due Date</th>
                  <th className="text-left text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3.5">Total Amount</th>
                  <th className="text-left text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3.5">Paid / Balance</th>
                  <th className="text-left text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-right text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {filtered.map((i) => {
                  const balance = i.amount - i.paidAmount;
                  return (
                    <tr key={i._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-[#666666] dark:text-[#A3A3A3] font-bold">
                        {i.invoiceNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#000000] dark:text-[#FFFFFF] font-semibold">{i.supplierName}</span>
                        <p className="font-mono text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] text-[11px] mt-0.5">{i.poNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3] text-xs">{i.projectName}</td>
                      <td className="px-4 py-3 text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3] text-xs">
                        {new Date(i.dueDate).toLocaleDateString("en-ET")}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#000000] dark:text-[#FFFFFF]">{fmt(i.amount)}</td>
                      <td className="px-4 py-3">
                        <p className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold">{fmt(i.paidAmount)} paid</p>
                        <p className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] text-[11px] font-medium">Bal: {fmt(balance)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGES[i.status]}`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(i)}
                          className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] p-1.5 rounded-lg transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Record Supplier Invoice</h3>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Log incoming voucher for PO matching &amp; disbursement</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Invoice Voucher #</label>
                    <input
                      required
                      value={form.invoiceNumber}
                      onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] font-mono focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Associated PO #</label>
                    <input
                      required
                      value={form.poNumber}
                      onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] font-mono focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Supplier Name</label>
                  <input
                    required
                    placeholder="e.g. Tekle Steel Works Plc"
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Project Site</label>
                  <input
                    required
                    value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Total Amount (ETB)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="e.g. 500000"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Initial Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as SupplierInvoice["status"] })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    >
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={form.issueDate}
                      onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] font-mono">{selectedInvoice.invoiceNumber}</h3>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Supplier Billing Voucher Details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] rounded-xl border border-[#D4D4D4] dark:border-[#303030]">
                  <div>
                    <p className="text-[#666666] dark:text-[#A3A3A3]">Supplier</p>
                    <p className="font-semibold text-[#000000] dark:text-[#FFFFFF] mt-0.5">{selectedInvoice.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-[#666666] dark:text-[#A3A3A3]">Purchase Order</p>
                    <p className="font-mono text-[#666666] dark:text-[#A3A3A3] font-bold mt-0.5">{selectedInvoice.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-[#666666] dark:text-[#A3A3A3]">Project</p>
                    <p className="text-[#000000] dark:text-[#FFFFFF] mt-0.5">{selectedInvoice.projectName}</p>
                  </div>
                  <div>
                    <p className="text-[#666666] dark:text-[#A3A3A3]">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full mt-0.5 text-[11px] font-semibold ${STATUS_BADGES[selectedInvoice.status]}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-center">
                  <div>
                    <p className="text-[#666666] dark:text-[#A3A3A3]">Total Billed</p>
                    <p className="font-bold text-[#000000] dark:text-[#FFFFFF] text-sm mt-0.5">{fmt(selectedInvoice.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[#666666] dark:text-[#A3A3A3]">Paid Amount</p>
                    <p className="font-bold text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] text-sm mt-0.5">{fmt(selectedInvoice.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[#666666] dark:text-[#A3A3A3]">Outstanding</p>
                    <p className="font-bold text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] text-sm mt-0.5">{fmt(selectedInvoice.amount - selectedInvoice.paidAmount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[#000000] dark:text-[#FFFFFF]">
                  <div className="flex justify-between border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] py-1.5">
                    <span className="text-[#666666] dark:text-[#A3A3A3]">Issue Date:</span>
                    <span>{new Date(selectedInvoice.issueDate).toLocaleDateString("en-ET")}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] py-1.5">
                    <span className="text-[#666666] dark:text-[#A3A3A3]">Due Date:</span>
                    <span>{new Date(selectedInvoice.dueDate).toLocaleDateString("en-ET")}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
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
                    className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] font-bold text-xs"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] font-semibold text-xs"
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

