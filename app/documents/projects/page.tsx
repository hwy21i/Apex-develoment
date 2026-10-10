"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Layers, X, Loader2, Eye,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface ProjectDrawing {
  _id: string;
  docCode: string;
  title: string;
  discipline: string;
  projectId: string;
  revision: string;
  fileSize: string;
  uploadDate: string;
  approvedBy: string;
  status: string;
}

const STATUS_BADGES: Record<string, string> = {
  "Issued for Construction (IFC)": "bg-green-500/20 text-green-400 border border-green-500/30",
  "Under Review": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Superseded: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

const DISCIPLINES = ["Architectural", "Structural", "MEP", "Geotechnical", "Landscape"];
const DRAWING_STATUSES = ["Issued for Construction (IFC)", "Under Review", "Superseded"];

function mapRecord(r: OperationalRecord): ProjectDrawing {
  const d = r.data || {};
  return {
    _id: r._id,
    docCode: d.docCode || r.title || r._id.slice(-6),
    title: d.title || "Untitled drawing",
    discipline: d.discipline || "—",
    projectId: r.projectId,
    revision: d.revision || "—",
    fileSize: d.fileSize || "—",
    uploadDate: d.uploadDate || r.createdAt,
    approvedBy: d.approvedBy || "—",
    status: r.status || d.status || "Under Review",
  };
}

export default function ProjectDocumentsPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("documents");
  const docs = records
    .filter((r) => (r.data?.vault || "drawings") === "drawings")
    .map(mapRecord);

  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("All");
  const [viewing, setViewing] = useState<ProjectDrawing | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    docCode: "",
    title: "",
    discipline: "Architectural",
    revision: "",
    fileSize: "",
    approvedBy: "",
    status: "Under Review",
  });

  const filtered = docs.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.docCode.toLowerCase().includes(search.toLowerCase()) ||
      projectName(d.projectId).toLowerCase().includes(search.toLowerCase());
    const matchDisc = disciplineFilter === "All" || d.discipline === disciplineFilter;
    return matchSearch && matchDisc;
  });

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
        title: form.docCode || form.title || undefined,
        status: form.status,
        data: {
          vault: "drawings",
          docCode: form.docCode || undefined,
          title: form.title,
          discipline: form.discipline,
          revision: form.revision,
          fileSize: form.fileSize || undefined,
          approvedBy: form.approvedBy,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to register drawing");
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
            <h1 className="text-2xl font-bold text-white">Project Engineering Drawings (IFC)</h1>
            <p className="text-gray-400 text-sm mt-1">
              Architectural blueprints, structural CAD revisions, MEP schematics, and site specifications
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Register Drawing
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search drawings by code, title, or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All</option>
            {DISCIPLINES.map((disc) => <option key={disc} value={disc}>{disc}</option>)}
          </select>
        </div>

        {/* Drawings table */}
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
              <Layers size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{docs.length === 0 ? "No drawings registered yet." : "No drawings match your filters."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Code &amp; Revision</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Drawing Title</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Discipline</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Approved By</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map((d) => (
                    <tr key={d._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-blue-400 font-semibold text-xs">{d.docCode}</span>
                        <span className="ml-2 bg-blue-500/20 text-blue-300 text-[11px] px-1.5 py-0.5 rounded font-bold">{d.revision}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{d.title}</p>
                        <p className="text-gray-500 text-xs">{d.fileSize}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{d.discipline}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{projectName(d.projectId)}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{d.approvedBy}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[d.status] || STATUS_BADGES["Under Review"]}`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setViewing(d)} className="text-blue-400 hover:text-blue-300 p-1" title="View details"><Eye size={16} /></button>
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
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{viewing.title}</h2>
                <p className="text-gray-400 text-xs font-mono">{viewing.docCode} · {viewing.revision}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-400 text-xs">Discipline</dt><dd className="text-white">{viewing.discipline}</dd></div>
              <div><dt className="text-gray-400 text-xs">Project</dt><dd className="text-white">{projectName(viewing.projectId)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Approved by</dt><dd className="text-white">{viewing.approvedBy}</dd></div>
              <div><dt className="text-gray-400 text-xs">Status</dt><dd className="text-white">{viewing.status}</dd></div>
              <div><dt className="text-gray-400 text-xs">File size</dt><dd className="text-white">{viewing.fileSize}</dd></div>
              <div><dt className="text-gray-400 text-xs">Uploaded</dt><dd className="text-white">{viewing.uploadDate ? new Date(viewing.uploadDate).toLocaleDateString("en-ET") : "—"}</dd></div>
            </dl>
            <p className="text-[11px] text-gray-500">File storage is not yet provisioned; this record stores drawing metadata only.</p>
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
              <h2 className="text-lg font-bold text-white">Register Drawing</h2>
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
                  <label className="text-xs text-gray-400 block mb-1">Drawing code</label>
                  <input className={inputCls} value={form.docCode} onChange={(e) => setForm({ ...form, docCode: e.target.value })} placeholder="DWG-ARC-0104" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Revision</label>
                  <input className={inputCls} value={form.revision} onChange={(e) => setForm({ ...form, revision: e.target.value })} placeholder="Rev A" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Drawing title</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Discipline</label>
                  <select className={inputCls} value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })}>
                    {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {DRAWING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Approved by</label>
                  <input className={inputCls} value={form.approvedBy} onChange={(e) => setForm({ ...form, approvedBy: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">File size</label>
                  <input className={inputCls} value={form.fileSize} onChange={(e) => setForm({ ...form, fileSize: e.target.value })} placeholder="e.g. 14.2 MB" />
                </div>
              </div>
            </div>
            {formError && <p className="text-xs text-red-300">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Save Drawing
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
