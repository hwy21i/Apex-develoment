"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Receipt, CheckCircle, X, Loader2, Eye,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { useCurrentUser } from "@/components/auth/UserProvider";
import { formatCurrency } from "@/lib/formatters/currency";

interface ScannedReceipt {
  _id: string;
  receiptNumber: string;
  vendorOrIssuer: string;
  category: string;
  projectId: string;
  amountETB: number;
  date: string;
  uploadedBy: string;
  verified: boolean;
}

const CATEGORIES = ["Fuel Slip", "Petty Cash", "Municipal Tax / Fee", "Store Purchase", "Bank Deposit Slip"];

function mapRecord(r: OperationalRecord): ScannedReceipt {
  const d = r.data || {};
  return {
    _id: r._id,
    receiptNumber: d.receiptNumber || r.title || r._id.slice(-6),
    vendorOrIssuer: d.vendorOrIssuer || "—",
    category: d.category || "—",
    projectId: r.projectId,
    amountETB: Number(d.amountETB) || 0,
    date: d.date || r.createdAt,
    uploadedBy: d.uploadedBy || "—",
    verified: Boolean(d.verified),
  };
}

export default function DocumentReceiptsPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("documents");
  const { user } = useCurrentUser();
  const receipts = records
    .filter((r) => r.data?.vault === "receipts")
    .map(mapRecord);

  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<ScannedReceipt | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    receiptNumber: "",
    vendorOrIssuer: "",
    category: "Fuel Slip",
    amountETB: "",
    date: "",
    verified: false,
  });

  const filtered = receipts.filter(
    (r) =>
      r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.vendorOrIssuer.toLowerCase().includes(search.toLowerCase()) ||
      projectName(r.projectId).toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) => formatCurrency(n);

  const openForm = () => {
    setForm((f) => ({ ...f, projectId: projects[0]?._id || "" }));
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
        title: form.receiptNumber || undefined,
        status: form.verified ? "Verified" : "Pending",
        data: {
          vault: "receipts",
          receiptNumber: form.receiptNumber || undefined,
          vendorOrIssuer: form.vendorOrIssuer,
          category: form.category,
          amountETB: Number(form.amountETB) || 0,
          date: form.date || undefined,
          uploadedBy: user?.fullName || undefined,
          verified: form.verified,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to register receipt");
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
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Scanned Receipts &amp; Payment Slips</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Field fuel tickets, bank deposit slips, petty cash vouchers, and verified tax invoices
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Register Receipt
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search receipts by vendor, number, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>

        {/* Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#666666] dark:text-[#A3A3A3]"><Loader2 size={24} className="animate-spin" /></div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#000000] dark:text-[#FFFFFF] font-medium">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#666666] dark:text-[#A3A3A3]">
              <Receipt size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{receipts.length === 0 ? "No receipts registered yet." : "No receipts match your search."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Receipt #</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Issuer / Vendor</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Project</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Amount</th>
                    <th className="text-center text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Verification</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-4 py-3 font-mono text-[#000000] dark:text-[#FFFFFF] font-medium text-xs">{r.receiptNumber}</td>
                      <td className="px-4 py-3 text-[#000000] dark:text-[#FFFFFF] font-medium">{r.vendorOrIssuer}</td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">{r.category}</td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">{projectName(r.projectId)}</td>
                      <td className="px-4 py-3 text-[#666666] dark:text-[#A3A3A3] text-xs">{r.date ? new Date(r.date).toLocaleDateString("en-ET") : "—"}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{fmt(r.amountETB)}</td>
                      <td className="px-4 py-3 text-center">
                        {r.verified ? (
                          <span className="inline-flex items-center gap-1 text-[#000000] dark:text-[#FFFFFF] text-xs"><CheckCircle size={14} /> Audited</span>
                        ) : (
                          <span className="text-[#000000] dark:text-[#FFFFFF] text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setViewing(r)} className="text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF] p-1" title="View details"><Eye size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF] font-mono">{viewing.receiptNumber}</h2>
              <button onClick={() => setViewing(null)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Issuer / vendor</dt><dd className="text-white">{viewing.vendorOrIssuer}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Category</dt><dd className="text-white">{viewing.category}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Project</dt><dd className="text-white">{projectName(viewing.projectId)}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Amount</dt><dd className="text-[#000000] dark:text-[#FFFFFF] font-bold">{fmt(viewing.amountETB)}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Uploaded by</dt><dd className="text-white">{viewing.uploadedBy}</dd></div>
            </dl>
            <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">File storage is not yet provisioned; this record stores receipt metadata only.</p>
            <div className="flex justify-end">
              <button onClick={() => setViewing(null)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Register Receipt</h2>
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
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Receipt #</label>
                  <input className={inputCls} value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} placeholder="RCPT-2026-001" />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Category</label>
                  <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Issuer / vendor</label>
                <input className={inputCls} value={form.vendorOrIssuer} onChange={(e) => setForm({ ...form, vendorOrIssuer: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Amount (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.amountETB} onChange={(e) => setForm({ ...form, amountETB: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#000000] dark:text-[#FFFFFF]">
                <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                Verified / audited
              </label>
            </div>
            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Save Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
