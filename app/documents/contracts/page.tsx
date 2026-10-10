"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, FileSignature, X, Loader2, Eye,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

interface ContractDocument {
  _id: string;
  contractRef: string;
  title: string;
  partyType: string;
  contractingParty: string;
  projectId: string;
  effectiveDate: string;
  expiryDate: string;
  contractValueETB: number;
  status: string;
  signedBy: string;
}

const STATUS_BADGES: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  "Under Review": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  Completed: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
  Expired: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
};

const PARTY_TYPES = ["Prime Client", "Subcontractor", "Consultant", "Material Supplier"];
const CONTRACT_STATUSES = ["Active", "Under Review", "Completed", "Expired"];

function mapRecord(r: OperationalRecord): ContractDocument {
  const d = r.data || {};
  return {
    _id: r._id,
    contractRef: d.contractRef || r.title || r._id.slice(-6),
    title: d.title || "Untitled contract",
    partyType: d.partyType || "—",
    contractingParty: d.contractingParty || "—",
    projectId: r.projectId,
    effectiveDate: d.effectiveDate || "",
    expiryDate: d.expiryDate || "",
    contractValueETB: Number(d.contractValueETB) || 0,
    status: r.status || d.status || "Active",
    signedBy: d.signedBy || "—",
  };
}

export default function ContractsVaultPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("documents");
  const contracts = records
    .filter((r) => (r.data?.vault || "drawings") === "contracts")
    .map(mapRecord);

  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<ContractDocument | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    contractRef: "",
    title: "",
    partyType: "Prime Client",
    contractingParty: "",
    effectiveDate: "",
    expiryDate: "",
    contractValueETB: "",
    status: "Active",
    signedBy: "",
  });

  const filtered = contracts.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.contractRef.toLowerCase().includes(search.toLowerCase()) ||
      c.contractingParty.toLowerCase().includes(search.toLowerCase()) ||
      projectName(c.projectId).toLowerCase().includes(search.toLowerCase())
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
        title: form.contractRef || form.title || undefined,
        status: form.status,
        data: {
          vault: "contracts",
          contractRef: form.contractRef || undefined,
          title: form.title,
          partyType: form.partyType,
          contractingParty: form.contractingParty,
          effectiveDate: form.effectiveDate || undefined,
          expiryDate: form.expiryDate || undefined,
          contractValueETB: Number(form.contractValueETB) || 0,
          signedBy: form.signedBy,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to archive contract");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C9A15A]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C9A15A] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <FileSignature className="w-4 h-4" /> Legal Instruments & Agreements
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#F4F4F5] tracking-tight">
              Contracts Vault &amp; Legal Agreements
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#A7ABB3] mt-1">
              Prime client contracts, FIDIC agreements, trade subcontracts, and supplier master agreements
            </p>
          </div>
          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} />
            <span>Archive New Contract</span>
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Legal Instruments</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{contracts.length}</p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Agreements</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {contracts.filter((c) => c.status === "Active").length}
            </p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Contract Value</p>
            <p className="text-2xl font-extrabold text-[#C9A15A] mt-1 truncate">
              {fmt(contracts.reduce((s, c) => s + c.contractValueETB, 0))}
            </p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Prime Client Contracts</p>
            <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
              {contracts.filter((c) => c.partyType === "Prime Client").length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search contracts by party, project, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#C9A15A] shadow-xs transition-colors"
          />
        </div>

        {/* Table */}
        <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={24} className="animate-spin text-[#C9A15A]" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-rose-500">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-semibold text-[#C9A15A] hover:underline">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileSignature size={32} className="mx-auto mb-2 opacity-40 text-[#C9A15A]" />
              <p className="text-sm">{contracts.length === 0 ? "No contracts archived yet." : "No contracts match your search."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-[#121418]/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-[#2F333A]">
                  <tr>
                    <th className="px-5 py-3">Contract Ref &amp; Type</th>
                    <th className="px-5 py-3">Agreement Title</th>
                    <th className="px-5 py-3">Counterparty</th>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3 text-right">Contract Value</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2F333A]">
                  {filtered.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 dark:hover:bg-[#1A1D24]/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[#C9A15A] font-bold text-xs">{c.contractRef}</span>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{c.partyType}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-900 dark:text-white font-bold">{c.title}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">Signed by: {c.signedBy}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 text-xs font-medium">{c.contractingParty}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs">{projectName(c.projectId)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">{fmt(c.contractValueETB)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGES[c.status] || STATUS_BADGES.Active}`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setViewing(c)} className="text-[#C9A15A] hover:underline p-1 text-xs font-semibold inline-flex items-center gap-1" title="View details">
                          <Eye size={14} />
                          <span>View</span>
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2F333A] pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{viewing.title}</h2>
                <p className="text-[#C9A15A] text-xs font-mono font-bold">{viewing.contractRef}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-slate-400 font-medium">Party type</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.partyType}</dd></div>
              <div><dt className="text-slate-400 font-medium">Counterparty</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.contractingParty}</dd></div>
              <div><dt className="text-slate-400 font-medium">Project</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{projectName(viewing.projectId)}</dd></div>
              <div><dt className="text-slate-400 font-medium">Value</dt><dd className="text-[#C9A15A] font-mono font-bold mt-0.5">{fmt(viewing.contractValueETB)}</dd></div>
              <div><dt className="text-slate-400 font-medium">Effective</dt><dd className="text-slate-800 dark:text-slate-200 mt-0.5">{viewing.effectiveDate ? new Date(viewing.effectiveDate).toLocaleDateString("en-ET") : "—"}</dd></div>
              <div><dt className="text-slate-400 font-medium">Expiry</dt><dd className="text-slate-800 dark:text-slate-200 mt-0.5">{viewing.expiryDate ? new Date(viewing.expiryDate).toLocaleDateString("en-ET") : "—"}</dd></div>
            </dl>
            <p className="text-[11px] text-slate-400">File storage is not yet provisioned; this record stores contract metadata only.</p>
            <div className="pt-3 border-t border-slate-100 dark:border-[#2F333A] flex justify-end">
              <button onClick={() => setViewing(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1C1F24] hover:bg-slate-200 dark:hover:bg-[#252A34] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2F333A] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#C9A15A]/15 text-[#C9A15A]">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Archive New Contract</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Register legal covenant or subcontract</p>
                </div>
              </div>
              <button onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Project *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Contract ref *</label>
                  <input className={inputCls} value={form.contractRef} onChange={(e) => setForm({ ...form, contractRef: e.target.value })} placeholder="CTR-CL-2026-01" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Party type</label>
                  <select className={inputCls} value={form.partyType} onChange={(e) => setForm({ ...form, partyType: e.target.value })}>
                    {PARTY_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Agreement title *</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Master Subcontract Agreement" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Counterparty *</label>
                <input className={inputCls} value={form.contractingParty} onChange={(e) => setForm({ ...form, contractingParty: e.target.value })} placeholder="e.g. Tekle Steel Works Plc" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Effective date</label>
                  <input type="date" className={inputCls} value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Expiry date</label>
                  <input type="date" className={inputCls} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Contract value (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.contractValueETB} onChange={(e) => setForm({ ...form, contractValueETB: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {CONTRACT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Signed by</label>
                <input className={inputCls} value={form.signedBy} onChange={(e) => setForm({ ...form, signedBy: e.target.value })} placeholder="Signatory name" />
              </div>
            </div>
            {formError && <p className="text-xs text-rose-500 font-medium">{formError}</p>}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#2F333A]">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2F333A] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-60">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Archive Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
