"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  X,
  Trash2,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface IssueItem {
  _id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  locationGrid?: string;
  description: string;
  assignedTo?: string;
  reportedBy: string;
  reportedDate: string;
  correctiveAction?: string;
}

const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUSES = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function ProjectIssuesPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    records: issueRecords,
    loading,
    reload: reloadIssues,
    create: createIssueRecord,
    update: updateIssueRecord,
    remove: removeIssueRecord,
  } = useRecords("issues", projectId);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formSeverity, setFormSeverity] = useState<IssueItem["severity"]>("HIGH");
  const [formLocation, setFormLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formAction, setFormAction] = useState("");

  const issues: IssueItem[] = useMemo(() => {
    return issueRecords.map((r) => {
      const d = r.data || {};
      return {
        _id: r._id,
        title: r.title || d.title || "Site Issue",
        severity: (d.severity as IssueItem["severity"]) || "MEDIUM",
        status: (r.status as IssueItem["status"]) || (d.status as IssueItem["status"]) || "OPEN",
        locationGrid: d.locationGrid || "Site Wide",
        description: d.description || r.title || "Quality snag / defect",
        assignedTo: d.assignedTo || "Lead Engineer",
        reportedBy: d.reportedBy || "QC Inspector",
        reportedDate: d.reportedDate || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        correctiveAction: d.correctiveAction,
      };
    });
  }, [issueRecords]);

  const stats = useMemo(() => {
    const total = issues.length;
    const critical = issues.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").length;
    const open = issues.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS").length;
    const resolved = issues.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;
    return { total, critical, open, resolved };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      if (severityFilter !== "ALL" && item.severity !== severityFilter) return false;
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.locationGrid || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [issues, severityFilter, statusFilter, search]);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedback({ type: "error", message: "Issue title is required." });
      return;
    }

    try {
      setSubmitting(true);
      await createIssueRecord({
        projectId,
        title: formTitle.trim(),
        status: "OPEN",
        data: {
          title: formTitle.trim(),
          severity: formSeverity,
          status: "OPEN",
          locationGrid: formLocation.trim() || "General Area",
          description: formDescription.trim(),
          assignedTo: formAssignedTo.trim() || "Site Supervisor",
          reportedBy: "Quality Engineer",
          reportedDate: new Date().toISOString().split("T")[0],
          correctiveAction: formAction.trim(),
        },
      });

      setFeedback({ type: "success", message: `Issue "${formTitle}" logged.` });
      setShowAddModal(false);
      setFormTitle("");
      setFormDescription("");
      setFormLocation("");
      setFormAction("");
      reloadIssues();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error logging issue" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (issue: IssueItem, newStatus: IssueItem["status"]) => {
    try {
      await updateIssueRecord(issue._id, {
        status: newStatus,
        data: { status: newStatus },
      });
      setFeedback({ type: "success", message: `Issue marked as ${newStatus}.` });
      reloadIssues();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating issue status" });
    }
  };

  const handleDeleteIssue = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await removeIssueRecord(deletingId);
      setFeedback({ type: "success", message: "Issue removed." });
      setShowDeleteModal(false);
      setDeletingId(null);
      reloadIssues();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete issue" });
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
              Quality Assurance & Defect Tracking
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Site Issues & Snags
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Non-conformance reports (NCR), structural clashes, material defects, and remediation punch lists.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Log Site Issue
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Total Snags</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Critical / High Risk</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.critical}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Active Open</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.open}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Resolved / Closed</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters and List */}
      <div className="p-3.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snags by description, grid, or title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Severities" : s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading project snags...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <AlertTriangle className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
          <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">Zero defects logged</h3>
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
            Log quality snags, non-compliance reports, and site clash detections to assign accountable engineers.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log First Issue
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                <th className="py-3 px-4 font-semibold">Issue Title & Scope</th>
                <th className="py-3 px-4 font-semibold">Location / Grid</th>
                <th className="py-3 px-4 font-semibold text-center">Severity</th>
                <th className="py-3 px-4 font-semibold">Assigned To</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
              {filteredIssues.map((issue) => (
                <tr key={issue._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#000000] dark:text-[#FFFFFF]">{issue.title}</div>
                    <div className="text-[11px] text-[#666666] dark:text-[#A3A3A3] line-clamp-1 max-w-sm mt-0.5">
                      {issue.description}
                    </div>
                    {issue.correctiveAction && (
                      <div className="text-[10px] font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
                        Remediation: {issue.correctiveAction}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#666666] dark:text-[#A3A3A3]">{issue.locationGrid}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                      {issue.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{issue.assignedTo}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                      {issue.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {issue.status !== "RESOLVED" && (
                        <button
                          onClick={() => handleStatusToggle(issue, "RESOLVED")}
                          title="Mark Resolved"
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#000000] dark:text-[#FFFFFF]"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDeletingId(issue._id);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LOG ISSUE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Log Quality Issue / Defect</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Honeycombing on Shear Wall Column Grid 4B"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Severity Level
                  </label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as IssueItem["severity"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="CRITICAL">Critical (Stop Work)</option>
                    <option value="HIGH">High (Major Remediation)</option>
                    <option value="MEDIUM">Medium (Minor Snag)</option>
                    <option value="LOW">Low (Cosmetic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Location / Column Grid
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Level 3, Axis C-7"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Responsible Engineer / Subcontractor
                </label>
                <input
                  type="text"
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(e.target.value)}
                  placeholder="e.g. Structural Subcontractor Foreman"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Defect Description & Evidence
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Inadequate vibration during casting, exposed aggregate..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Required Corrective Action
                </label>
                <input
                  type="text"
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  placeholder="Chipping loose material and applying approved epoxy mortar..."
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
                  Submit Issue
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
              <h3 className="text-base font-bold">Remove Defect Record</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to remove this quality snag record?
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
                onClick={handleDeleteIssue}
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
