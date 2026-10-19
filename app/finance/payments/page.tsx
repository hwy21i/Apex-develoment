"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, ArrowDownLeft, ArrowUpRight,
  Loader2, X, DollarSign,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

type PaymentType = "Inflow" | "Outflow";

const METHODS = ["CBE Birr / Telebirr", "CBE Bank Transfer", "Awash Bank", "Dashen Bank", "Check"] as const;
const REF_TYPES = ["Client IPC", "Supplier PO", "Subcontractor", "Payroll"] as const;
const STATUSES = ["Completed", "Pending Clearing", "Reversed"];

interface PaymentRecord {
  _id: string;
  transactionRef: string;
  type: PaymentType;
  sourceOrDestination: string;
  projectId: string;
  bankAccount: string;
  amount: number;
  paymentDate: string;
  method: string;
  status: string;
  referenceType: string;
}

function mapRecord(r: OperationalRecord): PaymentRecord {
  const d = r.data || {};
  return {
    _id: r._id,
    transactionRef: d.transactionRef || d.paymentRef || r.title || r._id.slice(-6),
    type: d.type === "Inflow" ? "Inflow" : "Outflow",
    sourceOrDestination: d.sourceOrDestination || d.payer || d.source || "—",
    projectId: r.projectId,
    bankAccount: d.bankAccount || "—",
    amount: Number(d.amount) || 0,
    paymentDate: d.paymentDate || r.createdAt,
    method: d.method || "CBE Bank Transfer",
    status: r.status || d.status || "Pending Clearing",
    referenceType: d.referenceType || d.reference || "—",
  };
}

const EMPTY_FORM = {
  projectId: "",
  transactionRef: "",
  type: "Outflow" as PaymentType,
  sourceOrDestination: "",
  bankAccount: "",
  amount: "",
  paymentDate: "",
  method: "CBE Bank Transfer" as (typeof METHODS)[number],
  status: "Completed",
  referenceType: "Supplier PO" as (typeof REF_TYPES)[number],
};

export default function FinancePaymentsPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("payments");
  const payments = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.transactionRef.toLowerCase().includes(search.toLowerCase()) ||
      p.sourceOrDestination.toLowerCase().includes(search.toLowerCase()) ||
      projectName(p.projectId).toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const fmt = (n: number) => formatCurrency(n);

  const totalInflow = payments
    .filter((p) => p.type === "Inflow" && p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutflow = payments
    .filter((p) => p.type === "Outflow" && p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0);

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
        title: form.transactionRef || undefined,
        status: form.status,
        data: {
          transactionRef: form.transactionRef || undefined,
          type: form.type,
          sourceOrDestination: form.sourceOrDestination,
          bankAccount: form.bankAccount,
          amount: Number(form.amount) || 0,
          paymentDate: form.paymentDate || undefined,
          method: form.method,
          referenceType: form.referenceType,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to record payment");
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
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Payment Transactions & Treasury</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Bank receipts, vendor disbursements, payroll funding, and cash clearing ledger
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Record Payment
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Total Transactions</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{payments.length}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Cleared Inflows</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalInflow)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Cleared Outflows</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalOutflow)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Net Treasury Position</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalInflow - totalOutflow)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by Transaction Ref, Party, Project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          >
            <option value="All">All Cash Flows</option>
            <option value="Inflow">Incoming (Inflows)</option>
            <option value="Outflow">Outgoing (Disbursements)</option>
          </select>
        </div>

        {/* Payments table */}
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
              <DollarSign size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {payments.length === 0 ? "No payment transactions recorded yet." : "No transactions match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Ref & Type</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Entity & Category</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Project</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Bank Account & Method</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Amount</th>
                    <th className="text-center text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((p) => (
                    <tr key={p._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.type === "Inflow" ? (
                            <span className="p-1 bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] rounded">
                              <ArrowDownLeft size={14} />
                            </span>
                          ) : (
                            <span className="p-1 bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] rounded">
                              <ArrowUpRight size={14} />
                            </span>
                          )}
                          <span className="font-mono text-[#000000] dark:text-[#FFFFFF] font-medium text-xs">
                            {p.transactionRef}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#000000] dark:text-[#FFFFFF] font-medium">{p.sourceOrDestination}</p>
                        <p className="text-[#666666] dark:text-[#A3A3A3] text-xs mt-0.5">{p.referenceType}</p>
                      </td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">{projectName(p.projectId)}</td>
                      <td className="px-4 py-3">
                        <p className="text-[#000000] dark:text-[#FFFFFF] text-xs font-medium">{p.bankAccount}</p>
                        <p className="text-[#666666] dark:text-[#A3A3A3] text-xs">{p.method}</p>
                      </td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-ET") : "—"}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${p.type === "Inflow" ? "text-[#000000] dark:text-[#FFFFFF]" : "text-white"}`}>
                        {p.type === "Inflow" ? "+" : "-"}{fmt(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.status === "Completed"
                              ? "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
                              : "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
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
          )}
        </div>
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Record Payment</h2>
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
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Transaction ref</label>
                  <input className={inputCls} value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} placeholder="TRX-ETB-2026-001" />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Cash flow type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PaymentType })}>
                    <option value="Inflow">Inflow (Receipt)</option>
                    <option value="Outflow">Outflow (Disbursement)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Payer / source or destination</label>
                <input className={inputCls} value={form.sourceOrDestination} onChange={(e) => setForm({ ...form, sourceOrDestination: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Bank account</label>
                  <input className={inputCls} value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} placeholder="Commercial Bank of Ethiopia - 10002..." />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Amount (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Payment date</label>
                  <input type="date" className={inputCls} value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Method</label>
                  <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as (typeof METHODS)[number] })}>
                    {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Reference category</label>
                  <select className={inputCls} value={form.referenceType} onChange={(e) => setForm({ ...form, referenceType: e.target.value as (typeof REF_TYPES)[number] })}>
                    {REF_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
