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
  Completed: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "In Progress": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Upcoming: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Delayed: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Project Milestones & Deliverables</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Critical path deliverables, contractual completion gates, and client sign-off triggers
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Define Milestone
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Total Milestones</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{milestones.length}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Achieved & Signed Off</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {milestones.filter((m) => m.status === "Completed").length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Currently In Progress</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {milestones.filter((m) => m.status === "In Progress").length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Delayed Critical Milestones</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {milestones.filter((m) => m.status === "Delayed").length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search milestones by title, project, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>

        {/* Milestones list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#666666] dark:text-[#A3A3A3]">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-6 text-center">
            <p className="text-sm text-[#000000] dark:text-[#FFFFFF] font-medium">{error}</p>
            <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-12 text-center text-[#666666] dark:text-[#A3A3A3]">
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
                className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-5 hover:border-[#D4D4D4] dark:border-[#303030] transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] font-semibold">
                        {m.milestoneCode}
                      </span>
                      <span className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">{projectName(m.projectId)}</span>
                      {m.linkedPaymentIPC && (
                        <span className="text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] font-medium">
                          Unlocks: {m.linkedPaymentIPC}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">{m.title}</h3>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-3xl">{m.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Target Date</p>
                      <p className="text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">
                        {new Date(m.targetDate).toLocaleDateString("en-ET")}
                      </p>
                      <p className="text-[11px] text-[#000000] dark:text-[#FFFFFF]">{m.weightPct}% of Contract</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[m.status] || STATUS_BADGES.Upcoming}`}>
                      {m.status}
                    </span>
                    <button onClick={() => openView(m)} className="text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF] p-1" title="View details">
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
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">{viewing.title}</h2>
                <p className="text-[#666666] dark:text-[#A3A3A3] text-xs font-mono">{viewing.milestoneCode} · {projectName(viewing.projectId)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Target date</dt><dd className="text-white">{new Date(viewing.targetDate).toLocaleDateString("en-ET")}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Completion date</dt><dd className="text-white">{viewing.completionDate ? new Date(viewing.completionDate).toLocaleDateString("en-ET") : "—"}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Contract weight</dt><dd className="text-white">{viewing.weightPct}%</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Unlocks payment</dt><dd className="text-white">{viewing.linkedPaymentIPC || "—"}</dd></div>
            </dl>
            {viewing.description && (
              <p className="text-xs text-[#333333] dark:text-[#D4D4D4] bg-[#FAFAFA] dark:bg-[#171717] rounded-lg p-3">{viewing.description}</p>
            )}
            <div>
              <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Update status</label>
              <select className={inputCls} value={viewStatus} onChange={(e) => setViewStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {actionError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{actionError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setViewing(null)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Close</button>
              <button onClick={saveStatus} disabled={actionBusy || viewStatus === viewing.status} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Define Milestone</h2>
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
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Milestone code</label>
                  <input className={inputCls} value={form.milestoneCode} onChange={(e) => setForm({ ...form, milestoneCode: e.target.value })} placeholder="MLS-01" />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Due / target date</label>
                  <input type="date" className={inputCls} value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Title</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Milestone deliverable name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Progress / weight (% of contract)</label>
                  <input type="number" min="0" max="100" className={inputCls} value={form.weightPct} onChange={(e) => setForm({ ...form, weightPct: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Unlocks payment (IPC)</label>
                <input className={inputCls} value={form.linkedPaymentIPC} onChange={(e) => setForm({ ...form, linkedPaymentIPC: e.target.value })} placeholder="IPC-01" />
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Description</label>
                <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
