"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import {
  Folder, FileText, FileSignature, Receipt,
  Search, Upload, X, Loader2, Eye,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { useCurrentUser } from "@/components/auth/UserProvider";

type Vault = "drawings" | "contracts" | "receipts";

interface DocRecord {
  _id: string;
  vault: Vault;
  fileName: string;
  category: string;
  uploadedBy: string;
  fileSize: string;
  date: string;
  projectId: string;
}

const VAULT_LABEL: Record<Vault, string> = {
  drawings: "Engineering Drawings",
  contracts: "Contracts",
  receipts: "Receipts",
};

function mapRecord(r: OperationalRecord): DocRecord {
  const d = r.data || {};
  return {
    _id: r._id,
    vault: (d.vault as Vault) || "drawings",
    fileName: d.fileName || r.title || "Untitled document",
    category: d.category || VAULT_LABEL[(d.vault as Vault) || "drawings"],
    uploadedBy: d.uploadedBy || "—",
    fileSize: d.fileSize || "—",
    date: d.uploadDate || r.createdAt,
    projectId: r.projectId,
  };
}

export default function DocumentsHubPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("documents");
  const { user } = useCurrentUser();
  const docs = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<DocRecord | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    vault: "drawings" as Vault,
    fileName: "",
    category: "",
    fileSize: "",
  });

  const countBy = (v: Vault) => docs.filter((d) => d.vault === v).length;

  const categories = [
    {
      title: "Project Engineering Drawings (IFC)",
      description: "Architectural blueprints, structural CAD sheets, and MEP schematics",
      icon: Folder,
      href: "/documents/projects",
      count: `${countBy("drawings")} files`,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      title: "Contracts & Legal Agreements",
      description: "Prime client turnkey contracts, FIDIC terms, subcontracts, and NDAs",
      icon: FileSignature,
      href: "/documents/contracts",
      count: `${countBy("contracts")} contracts`,
      color: "text-[#C9A15A]",
      bg: "bg-[#C9A15A]/10",
    },
    {
      title: "Scanned Receipts & Payment Vouchers",
      description: "Site fuel tickets, bank deposit slips, and verified petty cash slips",
      icon: Receipt,
      href: "/documents/receipts",
      count: `${countBy("receipts")} vouchers`,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  const filtered = docs
    .filter(
      (u) =>
        u.fileName.toLowerCase().includes(search.toLowerCase()) ||
        u.category.toLowerCase().includes(search.toLowerCase()) ||
        projectName(u.projectId).toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 20);

  const openForm = () => {
    setForm({
      projectId: projects[0]?._id || "",
      vault: "drawings",
      fileName: "",
      category: "",
      fileSize: "2.4 MB",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.projectId) {
      setFormError("Please select a project.");
      return;
    }
    if (!form.fileName.trim()) {
      setFormError("Please provide a document title.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.fileName.trim(),
        data: {
          vault: form.vault,
          fileName: form.fileName.trim(),
          category: form.category || VAULT_LABEL[form.vault],
          fileSize: form.fileSize || "1.0 MB",
          uploadedBy: user?.fullName || "Site Team",
          uploadDate: new Date().toISOString(),
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to register document");
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
              <Folder className="w-4 h-4" /> Vault &amp; Archival System
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#F4F4F5] tracking-tight">
              Document Management Vault
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#A7ABB3] mt-1">
              Centralized repository for design blueprints, commercial contracts, and field invoices
            </p>
          </div>
          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Upload size={16} />
            <span>Register Document</span>
          </button>
        </div>

        {/* Categories cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.title}
                href={c.href}
                className="group glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-5 hover:border-[#C9A15A] transition-all hover:-translate-y-1 block shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${c.bg} ${c.color}`}>
                    <Icon size={22} />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1C1F24] px-2.5 py-1 rounded-full border border-slate-200 dark:border-[#2F333A]">
                    {c.count}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-4 group-hover:text-[#C9A15A] transition-colors">
                  {c.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{c.description}</p>
              </Link>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by title, project, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#C9A15A] shadow-xs transition-colors"
          />
        </div>

        {/* Table of recent files */}
        <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#2F333A] flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Vault Records</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {filtered.length} indexed files
            </span>
          </div>

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
              <Folder size={32} className="mx-auto mb-2 opacity-40 text-[#C9A15A]" />
              <p className="text-sm">
                {docs.length === 0 ? "No documents registered yet." : "No documents match your query."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-[#121418]/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-[#2F333A]">
                  <tr>
                    <th className="px-5 py-3">Document Title</th>
                    <th className="px-5 py-3">Vault Section</th>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3">Uploaded By</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Size</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2F333A]">
                  {filtered.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-[#1A1D24]/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                          <FileText size={15} className="text-[#C9A15A] flex-shrink-0" />
                          <span>{item.fileName}</span>
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{item.category}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{projectName(item.projectId)}</td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{item.uploadedBy}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.date ? new Date(item.date).toLocaleDateString("en-ET") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-600 dark:text-slate-400">{item.fileSize}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setViewing(item)} className="text-[#C9A15A] hover:underline p-1 text-xs font-semibold inline-flex items-center gap-1" title="View details">
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
          <div className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2F333A] pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Document Details</h2>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={16} /></button>
            </div>
            <dl className="space-y-2 text-xs">
              <div><dt className="text-slate-400 font-medium">Title</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.fileName}</dd></div>
              <div><dt className="text-slate-400 font-medium">Vault section</dt><dd className="text-slate-800 dark:text-slate-200 mt-0.5">{viewing.category}</dd></div>
              <div><dt className="text-slate-400 font-medium">Project</dt><dd className="text-slate-800 dark:text-slate-200 mt-0.5">{projectName(viewing.projectId)}</dd></div>
              <div><dt className="text-slate-400 font-medium">Uploaded by</dt><dd className="text-slate-800 dark:text-slate-200 mt-0.5">{viewing.uploadedBy}</dd></div>
              <div><dt className="text-slate-400 font-medium">Size</dt><dd className="text-slate-800 dark:text-slate-200 font-mono mt-0.5">{viewing.fileSize}</dd></div>
            </dl>
            <p className="text-[11px] text-slate-400">
              File storage is not yet provisioned; this record stores document metadata only.
            </p>
            <div className="pt-3 border-t border-slate-100 dark:border-[#2F333A] flex justify-end">
              <button onClick={() => setViewing(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1C1F24] hover:bg-slate-200 dark:hover:bg-[#252A34] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors">Close</button>
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
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Register Vault Document</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Index an architectural sheet, permit, or legal document</p>
                </div>
              </div>
              <button onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Project *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Vault section</label>
                <select className={inputCls} value={form.vault} onChange={(e) => setForm({ ...form, vault: e.target.value as Vault })}>
                  <option value="drawings">Project Engineering Drawings (IFC)</option>
                  <option value="contracts">Contracts &amp; Legal Agreements</option>
                  <option value="receipts">Scanned Receipts &amp; Payment Vouchers</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Document title / file name *</label>
                <input className={inputCls} value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="e.g. Architectural Elevation Sheet A-102.dwg" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category tag</label>
                  <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Structural Blueprint" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">File size estimate</label>
                  <input className={inputCls} value={form.fileSize} onChange={(e) => setForm({ ...form, fileSize: e.target.value })} placeholder="e.g. 14.8 MB" />
                </div>
              </div>
            </div>
            {formError && <p className="text-xs text-rose-500 font-medium">{formError}</p>}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#2F333A]">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2F333A] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-60">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Register Document
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
