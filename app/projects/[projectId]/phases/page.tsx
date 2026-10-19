"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Layers,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface PhaseRecord {
  _id: string;
  name: string;
  description?: string;
  sequenceNumber: number;
  order?: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  plannedPercentage: number;
  completionPercentage: number;
  actualPercentage?: number;
  budget?: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  assignedManager?: { _id: string; fullName: string; username?: string; role?: string };
  notes?: string;
}

interface SummaryData {
  totalPhases: number;
  completedPhases: number;
  inProgressPhases: number;
  overallProgress: number;
}

export default function ProjectPhasesPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [phases, setPhases] = useState<PhaseRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalPhases: 0,
    completedPhases: 0,
    inProgressPhases: 0,
    overallProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSeq, setFormSeq] = useState(1);
  const [formWeight, setFormWeight] = useState(10);
  const [formBudget, setFormBudget] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const loadPhases = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/phases`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success) {
        setPhases(json.data.phases || []);
        setSummary(
          json.data.summary || {
            totalPhases: 0,
            completedPhases: 0,
            inProgressPhases: 0,
            overallProgress: 0,
          }
        );
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to load phases" });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error loading project phases" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) loadPhases();
    });
    return () => {
      ignore = true;
    };
  }, [loadPhases]);

  const handleInitTemplates = async () => {
    if (!confirm("Initialize the 12 standard civil construction phases for this project?")) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/projects/${projectId}/phases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INIT_TEMPLATES" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: "12 Construction Phases initialized successfully!" });
        loadPhases();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to initialize templates" });
      }
    } catch {
      setFeedback({ type: "error", message: "Error initializing phase templates" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/projects/${projectId}/phases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim(),
          sequenceNumber: Number(formSeq),
          plannedPercentage: Number(formWeight),
          budget: Number(formBudget || 0),
          plannedStart: formStart || undefined,
          plannedEnd: formEnd || undefined,
          notes: formNotes.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: `Phase "${formName}" created successfully` });
        setShowAddModal(false);
        resetForm();
        loadPhases();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to create phase" });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error creating phase" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePhase = async (phaseId: string, updates: Partial<PhaseRecord>) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/phases`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId, updates }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: "Phase updated successfully" });
        loadPhases();
        setShowEditModal(false);
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to update phase" });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error updating phase" });
    }
  };

  const handleDeletePhase = async () => {
    if (!deletingPhaseId) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/projects/${projectId}/phases?phaseId=${deletingPhaseId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: "Phase removed successfully" });
        setShowDeleteModal(false);
        setDeletingPhaseId(null);
        loadPhases();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to delete phase" });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error deleting phase" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormSeq(phases.length + 1);
    setFormWeight(10);
    setFormBudget("");
    setFormStart("");
    setFormEnd("");
    setFormNotes("");
  };

  const openEdit = (p: PhaseRecord) => {
    setEditingPhase(p);
    setFormName(p.name);
    setFormDescription(p.description || "");
    setFormSeq(p.sequenceNumber || p.order || 1);
    setFormWeight(p.plannedPercentage || 0);
    setFormBudget(p.budget ? String(p.budget) : "");
    setFormStart(p.plannedStart ? p.plannedStart.slice(0, 10) : "");
    setFormEnd(p.plannedEnd ? p.plannedEnd.slice(0, 10) : "");
    setFormNotes(p.notes || "");
    setShowEditModal(true);
  };

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
            <Layers className="w-4 h-4" /> Work Breakdown Structure
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
            Construction Project Phases
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Manage stage gates, planned completion weights, milestone schedules, and phase approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {phases.length === 0 && (
            <button
              onClick={handleInitTemplates}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Initialize 12 Templates</span>
            </button>
          )}

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Phase</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-[#FAFAFA] dark:bg-[#111111] border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]"
              : "bg-[#FAFAFA] dark:bg-[#171717] border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold px-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-[11px] font-mono uppercase font-bold text-[#666666] dark:text-[#A3A3A3]">
            Overall Phase Progress
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">
              {summary.overallProgress}%
            </span>
            <span className="text-xs text-[#666666] dark:text-[#A3A3A3]">weighted</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={summary.overallProgress} />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-[11px] font-mono uppercase font-bold text-[#666666] dark:text-[#A3A3A3]">
            Total Project Phases
          </p>
          <span className="mt-2 block text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">
            {summary.totalPhases}
          </span>
          <p className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] mt-1">Configured stages</p>
        </div>

        <div className="p-5 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-[11px] font-mono uppercase font-bold text-[#666666] dark:text-[#A3A3A3]">
            In Progress Phases
          </p>
          <span className="mt-2 block text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">
            {summary.inProgressPhases}
          </span>
          <p className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] mt-1">Active site execution</p>
        </div>

        <div className="p-5 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-[11px] font-mono uppercase font-bold text-[#666666] dark:text-[#A3A3A3]">
            Completed Phases
          </p>
          <span className="mt-2 block text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">
            {summary.completedPhases}
          </span>
          <p className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] mt-1">Verified and approved</p>
        </div>
      </div>

      {/* Phases List */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#000000] dark:text-[#FFFFFF] mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading project phases...</p>
        </div>
      ) : phases.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] space-y-4">
          <Layers className="w-10 h-10 mx-auto text-[#666666] dark:text-[#A3A3A3]" />
          <div>
            <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">No phases defined yet</h3>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-md mx-auto mt-1">
              Initialize the standard 12 civil engineering phases or add customized stage gates to start tracking site progress.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleInitTemplates}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              Initialize 12 Construction Templates
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-bold text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
            >
              Add Custom Phase
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => {
            const completion = phase.completionPercentage ?? phase.actualPercentage ?? 0;
            const weight = phase.plannedPercentage || 0;
            const budgetFormatted = phase.budget ? `ETB ${Number(phase.budget).toLocaleString()}` : "—";

            return (
              <div
                key={phase._id}
                className="p-5 sm:p-6 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] hover:border-[#000000] dark:hover:border-[#FFFFFF] transition-all shadow-xs space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#F5F5F5] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] text-xs font-mono font-bold flex items-center justify-center text-[#000000] dark:text-[#FFFFFF] shrink-0">
                      #{String(phase.sequenceNumber).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">{phase.name}</h3>
                      {phase.description && (
                        <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5 max-w-2xl font-normal">
                          {phase.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge value={phase.status} />
                    <button
                      onClick={() => openEdit(phase)}
                      className="p-1.5 rounded-lg border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
                      title="Edit Phase"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingPhaseId(phase._id);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 rounded-lg border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
                      title="Delete Phase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata & Progress */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] uppercase block">
                      Weight Contribution
                    </span>
                    <strong className="text-[#000000] dark:text-[#FFFFFF] font-mono text-xs">{weight}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] uppercase block">
                      Allocated Budget
                    </span>
                    <strong className="text-[#000000] dark:text-[#FFFFFF] font-mono text-xs">{budgetFormatted}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] uppercase block">
                      Timeline Target
                    </span>
                    <span className="text-[#000000] dark:text-[#FFFFFF] text-[11px]">
                      {phase.plannedStart ? new Date(phase.plannedStart).toLocaleDateString() : "—"} →{" "}
                      {phase.plannedEnd ? new Date(phase.plannedEnd).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] uppercase block">
                      Phase Manager
                    </span>
                    <span className="text-[#000000] dark:text-[#FFFFFF] text-[11px] font-medium">
                      {phase.assignedManager?.fullName || "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Progress bar and Quick Completion Controls */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[11px] font-medium text-[#666666] dark:text-[#A3A3A3]">
                      Completion Progress
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">{completion}%</span>
                      {completion === 100 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-bold">
                          ✓ COMPLETE
                        </span>
                      )}
                    </div>
                  </div>
                  <ProgressBar value={completion} />

                  {/* Quick percentage adjustment chips */}
                  <div className="flex items-center gap-2 mt-3 pt-2">
                    <span className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] mr-1">Quick Set:</span>
                    {[0, 25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleUpdatePhase(phase._id, { completionPercentage: pct })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                          completion === pct
                            ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border-[#000000] dark:border-[#FFFFFF]"
                            : "bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-[#D4D4D4] dark:border-[#303030] hover:border-[#000000] dark:hover:border-[#FFFFFF]"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}

                    <div className="ml-auto flex items-center gap-2">
                      {phase.status !== "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdatePhase(phase._id, { status: "COMPLETED", completionPercentage: 100 })}
                          className="px-2.5 py-1 rounded-lg bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-[10px] font-bold transition-opacity hover:opacity-90 cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                      {phase.status === "NOT_STARTED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdatePhase(phase._id, { status: "IN_PROGRESS" })}
                          className="px-2.5 py-1 rounded-lg border border-[#D4D4D4] dark:border-[#303030] text-[10px] font-bold text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] cursor-pointer"
                        >
                          Start Phase
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ADD PHASE MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
              <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Add Construction Phase</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#666666] hover:text-[#000000] dark:hover:text-[#FFFFFF] cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePhase} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Phase Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Substructure Concrete Works"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Scope & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Deliverables, technical standards, or site boundaries..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Sequence #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formSeq}
                    onChange={(e) => setFormSeq(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Weight Contribution (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Planned Start Date
                  </label>
                  <input
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Planned End Date
                  </label>
                  <input
                    type="date"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Allocated Phase Budget (ETB)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 5000000"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Create Phase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT PHASE MODAL ─── */}
      {showEditModal && editingPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
              <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Edit Construction Phase</h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#666666] hover:text-[#000000] dark:hover:text-[#FFFFFF] cursor-pointer">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdatePhase(editingPhase._id, {
                  name: formName.trim(),
                  description: formDescription.trim(),
                  sequenceNumber: Number(formSeq),
                  plannedPercentage: Number(formWeight),
                  budget: Number(formBudget || 0),
                  plannedStart: formStart ? formStart : undefined,
                  plannedEnd: formEnd ? formEnd : undefined,
                  notes: formNotes.trim(),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Phase Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Scope & Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Sequence #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formSeq}
                    onChange={(e) => setFormSeq(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Weight Contribution (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Planned Start Date
                  </label>
                  <input
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Planned End Date
                  </label>
                  <input
                    type="date"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Allocated Phase Budget (ETB)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Confirm Phase Deletion</h3>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to remove this phase? Removing a phase will trigger a recalculation of overall project weighted progress.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePhase}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Removing..." : "Delete Phase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

