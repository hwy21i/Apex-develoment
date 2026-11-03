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
  RefreshCw,
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
  LOW: "bg-transparent text-[#666666] dark:text-[#A3A3A3] border border-dashed border-[#D4D4D4] dark:border-[#303030]",
  MEDIUM: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  HIGH: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  CRITICAL: "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] font-bold border border-[#000000] dark:border-[#FFFFFF]",
};

export default function TasksPage() {
  const { user } = useCurrentUser();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    setLoadError(null);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/projects?limit=50", { cache: "no-store" }),
      ]);
      const tasksJson = await tasksRes.json();
      if (!tasksRes.ok || !tasksJson.success) {
        throw new Error(tasksJson.error?.message || "Failed to load tasks from server.");
      }
      setTasks(tasksJson.data?.items || []);
      if (projectsRes.ok) {
        const projJson = await projectsRes.json();
        if (projJson.success && projJson.data?.items) {
          setProjects(projJson.data.items);
          if (projJson.data.items.length > 0) {
            setFormProjectId((prev) => prev || projJson.data.items[0]._id);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load tasks data.";
      setLoadError(msg);
      setFeedback({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        fetchTasks();
      }
    });
    return () => {
      ignore = true;
    };
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
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <CheckSquare className="w-4 h-4" /> Work Breakdown &amp; Execution
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Site Tasks &amp; Activities
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Coordinate trade assignments, milestone deadlines, and progress logs across all projects.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchTasks()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] transition-colors"
              title="Refresh tasks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* User Feedback Notification */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold"
                : "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] font-bold border border-[#000000] dark:border-[#FFFFFF]"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search tasks by title, project, assignee..."
              value={search || globalQuery}
              onChange={(e) => {
                setSearch(e.target.value);
                setGlobalQuery(e.target.value);
              }}
              className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:ring-1 focus:ring-0 transition-all shadow-xs"
            />
            {(search || globalQuery) && (
              <button
                onClick={handleClearFilters}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] dark:text-[#888888] hover:text-[#666666] dark:text-[#A3A3A3] dark:hover:text-[#FFFFFF] p-0.5 rounded-full"
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
                    ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-bold shadow-xs"
                    : "bg-white dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3] hover:text-[#000000] dark:text-[#FFFFFF] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Table / Glass Card */}
        <div className="glass-card border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717]/80 dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
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
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#666666] dark:text-[#A3A3A3]" />
                        <span>Loading tasks catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <AlertCircle className="w-8 h-8 text-[#666666] dark:text-[#A3A3A3] mx-auto" />
                        <p className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                          Unable to Retrieve Tasks
                        </p>
                        <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">{loadError}</p>
                        <button
                          onClick={() => fetchTasks()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Loading</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <div className="space-y-2 max-w-sm mx-auto">
                        <p className="font-semibold text-[#000000] dark:text-[#FFFFFF]">
                          {effectiveSearch
                            ? `No tasks found matching "${effectiveSearch}"`
                            : "No tasks found matching your filter criteria."}
                        </p>
                        <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                          Try adjusting your search terms or clearing the selected status tab.
                        </p>
                        {(effectiveSearch || statusFilter !== "ALL") && (
                          <button
                            onClick={handleClearFilters}
                            className="mt-2 px-3.5 py-1.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
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
                      className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {t.title}
                        {t.description && (
                          <span className="block text-[11px] text-[#666666] dark:text-[#A3A3A3] font-normal truncate max-w-xs mt-0.5">
                            {t.description}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3] dark:text-[#FFFFFF]">
                        {t.projectId?.name || "Addis Project"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-[#000000] dark:text-[#FFFFFF]">
                          <User className="w-3.5 h-3.5 text-[#666666] dark:text-[#A3A3A3] shrink-0" />
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
                      <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3] whitespace-nowrap">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Flexible"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[#E5E5E5] dark:bg-[#303030] dark:bg-[#111111] overflow-hidden">
                            <div
                              className="h-full bg-[#000000] dark:bg-[#FFFFFF] rounded-full transition-all duration-300"
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#666666] dark:text-[#A3A3A3]">
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
                          className="text-xs bg-[#F5F5F5] dark:bg-[#1F1F1F] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] rounded-lg px-2 py-1 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] cursor-pointer"
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
                          className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
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
          <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4 sm:p-6 flex items-center justify-center bg-black/70 backdrop-blur-xs animate-v18-backdrop">
            <div className="my-auto max-h-[88vh] flex flex-col overflow-hidden w-full erp-modal-md v18-card bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl shadow-2xl animate-v18-modal">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-[#D4D4D4] dark:border-[#303030] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                      Create New Site Task
                    </h2>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                      Add a trade deliverable or work milestone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 py-4 space-y-4 pr-2">
                <div>
                  <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Concrete Pouring - Level 4 Slab"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                    Assigned Project *
                  </label>
                  <select
                    required
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
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
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Priority
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) =>
                        setFormPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
                      }
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
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
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
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
                  <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                    Work Description / Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Details for foreman, supervisor or subcontractors..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>

                </div>

                <div className="flex items-center justify-end gap-3 p-6 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md shadow-black/10 transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF] dark:text-[#000000]" />
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
