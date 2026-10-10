"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Flag, Eye, X, Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface MilestoneItem {
  _id: string;
  milestoneCode: string;
  title: string;
  projectId: string;
  targetDate: string;
  completionDate?: string;
  weightPct: number;
  linkedPaymentIPC?: string;
  status: "Completed" | "In Progress" | "Upcoming" | "Delayed";
  description: string;
}

const STATUS_BADGES: Record<string, string> = {
  Completed: "bg-green-500/20 text-green-400 border border-green-500/30",
  "In Progress": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Upcoming: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Delayed: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const STATUSES: MilestoneItem["status"][] = ["Upcoming", "In Progress", "Completed", "Delayed"];

function mapRecord(r: OperationalRecord): MilestoneItem {
  const d = r.data || {};
  const status = (r.status || d.status || "Upcoming") as MilestoneItem["status"];
  return {
    _id: r._id,
    milestoneCode: d.milestoneCode || r._id.slice(-6),
    title: r.title || d.title || "Untitled milestone",
    projectId: r.projectId,
    targetDate: d.targetDate || d.dueDate || r.createdAt,
    completionDate: d.completionDate,
    weightPct: Number(d.weightPct ?? d.progress ?? 0) || 0,
    linkedPaymentIPC: d.linkedPaymentIPC,
    status,
    description: d.description || "",
  };
}

const EMPTY_FORM = {
  projectId: "",
  milestoneCode: "",
  title: "",
  targetDate: "",
  status: "Upcoming",
  weightPct: "",
  linkedPaymentIPC: "",
  description: "",
};

export default function MilestonesPage() {
  const { records, projects, projectName, loading, error, reload, create, update } = useRecords("milestones");
  const milestones = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<MilestoneItem | null>(null);
  const [viewStatus, setViewStatus] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = milestones.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.milestoneCode.toLowerCase().includes(search.toLowerCase()) ||
      projectName(m.projectId).toLowerCase().includes(search.toLowerCase())
  );

  const openView = (m: MilestoneItem) => {
    setViewing(m);
    setViewStatus(m.status);
    setActionError(null);
  };

  const saveStatus = async () => {
    if (!viewing) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await update(viewing._id, { status: viewStatus });
      setViewing(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update milestone");
    } finally {
      setActionBusy(false);
    }
  };

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
    if (!form.title.trim()) {
      setFormError("Please enter a milestone title.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.title.trim(),
        status: form.status,
        data: {
          milestoneCode: form.milestoneCode || undefined,
          targetDate: form.targetDate || undefined,
          weightPct: Number(form.weightPct) || 0,
          linkedPaymentIPC: form.linkedPaymentIPC || undefined,
          description: form.description,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create milestone");
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
            <h1 className="text-2xl font-bold text-white">Project Milestones & Deliverables</h1>
            <p className="text-gray-400 text-sm mt-1">
              Critical path deliverables, contractual completion gates, and client sign-off triggers
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Define Milestone
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Milestones</p>
            <p className="text-xl font-bold text-white mt-1">{milestones.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Achieved & Signed Off</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {milestones.filter((m) => m.status === "Completed").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Currently In Progress</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {milestones.filter((m) => m.status === "In Progress").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Delayed Critical Milestones</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {milestones.filter((m) => m.status === "Delayed").length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search milestones by title, project, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Milestones list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={() => reload()} className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
            <Flag size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {milestones.length === 0 ? "No milestones defined yet." : "No milestones match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <div
                key={m._id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                        {m.milestoneCode}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{projectName(m.projectId)}</span>
                      {m.linkedPaymentIPC && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">
                          Unlocks: {m.linkedPaymentIPC}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white">{m.title}</h3>
                    <p className="text-xs text-gray-400 max-w-3xl">{m.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Target Date</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(m.targetDate).toLocaleDateString("en-ET")}
                      </p>
                      <p className="text-[11px] text-blue-400">{m.weightPct}% of Contract</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[m.status] || STATUS_BADGES.Upcoming}`}>
                      {m.status}
                    </span>
                    <button onClick={() => openView(m)} className="text-blue-400 hover:text-blue-300 p-1" title="View details">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details / status modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{viewing.title}</h2>
                <p className="text-gray-400 text-xs font-mono">{viewing.milestoneCode} · {projectName(viewing.projectId)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-400 text-xs">Target date</dt><dd className="text-white">{new Date(viewing.targetDate).toLocaleDateString("en-ET")}</dd></div>
              <div><dt className="text-gray-400 text-xs">Completion date</dt><dd className="text-white">{viewing.completionDate ? new Date(viewing.completionDate).toLocaleDateString("en-ET") : "—"}</dd></div>
              <div><dt className="text-gray-400 text-xs">Contract weight</dt><dd className="text-white">{viewing.weightPct}%</dd></div>
              <div><dt className="text-gray-400 text-xs">Unlocks payment</dt><dd className="text-white">{viewing.linkedPaymentIPC || "—"}</dd></div>
            </dl>
            {viewing.description && (
              <p className="text-xs text-gray-300 bg-gray-800 rounded-lg p-3">{viewing.description}</p>
            )}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Update status</label>
              <select className={inputCls} value={viewStatus} onChange={(e) => setViewStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {actionError && <p className="text-xs text-red-300">{actionError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setViewing(null)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Close</button>
              <button onClick={saveStatus} disabled={actionBusy || viewStatus === viewing.status} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {actionBusy && <Loader2 size={14} className="animate-spin" />}
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white">Define Milestone</h2>
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
                  <label className="text-xs text-gray-400 block mb-1">Milestone code</label>
                  <input className={inputCls} value={form.milestoneCode} onChange={(e) => setForm({ ...form, milestoneCode: e.target.value })} placeholder="MLS-01" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Due / target date</label>
                  <input type="date" className={inputCls} value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Title</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Milestone deliverable name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Progress / weight (% of contract)</label>
                  <input type="number" min="0" max="100" className={inputCls} value={form.weightPct} onChange={(e) => setForm({ ...form, weightPct: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Unlocks payment (IPC)</label>
                <input className={inputCls} value={form.linkedPaymentIPC} onChange={(e) => setForm({ ...form, linkedPaymentIPC: e.target.value })} placeholder="IPC-01" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Create Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
