"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Eye, X, Loader2, FileText,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

interface ClientInvoice {
  _id: string;
  invoiceNumber: string;
  ipcNumber: string; // Interim Payment Certificate #
  projectId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  certifiedWorkValue: number;
  retentionDeduction: number; // 5% or 10%
  advanceRecovery: number;
  taxAmount: number;
  netBilledAmount: number;
  receivedAmount: number;
  status: string;
}

const STATUS_BADGES: Record<string, string> = {
  Draft: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Submitted: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Certified: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Paid: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "Partially Paid": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Overdue: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

const STATUSES = ["Draft", "Submitted", "Certified", "Partially Paid", "Paid", "Overdue"];

function mapRecord(r: OperationalRecord): ClientInvoice {
  const d = r.data || {};
  const certifiedWorkValue = Number(d.certifiedWorkValue ?? d.amount) || 0;
  const retentionDeduction = Number(d.retentionDeduction) || 0;
  const advanceRecovery = Number(d.advanceRecovery) || 0;
  const netBilledAmount =
    Number(d.netBilledAmount) || certifiedWorkValue - retentionDeduction - advanceRecovery;
  return {
    _id: r._id,
    invoiceNumber: d.invoiceNumber || r.title || r._id.slice(-6),
    ipcNumber: d.ipcNumber || "",
    projectId: r.projectId,
    clientName: d.clientName || d.client || d.payer || "—",
    issueDate: d.issueDate || "",
    dueDate: d.dueDate || "",
    certifiedWorkValue,
    retentionDeduction,
    advanceRecovery,
    taxAmount: Number(d.taxAmount) || 0,
    netBilledAmount,
    receivedAmount: Number(d.receivedAmount) || 0,
    status: r.status || d.status || "Draft",
  };
}

const EMPTY_FORM = {
  projectId: "",
  invoiceNumber: "",
  ipcNumber: "",
  clientName: "",
  issueDate: "",
  dueDate: "",
  amount: "",
  taxAmount: "",
  retentionDeduction: "",
  advanceRecovery: "",
  receivedAmount: "",
  status: "Draft",
};

export default function FinanceInvoicesPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("invoices");
  const invoices = records
    .filter((r) => (r.data?.context || "finance") !== "procurement")
    .map(mapRecord);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewing, setViewing] = useState<ClientInvoice | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = invoices.filter((i) => {
    const matchSearch =
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.ipcNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.clientName.toLowerCase().includes(search.toLowerCase()) ||
      projectName(i.projectId).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) => formatCurrency(n);

  const totalBilled = invoices.reduce((sum, i) => sum + i.netBilledAmount, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + i.receivedAmount, 0);
  const totalOutstanding = totalBilled - totalCollected;

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
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.invoiceNumber || undefined,
        status: form.status,
        data: {
          context: "finance",
          invoiceNumber: form.invoiceNumber || undefined,
          ipcNumber: form.ipcNumber,
          clientName: form.clientName,
          issueDate: form.issueDate || undefined,
          dueDate: form.dueDate || undefined,
          amount: Number(form.amount) || 0,
          taxAmount: Number(form.taxAmount) || 0,
          retentionDeduction: Number(form.retentionDeduction) || 0,
          advanceRecovery: Number(form.advanceRecovery) || 0,
          receivedAmount: Number(form.receivedAmount) || 0,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create invoice");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Client Progress Invoices (IPC)</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Interim payment certificates, retention deduction holding, and revenue receivables
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Generate IPC Invoice
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Total Net Billed</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalBilled)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Cash Collected</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalCollected)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Outstanding Receivables</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalOutstanding)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Overdue IPCs</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {invoices.filter((i) => i.status === "Overdue").length}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by Invoice#, IPC#, Client, Project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Invoices list */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#666666] dark:text-[#A3A3A3]">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#000000] dark:text-[#FFFFFF] font-medium">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#666666] dark:text-[#A3A3A3]">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {invoices.length === 0 ? "No client invoices recorded yet." : "No invoices match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Invoice & IPC #</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Project & Client</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Due Date</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Gross Work</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Retention / Adv.</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Net Payable</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Collected</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((inv) => {
                    const deductions = inv.retentionDeduction + inv.advanceRecovery;
                    return (
                      <tr key={inv._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                        <td className="px-4 py-3 font-mono">
                          <span className="text-[#000000] dark:text-[#FFFFFF] font-medium">{inv.invoiceNumber}</span>
                          {inv.ipcNumber && (
                            <span className="ml-2 bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] text-[11px] px-1.5 py-0.5 rounded font-bold">
                              {inv.ipcNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[#000000] dark:text-[#FFFFFF] font-medium">{projectName(inv.projectId)}</p>
                          <p className="text-[#666666] dark:text-[#A3A3A3] text-xs mt-0.5">{inv.clientName}</p>
                        </td>
                        <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-ET") : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-[#333333] dark:text-[#D4D4D4]">{fmt(inv.certifiedWorkValue)}</td>
                        <td className="px-4 py-3 text-right text-[#000000] dark:text-[#FFFFFF] text-xs">-{fmt(deductions)}</td>
                        <td className="px-4 py-3 text-right font-bold text-white">{fmt(inv.netBilledAmount)}</td>
                        <td className="px-4 py-3 text-right text-[#000000] dark:text-[#FFFFFF] font-medium">{fmt(inv.receivedAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[inv.status] || STATUS_BADGES.Draft}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setViewing(inv)} className="text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF] p-1" title="View Certificate">
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF] font-mono">
                  {viewing.invoiceNumber}
                  {viewing.ipcNumber && (
                    <span className="ml-2 bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] text-[11px] px-1.5 py-0.5 rounded font-bold align-middle">
                      {viewing.ipcNumber}
                    </span>
                  )}
                </h2>
                <p className="text-[#666666] dark:text-[#A3A3A3] text-xs">{projectName(viewing.projectId)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Client</dt><dd className="text-white">{viewing.clientName}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Status</dt><dd className="text-white">{viewing.status}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Issue Date</dt><dd className="text-white">{viewing.issueDate ? new Date(viewing.issueDate).toLocaleDateString("en-ET") : "—"}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Due Date</dt><dd className="text-white">{viewing.dueDate ? new Date(viewing.dueDate).toLocaleDateString("en-ET") : "—"}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Certified Work Value</dt><dd className="text-white">{fmt(viewing.certifiedWorkValue)}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Tax Amount</dt><dd className="text-white">{fmt(viewing.taxAmount)}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Retention Deduction</dt><dd className="text-[#000000] dark:text-[#FFFFFF]">-{fmt(viewing.retentionDeduction)}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Advance Recovery</dt><dd className="text-[#000000] dark:text-[#FFFFFF]">-{fmt(viewing.advanceRecovery)}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Net Billed</dt><dd className="text-[#000000] dark:text-[#FFFFFF] font-bold">{fmt(viewing.netBilledAmount)}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Collected</dt><dd className="text-[#000000] dark:text-[#FFFFFF] font-bold">{fmt(viewing.receivedAmount)}</dd></div>
            </dl>
            <div className="flex justify-end">
              <button onClick={() => setViewing(null)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Generate IPC Invoice</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Project</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Invoice #</label>
                  <input className={inputCls} value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="INV-CL-2026-001" />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">IPC #</label>
                  <input className={inputCls} value={form.ipcNumber} onChange={(e) => setForm({ ...form, ipcNumber: e.target.value })} placeholder="IPC-01" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Client / payer</label>
                <input className={inputCls} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Issue date</label>
                  <input type="date" className={inputCls} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Due date</label>
                  <input type="date" className={inputCls} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Certified work value (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Tax amount (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Retention (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.retentionDeduction} onChange={(e) => setForm({ ...form, retentionDeduction: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Advance recovery (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.advanceRecovery} onChange={(e) => setForm({ ...form, advanceRecovery: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Received (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.receivedAmount} onChange={(e) => setForm({ ...form, receivedAmount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
