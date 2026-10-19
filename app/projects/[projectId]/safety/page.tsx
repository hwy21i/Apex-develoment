"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useRecords } from "@/hooks/useRecords";

interface SafetyLogItem {
  _id: string;
  type: "Toolbox Talk" | "Near Miss" | "PPE Violation" | "Equipment Inspection" | "First Aid Incident" | "Lost Time Incident";
  date: string;
  locationArea: string;
  description: string;
  attendeesCount?: number;
  reportedBy: string;
  correctiveAction?: string;
  status: "Open" | "Resolved" | "Recorded";
}

const SAFETY_TYPES = [
  "ALL",
  "Toolbox Talk",
  "Near Miss",
  "PPE Violation",
  "Equipment Inspection",
  "First Aid Incident",
  "Lost Time Incident",
];

export default function ProjectSafetyPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    records: safetyRecords,
    loading,
    reload: reloadSafety,
    create: createSafetyRecord,
    remove: removeSafetyRecord,
  } = useRecords("safety", projectId);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formType, setFormType] = useState<SafetyLogItem["type"]>("Toolbox Talk");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formLocation, setFormLocation] = useState("");
  const [formAttendees, setFormAttendees] = useState("24");
  const [formDescription, setFormDescription] = useState("");
  const [formAction, setFormAction] = useState("");
  const [formReporter, setFormReporter] = useState("HSE Officer");

  const logs: SafetyLogItem[] = useMemo(() => {
    return safetyRecords.map((r) => {
      const d = r.data || {};
      return {
        _id: r._id,
        type: (d.type as SafetyLogItem["type"]) || "Toolbox Talk",
        date: d.date || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        locationArea: d.locationArea || "Site Perimeter",
        description: d.description || r.title || "Safety compliance log",
        attendeesCount: Number(d.attendeesCount) || undefined,
        reportedBy: d.reportedBy || "HSE Supervisor",
        correctiveAction: d.correctiveAction,
        status: (r.status as SafetyLogItem["status"]) || "Recorded",
      };
    });
  }, [safetyRecords]);

  const stats = useMemo(() => {
    const total = logs.length;
    const toolboxTalks = logs.filter((l) => l.type === "Toolbox Talk").length;
    const incidents = logs.filter((l) => l.type.includes("Incident") || l.type === "Near Miss").length;
    const daysZeroLTI = 142; // standard enterprise safe-days tracker
    return { total, toolboxTalks, incidents, daysZeroLTI };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter !== "ALL" && log.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          log.type.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          log.locationArea.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, typeFilter, search]);

  const handleCreateSafetyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      setFeedback({ type: "error", message: "Safety description is required." });
      return;
    }

    try {
      setSubmitting(true);
      await createSafetyRecord({
        projectId,
        title: `${formType} - ${formLocation || "Site"}`,
        status: "Recorded",
        data: {
          type: formType,
          date: formDate,
          locationArea: formLocation.trim() || "Main Site",
          attendeesCount: Number(formAttendees) || 0,
          description: formDescription.trim(),
          correctiveAction: formAction.trim(),
          reportedBy: formReporter.trim(),
        },
      });

      setFeedback({ type: "success", message: `HSE record logged successfully.` });
      setShowAddModal(false);
      setFormDescription("");
      setFormAction("");
      reloadSafety();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error logging safety entry" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await removeSafetyRecord(deletingId);
      setFeedback({ type: "success", message: "Safety record deleted." });
      setShowDeleteModal(false);
      setDeletingId(null);
      reloadSafety();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete record" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
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
              Health, Safety & Environment (HSE)
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Site Safety Management
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Pre-shift toolbox talks, PPE compliance observations, scaffold inspections, and incident logs.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Log HSE Event
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Days Without LTI</p>
          <p className="text-3xl font-extrabold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.daysZeroLTI}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Toolbox Briefings</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.toolboxTalks}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Reported Incidents</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.incidents}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Total HSE Records</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.total}</p>
        </div>
      </div>

      {/* Filter and List */}
      <div className="p-3.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search safety topics, locations, remarks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
          >
            {SAFETY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading HSE compliance records...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <ShieldCheck className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
          <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">Zero safety incidents</h3>
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
            Log morning toolbox briefings, equipment pre-operational checklists, and PPE compliance audits.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log First Toolbox Talk
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                <th className="py-3 px-4 font-semibold">Event Type</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Location Area</th>
                <th className="py-3 px-4 font-semibold">Description / Topic</th>
                <th className="py-3 px-4 font-semibold text-right">Headcount</th>
                <th className="py-3 px-4 font-semibold">Officer</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                      {log.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#666666] dark:text-[#A3A3A3] whitespace-nowrap">
                    {log.date}
                  </td>
                  <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{log.locationArea}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#000000] dark:text-[#FFFFFF]">{log.description}</div>
                    {log.correctiveAction && (
                      <div className="text-[10px] text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                        Action: {log.correctiveAction}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#000000] dark:text-[#FFFFFF]">
                    {log.attendeesCount ? `${log.attendeesCount} attended` : "—"}
                  </td>
                  <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{log.reportedBy}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setDeletingId(log._id);
                        setShowDeleteModal(true);
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

      {/* LOG SAFETY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Log Safety Observation / Talk</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSafetyLog} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Event Classification *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as SafetyLogItem["type"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    {SAFETY_TYPES.filter((t) => t !== "ALL").map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Site Location / Area
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Scaffolding Bay Level 6"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Worker Attendees
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formAttendees}
                    onChange={(e) => setFormAttendees(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Description / Topic / Findings *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Topic: Working at heights fall protection; inspected harnesses and lanyard attachment points..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Corrective Action / Resolution
                </label>
                <input
                  type="text"
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  placeholder="Installed toe boards and additional perimeter safety nets..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Reported By
                </label>
                <input
                  type="text"
                  value={formReporter}
                  onChange={(e) => setFormReporter(e.target.value)}
                  placeholder="e.g. HSE Officer"
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
                  Save HSE Record
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
              <h3 className="text-base font-bold">Remove Safety Record</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to remove this safety log?
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
                onClick={handleDeleteLog}
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
