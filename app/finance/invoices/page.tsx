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
  Draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Submitted: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Certified: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Paid: "bg-green-500/20 text-green-400 border border-green-500/30",
  "Partially Paid": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  Overdue: "bg-red-500/20 text-red-400 border border-red-500/30",
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
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";

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
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
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
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Invoices list */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {invoices.length === 0 ? "No client invoices recorded yet." : "No invoices match your filters."}
              </p>
            </div>
          ) : (
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
                          {inv.ipcNumber && (
                            <span className="ml-2 bg-blue-500/20 text-blue-300 text-[11px] px-1.5 py-0.5 rounded font-bold">
                              {inv.ipcNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{projectName(inv.projectId)}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{inv.clientName}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-ET") : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">{fmt(inv.certifiedWorkValue)}</td>
                        <td className="px-4 py-3 text-right text-red-400 text-xs">-{fmt(deductions)}</td>
                        <td className="px-4 py-3 text-right font-bold text-white">{fmt(inv.netBilledAmount)}</td>
                        <td className="px-4 py-3 text-right text-green-400 font-medium">{fmt(inv.receivedAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[inv.status] || STATUS_BADGES.Draft}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setViewing(inv)} className="text-blue-400 hover:text-blue-300 p-1" title="View Certificate">
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
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-mono">
                  {viewing.invoiceNumber}
                  {viewing.ipcNumber && (
                    <span className="ml-2 bg-blue-500/20 text-blue-300 text-[11px] px-1.5 py-0.5 rounded font-bold align-middle">
                      {viewing.ipcNumber}
                    </span>
                  )}
                </h2>
                <p className="text-gray-400 text-xs">{projectName(viewing.projectId)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-400 text-xs">Client</dt><dd className="text-white">{viewing.clientName}</dd></div>
              <div><dt className="text-gray-400 text-xs">Status</dt><dd className="text-white">{viewing.status}</dd></div>
              <div><dt className="text-gray-400 text-xs">Issue Date</dt><dd className="text-white">{viewing.issueDate ? new Date(viewing.issueDate).toLocaleDateString("en-ET") : "—"}</dd></div>
              <div><dt className="text-gray-400 text-xs">Due Date</dt><dd className="text-white">{viewing.dueDate ? new Date(viewing.dueDate).toLocaleDateString("en-ET") : "—"}</dd></div>
              <div><dt className="text-gray-400 text-xs">Certified Work Value</dt><dd className="text-white">{fmt(viewing.certifiedWorkValue)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Tax Amount</dt><dd className="text-white">{fmt(viewing.taxAmount)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Retention Deduction</dt><dd className="text-red-400">-{fmt(viewing.retentionDeduction)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Advance Recovery</dt><dd className="text-red-400">-{fmt(viewing.advanceRecovery)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Net Billed</dt><dd className="text-white font-bold">{fmt(viewing.netBilledAmount)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Collected</dt><dd className="text-green-400 font-bold">{fmt(viewing.receivedAmount)}</dd></div>
            </dl>
            <div className="flex justify-end">
              <button onClick={() => setViewing(null)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white">Generate IPC Invoice</h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Project</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Invoice #</label>
                  <input className={inputCls} value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="INV-CL-2026-001" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">IPC #</label>
                  <input className={inputCls} value={form.ipcNumber} onChange={(e) => setForm({ ...form, ipcNumber: e.target.value })} placeholder="IPC-01" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Client / payer</label>
                <input className={inputCls} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Issue date</label>
                  <input type="date" className={inputCls} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Due date</label>
                  <input type="date" className={inputCls} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Certified work value (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Tax amount (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Retention (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.retentionDeduction} onChange={(e) => setForm({ ...form, retentionDeduction: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Advance recovery (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.advanceRecovery} onChange={(e) => setForm({ ...form, advanceRecovery: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Received (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.receivedAmount} onChange={(e) => setForm({ ...form, receivedAmount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
