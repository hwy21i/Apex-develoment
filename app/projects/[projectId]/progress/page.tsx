"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  Plus,
  CheckCircle2,
  Layers,
  Loader2,
  X,
  Trash2,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useRecords } from "@/hooks/useRecords";

interface PhaseRecord {
  _id: string;
  name: string;
  sequenceNumber: number;
  completionPercentage: number;
  status: string;
}

interface ProgressLogItem {
  _id: string;
  date: string;
  phaseName: string;
  progressPercentage: number;
  workDescription: string;
  inspectorName: string;
  status: string;
}

export default function ProjectProgressPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [project, setProject] = useState<{
    _id: string;
    name: string;
    projectCode: string;
    progressPercentage: number;
    currentPhase?: string;
  } | null>(null);

  const [phases, setPhases] = useState<PhaseRecord[]>([]);
  const [loadingPhases, setLoadingPhases] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Operational records store for progress logs
  const {
    records: progressRecords,
    loading: loadingRecords,
    reload: reloadRecords,
    create: createProgressRecord,
    remove: removeProgressRecord,
  } = useRecords("progress", projectId);

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formPhaseId, setFormPhaseId] = useState("");
  const [formProgress, setFormProgress] = useState("50");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formInspector, setFormInspector] = useState("Resident Engineer");

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
      setFeedback({ type: "error", message: e instanceof Error ? e.message : "Error loading progress" });
    } finally {
      setLoadingPhases(false);
    }
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) loadProjectAndPhases();
    });
    return () => {
      ignore = true;
    };
  }, [loadProjectAndPhases]);

  // Transform logs
  const logs: ProgressLogItem[] = useMemo(() => {
    return progressRecords.map((r) => {
      const d = r.data || {};
      return {
        _id: r._id,
        date: d.date || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        phaseName: d.phaseName || r.title || "Project Progress Update",
        progressPercentage: Number(d.progressPercentage ?? d.progress) || 0,
        workDescription: d.workDescription || d.description || r.title || "Milestone milestone inspection",
        inspectorName: d.inspectorName || d.recordedBy || "Site Inspector",
        status: r.status || "Verified",
      };
    });
  }, [progressRecords]);

  // Overall progress
  const overallProgress = project?.progressPercentage || 0;

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      setFeedback({ type: "error", message: "Work description is required." });
      return;
    }

    try {
      setSubmitting(true);
      const selectedPhase = phases.find((p) => p._id === formPhaseId);
      const phaseTitle = selectedPhase ? selectedPhase.name : "General Site Work";
      const progressNum = Number(formProgress);

      await createProgressRecord({
        projectId,
        title: `${phaseTitle}: ${progressNum}% Complete`,
        status: "Verified",
        data: {
          phaseId: formPhaseId || undefined,
          phaseName: phaseTitle,
          progressPercentage: progressNum,
          workDescription: formDescription.trim(),
          date: formDate,
          inspectorName: formInspector.trim(),
        },
      });

      // Also update phase completion if a phase was chosen
      if (formPhaseId) {
        await fetch(`/api/projects/${projectId}/phases`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phaseId: formPhaseId,
            completionPercentage: progressNum,
            status: progressNum >= 100 ? "COMPLETED" : progressNum > 0 ? "IN_PROGRESS" : "NOT_STARTED",
          }),
        });
        loadProjectAndPhases();
      }

      setFeedback({ type: "success", message: `Progress update logged for ${phaseTitle}.` });
      setShowLogModal(false);
      setFormDescription("");
      reloadRecords();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error logging progress" });
    } finally {
      setSubmitting(false);
    }
  };

  const loading = loadingPhases || loadingRecords;

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
              Engineering Measurement
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Project Progress
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Physical progress tracking, verified site inspections, and cumulative milestone velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/phases`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Manage Phases
          </Link>
          <button
            onClick={() => setShowLogModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Site Progress
          </button>
        </div>
      </div>

      {/* Overall Progress Meter Card */}
      <div className="p-6 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Cumulative Physical Progress
            </span>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-4xl font-extrabold font-mono text-[#000000] dark:text-[#FFFFFF]">
                {overallProgress}%
              </span>
              <span className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                Weighted across {phases.length} civil phases
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
              Active Phase: {project?.currentPhase || phases[0]?.name || "Pre-construction"}
            </span>
          </div>
        </div>

        <div>
          <ProgressBar value={overallProgress} />
        </div>
      </div>

      {/* Phase Completion Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF]">
          Phase Completion Breakdown
        </h3>

        {phases.length === 0 ? (
          <div className="p-6 border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-center bg-[#FFFFFF] dark:bg-[#111111]">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">No phases found for this project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.map((phase) => (
              <div
                key={phase._id}
                className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                      Phase {phase.sequenceNumber}
                    </span>
                    <h4 className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF] line-clamp-1">{phase.name}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                    {phase.completionPercentage}%
                  </span>
                </div>

                <ProgressBar value={phase.completionPercentage} />

                <div className="flex items-center justify-between text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                  <span>Status:</span>
                  <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">
                    {phase.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Progress Logs Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF]">
          Verified Site Inspection Logs ({logs.length})
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
            <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading progress logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
            <TrendingUp className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
            <h4 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No progress entries logged</h4>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-4">
              Site inspectors and resident engineers can log verified physical measurements and percentage completions here.
            </p>
            <button
              onClick={() => setShowLogModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Log First Entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Phase / Work Scope</th>
                  <th className="py-3 px-4 font-semibold">Measurement Description</th>
                  <th className="py-3 px-4 font-semibold text-right">Completion</th>
                  <th className="py-3 px-4 font-semibold">Inspected By</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#666666] dark:text-[#A3A3A3] whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#000000] dark:text-[#FFFFFF]">{log.phaseName}</td>
                    <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{log.workDescription}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {log.progressPercentage}%
                    </td>
                    <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{log.inspectorName}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={async () => {
                          await removeProgressRecord(log._id);
                          reloadRecords();
                        }}
                        className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LOG PROGRESS MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Log Progress Measurement</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogProgress} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Project Phase
                </label>
                <select
                  value={formPhaseId}
                  onChange={(e) => setFormPhaseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                >
                  <option value="">General Project Scope</option>
                  {phases.map((p) => (
                    <option key={p._id} value={p._id}>
                      Phase {p.sequenceNumber}: {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Inspection Date *
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
                    Completion: {formProgress}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formProgress}
                    onChange={(e) => setFormProgress(e.target.value)}
                    className="w-full accent-black dark:accent-white mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Inspector / Engineer Name
                </label>
                <input
                  type="text"
                  required
                  value={formInspector}
                  onChange={(e) => setFormInspector(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Scope & Measurement Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Completed concrete casting on Level 4 beam framework, cube strength tests passed..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
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
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
