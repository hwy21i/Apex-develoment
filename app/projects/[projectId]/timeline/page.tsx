"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Layers,
  CheckCircle2,
  Flag,
  Check,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useRecords } from "@/hooks/useRecords";

interface PhaseRecord {
  _id: string;
  name: string;
  sequenceNumber: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  completionPercentage: number;
  status: string;
}

interface MilestoneItem {
  _id: string;
  title: string;
  targetDate: string;
  phaseName?: string;
  isCriticalPath: boolean;
  status: "Completed" | "Pending" | "Delayed";
  notes?: string;
}

export default function ProjectTimelinePage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [project, setProject] = useState<{
    _id: string;
    name: string;
    projectCode: string;
    startDate: string;
    expectedEndDate: string;
    actualEndDate?: string;
    status: string;
  } | null>(null);

  const [phases, setPhases] = useState<PhaseRecord[]>([]);
  const [loadingPhases, setLoadingPhases] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Operational records store for milestones
  const {
    records: milestoneRecords,
    loading: loadingMilestones,
    reload: reloadMilestones,
    create: createMilestoneRecord,
    update: updateMilestoneRecord,
    remove: removeMilestoneRecord,
  } = useRecords("milestones", projectId);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formPhase, setFormPhase] = useState("");
  const [formCritical, setFormCritical] = useState(false);
  const [formNotes, setFormNotes] = useState("");

  const loadProjectAndPhases = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingPhases(true);
      const [projRes, phasesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`, { cache: "no-store" }),
        fetch(`/api/projects/${projectId}/phases`, { cache: "no-store" }),
      ]);

      const projJson = await projRes.json();
      if (projRes.ok && projJson.success) {
        setProject(projJson.data);
      }

      const phasesJson = await phasesRes.json();
      if (phasesRes.ok && phasesJson.success) {
        setPhases(phasesJson.data.phases || []);
      }
    } catch (e) {
      setFeedback({ type: "error", message: e instanceof Error ? e.message : "Error loading schedule" });
    } finally {
      setLoadingPhases(false);
    }
  }, [projectId]);

  const [currentTimestamp] = useState(() => Date.now());

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) loadProjectAndPhases();
    });
    return () => {
      ignore = true;
    };
  }, [loadProjectAndPhases]);

  // Transformed Milestones
  const milestones: MilestoneItem[] = useMemo(() => {
    return milestoneRecords.map((r) => {
      const d = r.data || {};
      return {
        _id: r._id,
        title: r.title || d.title || "Project Milestone",
        targetDate: d.targetDate || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        phaseName: d.phaseName,
        isCriticalPath: Boolean(d.isCriticalPath),
        status: (r.status as MilestoneItem["status"]) || (d.status as MilestoneItem["status"]) || "Pending",
        notes: d.notes,
      };
    });
  }, [milestoneRecords]);

  // Schedule math
  const scheduleMeta = useMemo(() => {
    if (!project) return null;
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.expectedEndDate).getTime();

    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(0, Math.round((currentTimestamp - start) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.round((end - currentTimestamp) / (1000 * 60 * 60 * 24)));
    const timeProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

    return { totalDays, elapsedDays, remainingDays, timeProgress };
  }, [project, currentTimestamp]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedback({ type: "error", message: "Milestone title is required." });
      return;
    }

    try {
      setSubmitting(true);
      await createMilestoneRecord({
        projectId,
        title: formTitle.trim(),
        status: "Pending",
        data: {
          title: formTitle.trim(),
          targetDate: formDate,
          phaseName: formPhase.trim() || undefined,
          isCriticalPath: formCritical,
          status: "Pending",
          notes: formNotes.trim(),
        },
      });

      setFeedback({ type: "success", message: `Milestone "${formTitle}" added.` });
      setShowAddModal(false);
      setFormTitle("");
      setFormNotes("");
      reloadMilestones();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error creating milestone" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMilestone = async (m: MilestoneItem) => {
    const nextStatus = m.status === "Completed" ? "Pending" : "Completed";
    try {
      await updateMilestoneRecord(m._id, {
        status: nextStatus,
        data: { status: nextStatus },
      });
      setFeedback({ type: "success", message: `Milestone marked as ${nextStatus}.` });
      reloadMilestones();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating milestone" });
    }
  };

  const handleDeleteMilestone = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await removeMilestoneRecord(deletingId);
      setFeedback({ type: "success", message: "Milestone deleted." });
      setShowDeleteModal(false);
      setDeletingId(null);
      reloadMilestones();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete milestone" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm transition-all ${
            feedback.type === "success"
              ? "bg-[#FAFAFA] dark:bg-[#111111] border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]"
              : "bg-[#FAFAFA] dark:bg-[#111111] border-[#303030] text-[#000000] dark:text-[#FFFFFF]"
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-[#666666] dark:text-[#A3A3A3]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Master Program & Roadmap
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Project Timeline & Milestones
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Civil engineering delivery roadmap, baseline schedule duration, and critical path milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/timeline"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            All Projects Schedule
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Duration & Time Elapsed KPIs */}
      {scheduleMeta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
            <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Total Planned Duration</p>
            <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
              {scheduleMeta.totalDays} days
            </p>
          </div>
          <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
            <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Calendar Days Elapsed</p>
            <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
              {scheduleMeta.elapsedDays} days
            </p>
          </div>
          <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
            <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Days Remaining</p>
            <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
              {scheduleMeta.remainingDays} days
            </p>
          </div>
          <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Time Elapsed</p>
              <span className="text-xs font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                {scheduleMeta.timeProgress}%
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={scheduleMeta.timeProgress} />
            </div>
          </div>
        </div>
      )}

      {/* Contractual Milestones Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flag className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF]">
              Contractual Milestones ({milestones.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-[#666666] dark:text-[#A3A3A3]">
            {milestones.filter((m) => m.status === "Completed").length} of {milestones.length} achieved
          </span>
        </div>

        {loadingMilestones && milestones.length === 0 ? (
          <div className="p-8 border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-center bg-[#FFFFFF] dark:bg-[#111111]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#000000] dark:text-[#FFFFFF] mb-2" />
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading contractual milestones...</p>
          </div>
        ) : milestones.length === 0 ? (
          <div className="p-6 border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-center bg-[#FFFFFF] dark:bg-[#111111]">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mb-3">
              No specific contractual milestones logged yet. Add target completion deadlines to monitor schedule risk.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Milestone
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((m) => (
              <div
                key={m._id}
                className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] space-y-3 relative hover:border-[#000000] dark:hover:border-[#FFFFFF] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-[#000000] dark:text-[#FFFFFF]">{m.title}</span>
                      {m.isCriticalPath && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] bg-black/5 dark:bg-white/5">
                          Critical Path
                        </span>
                      )}
                    </div>
                    {m.phaseName && (
                      <p className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">{m.phaseName}</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setDeletingId(m._id);
                      setShowDeleteModal(true);
                    }}
                    className="p-1 rounded text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#D4D4D4] dark:border-[#303030]">
                  <span className="font-mono text-[#666666] dark:text-[#A3A3A3]">Target: {m.targetDate}</span>
                  <button
                    onClick={() => handleToggleMilestone(m)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {m.status === "Completed" ? (
                      <>
                        <Check className="w-3 h-3" />
                        Completed
                      </>
                    ) : (
                      "Pending"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase Roadmap Timeline Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF]">
              Phase Execution Roadmap ({phases.length})
            </h3>
          </div>
        </div>

        {loadingPhases && phases.length === 0 ? (
          <div className="p-8 border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-center bg-[#FFFFFF] dark:bg-[#111111]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#000000] dark:text-[#FFFFFF] mb-2" />
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading phase execution roadmap...</p>
          </div>
        ) : phases.length === 0 ? (
          <div className="p-8 border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-center bg-[#FFFFFF] dark:bg-[#111111]">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
              No phases available. Initialize civil phases in the Phases submodule to view the visual schedule.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] divide-y divide-[#D4D4D4] dark:divide-[#303030]">
            {phases.map((phase) => (
              <div
                key={phase._id}
                className="p-4 hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#666666] dark:text-[#A3A3A3]">
                      #{phase.sequenceNumber}
                    </span>
                    <h4 className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">{phase.name}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                      {phase.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                    <span>
                      Planned: {phase.plannedStart ? new Date(phase.plannedStart).toLocaleDateString() : "TBD"} –{" "}
                      {phase.plannedEnd ? new Date(phase.plannedEnd).toLocaleDateString() : "TBD"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 min-w-[200px] justify-between md:justify-end">
                  <div className="w-32">
                    <div className="flex justify-between text-[11px] font-mono mb-1 text-[#666666] dark:text-[#A3A3A3]">
                      <span>Progress</span>
                      <span className="font-bold text-[#000000] dark:text-[#FFFFFF]">{phase.completionPercentage}%</span>
                    </div>
                    <ProgressBar value={phase.completionPercentage} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD MILESTONE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <Flag className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Add Contractual Milestone</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Milestone Name *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Substructure Handover & Inspection"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Target Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Associated Phase
                </label>
                <select
                  value={formPhase}
                  onChange={(e) => setFormPhase(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                >
                  <option value="">General Project Milestone</option>
                  {phases.map((p) => (
                    <option key={p._id} value={p.name}>
                      Phase {p.sequenceNumber}: {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="criticalPath"
                  checked={formCritical}
                  onChange={(e) => setFormCritical(e.target.checked)}
                  className="accent-black dark:accent-white rounded"
                />
                <label htmlFor="criticalPath" className="text-xs text-[#000000] dark:text-[#FFFFFF]">
                  Mark as Critical Path Item (Delays impact project delivery)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Notes / Success Criteria
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Requires municipal engineer sign-off..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-[#000000] dark:text-[#FFFFFF] mb-3">
              <div className="p-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-black/5 dark:bg-white/5">
                <Trash2 className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
              </div>
              <h3 className="text-base font-bold">Remove Milestone</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to remove this project milestone?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteMilestone}
                className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
