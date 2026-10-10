"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell, { useSearch } from "@/components/layout/AppShell";
import {
  CheckSquare,
  Plus,
  Search,
  User,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/components/auth/UserProvider";

interface TaskRecord {
  _id: string;
  title: string;
  projectId?: { _id: string; name: string; projectCode?: string };
  assignedTo?: { _id: string; fullName: string; username?: string; role?: string };
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "BLOCKED";
  progress: number;
  dueDate?: string;
  description?: string;
}

interface ProjectOption {
  _id: string;
  name: string;
  projectCode?: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  MEDIUM: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
  HIGH: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  CRITICAL: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export default function TasksPage() {
  const { user } = useCurrentUser();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Create Task Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formPriority, setFormPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [formStatus, setFormStatus] = useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "BLOCKED">("NOT_STARTED");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/projects?limit=50", { cache: "no-store" }),
      ]);
      const tasksJson = await tasksRes.json();
      if (tasksRes.ok && tasksJson.success && tasksJson.data?.items) {
        setTasks(tasksJson.data.items);
      }
      if (projectsRes.ok) {
        const projJson = await projectsRes.json();
        if (projJson.success && projJson.data?.items) {
          setProjects(projJson.data.items);
          if (projJson.data.items.length > 0 && !formProjectId) {
            setFormProjectId(projJson.data.items[0]._id);
          }
        }
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to load tasks data." });
    } finally {
      setLoading(false);
    }
  }, [formProjectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create Task Submission
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedback({ type: "error", message: "Task title is required." });
      return;
    }
    if (!formProjectId) {
      setFeedback({ type: "error", message: "Please select an assigned project." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload: Record<string, unknown> = {
        title: formTitle.trim(),
        projectId: formProjectId,
        assignedTo: user?.id || "000000000000000000000000",
        priority: formPriority,
        status: formStatus,
        description: formDescription || undefined,
        dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create task");
      }

      setFeedback({ type: "success", message: "Task created successfully!" });
      setShowCreateModal(false);
      setFormTitle("");
      setFormDescription("");
      setFormDueDate("");
      await fetchTasks();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error creating task.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Update
  const handleStatusChange = async (taskId: string, newStatus: TaskRecord["status"]) => {
    try {
      const progressVal = newStatus === "COMPLETED" ? 100 : newStatus === "IN_PROGRESS" ? 50 : 0;
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus, progress: progressVal }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t._id === taskId ? { ...t, status: newStatus, progress: progressVal } : t
          )
        );
        setFeedback({ type: "success", message: `Task status updated to ${newStatus.replace("_", " ")}.` });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to update task status." });
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks?taskId=${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        setFeedback({ type: "success", message: "Task deleted successfully." });
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to delete task." });
    }
  };

  const { searchQuery: globalQuery, setSearchQuery: setGlobalQuery } = useSearch();
  const effectiveSearch = (search || globalQuery || "").trim().toLowerCase();

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !effectiveSearch ||
      t.title.toLowerCase().includes(effectiveSearch) ||
      (t.projectId?.name && t.projectId.name.toLowerCase().includes(effectiveSearch)) ||
      (t.assignedTo?.fullName && t.assignedTo.fullName.toLowerCase().includes(effectiveSearch));
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleClearFilters = () => {
    setSearch("");
    setGlobalQuery("");
    setStatusFilter("ALL");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C9A15A] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <CheckSquare className="w-4 h-4" /> Work Breakdown &amp; Execution
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#F4F4F5] tracking-tight">
              Site Tasks &amp; Activities
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#A7ABB3] mt-1">
              Coordinate trade assignments, milestone deadlines, and progress logs across all projects.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* User Feedback Notification */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks by title, project, assignee..."
              value={search || globalQuery}
              onChange={(e) => {
                setSearch(e.target.value);
                setGlobalQuery(e.target.value);
              }}
              className="w-full bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] text-slate-900 dark:text-slate-100 text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-[#C9A15A] focus:ring-1 focus:ring-[#C9A15A]/30 transition-all shadow-xs"
            />
            {(search || globalQuery) && (
              <button
                onClick={handleClearFilters}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? "bg-[#C9A15A] text-slate-950 font-bold shadow-xs"
                    : "bg-white dark:bg-[#16181D] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2F333A]"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Table / Glass Card */}
        <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#121418]/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-[#2F333A]">
                <tr>
                  <th className="px-5 py-3">Task Title</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2F333A]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#C9A15A]" />
                        <span>Loading tasks catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                      <div className="space-y-2 max-w-sm mx-auto">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {effectiveSearch
                            ? `No tasks found matching "${effectiveSearch}"`
                            : "No tasks found matching your filter criteria."}
                        </p>
                        <p className="text-xs text-slate-400">
                          Try adjusting your search terms or clearing the selected status tab.
                        </p>
                        {(effectiveSearch || statusFilter !== "ALL") && (
                          <button
                            onClick={handleClearFilters}
                            className="mt-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2F333A] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr
                      key={t._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#1A1D24]/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-[#F4F4F5]">
                        {t.title}
                        {t.description && (
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate max-w-xs mt-0.5">
                            {t.description}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {t.projectId?.name || "Addis Project"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t.assignedTo?.fullName || "Site Team"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.MEDIUM
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Flexible"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-[#1F2432] overflow-hidden">
                            <div
                              className="h-full bg-[#C9A15A] rounded-full transition-all duration-300"
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {t.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={t.status}
                          onChange={(e) =>
                            handleStatusChange(t._id, e.target.value as TaskRecord["status"])
                          }
                          className="text-xs bg-slate-100 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 outline-none focus:border-[#C9A15A] cursor-pointer"
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="DELAYED">Delayed</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteTask(t._id, t.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create Task Dialog */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2F333A]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#C9A15A]/15 text-[#C9A15A]">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Create New Site Task
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add a trade deliverable or work milestone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Concrete Pouring - Level 4 Slab"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C9A15A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Project *
                  </label>
                  <select
                    required
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C9A15A]"
                  >
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.projectCode ? `(${p.projectCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) =>
                        setFormPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
                      }
                      className="w-full bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C9A15A]"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Initial Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) =>
                        setFormStatus(
                          e.target.value as
                            | "NOT_STARTED"
                            | "IN_PROGRESS"
                            | "COMPLETED"
                            | "DELAYED"
                            | "BLOCKED"
                        )
                      }
                      className="w-full bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C9A15A]"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="DELAYED">Delayed</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C9A15A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Description / Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Details for foreman, supervisor or subcontractors..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C9A15A]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#2F333A]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2F333A] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Task...</span>
                      </>
                    ) : (
                      <span>Save Task</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
