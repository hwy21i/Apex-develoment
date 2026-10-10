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
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Scanned Receipts &amp; Payment Slips</h1>
            <p className="text-gray-400 text-sm mt-1">
              Field fuel tickets, bank deposit slips, petty cash vouchers, and verified tax invoices
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Register Receipt
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search receipts by vendor, number, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Receipt size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{receipts.length === 0 ? "No receipts registered yet." : "No receipts match your search."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Receipt #</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Issuer / Vendor</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Amount</th>
                    <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Verification</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-blue-400 font-medium text-xs">{r.receiptNumber}</td>
                      <td className="px-4 py-3 text-white font-medium">{r.vendorOrIssuer}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{r.category}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{projectName(r.projectId)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{r.date ? new Date(r.date).toLocaleDateString("en-ET") : "—"}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{fmt(r.amountETB)}</td>
                      <td className="px-4 py-3 text-center">
                        {r.verified ? (
                          <span className="inline-flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={14} /> Audited</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setViewing(r)} className="text-blue-400 hover:text-blue-300 p-1" title="View details"><Eye size={16} /></button>
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
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white font-mono">{viewing.receiptNumber}</h2>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-400 text-xs">Issuer / vendor</dt><dd className="text-white">{viewing.vendorOrIssuer}</dd></div>
              <div><dt className="text-gray-400 text-xs">Category</dt><dd className="text-white">{viewing.category}</dd></div>
              <div><dt className="text-gray-400 text-xs">Project</dt><dd className="text-white">{projectName(viewing.projectId)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Amount</dt><dd className="text-white font-bold">{fmt(viewing.amountETB)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Uploaded by</dt><dd className="text-white">{viewing.uploadedBy}</dd></div>
            </dl>
            <p className="text-[11px] text-gray-500">File storage is not yet provisioned; this record stores receipt metadata only.</p>
            <div className="flex justify-end">
              <button onClick={() => setViewing(null)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white">Register Receipt</h2>
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
                  <label className="text-xs text-gray-400 block mb-1">Receipt #</label>
                  <input className={inputCls} value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} placeholder="RCPT-2026-001" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Category</label>
                  <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Issuer / vendor</label>
                <input className={inputCls} value={form.vendorOrIssuer} onChange={(e) => setForm({ ...form, vendorOrIssuer: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Amount (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.amountETB} onChange={(e) => setForm({ ...form, amountETB: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                Verified / audited
              </label>
            </div>
            {formError && <p className="text-xs text-red-300">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
