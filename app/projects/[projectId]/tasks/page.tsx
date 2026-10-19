"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  User,
  Layers,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface TaskItem {
  _id: string;
  title: string;
  description?: string;
  projectId: string | { _id: string; name: string; projectCode?: string };
  phaseId?: { _id: string; name: string; sequenceNumber?: number } | string;
  assignedTo?: { _id: string; fullName: string; username?: string; role?: string } | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "BLOCKED";
  progress: number;
  startDate?: string;
  dueDate?: string;
  notes?: string;
  createdAt?: string;
}

interface PhaseOption {
  _id: string;
  name: string;
  sequenceNumber: number;
}

interface UserOption {
  _id: string;
  fullName: string;
  username: string;
  role: string;
}

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [phases, setPhases] = useState<PhaseOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [phaseFilter, setPhaseFilter] = useState("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPhaseId, setFormPhaseId] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formPriority, setFormPriority] = useState<TaskItem["priority"]>("MEDIUM");
  const [formStatus, setFormStatus] = useState<TaskItem["status"]>("NOT_STARTED");
  const [formProgress, setFormProgress] = useState(0);
  const [formStartDate, setFormStartDate] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [tasksRes, phasesRes, usersRes] = await Promise.all([
        fetch(`/api/tasks?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" }),
        fetch(`/api/projects/${encodeURIComponent(projectId)}/phases`, { cache: "no-store" }),
        fetch("/api/users?limit=100", { cache: "no-store" }),
      ]);

      const tasksJson = await tasksRes.json();
      if (tasksRes.ok && tasksJson.success) {
        setTasks(tasksJson.data.items || []);
      } else {
        setFeedback({ type: "error", message: tasksJson.error?.message || "Failed to load tasks" });
      }

      if (phasesRes.ok) {
        const phasesJson = await phasesRes.json();
        if (phasesJson.success) {
          setPhases(phasesJson.data.phases || []);
        }
      }

      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        if (usersJson.success) {
          setUsers(usersJson.data.items || []);
        }
      }
    } catch (e) {
      setFeedback({ type: "error", message: e instanceof Error ? e.message : "Error loading task workspace" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) loadData();
    });
    return () => {
      ignore = true;
    };
  }, [loadData]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const delayedOrBlocked = tasks.filter((t) => t.status === "DELAYED" || t.status === "BLOCKED").length;
    const avgProgress = total > 0 ? Math.round(tasks.reduce((acc, t) => acc + (t.progress || 0), 0) / total) : 0;
    return { total, completed, inProgress, delayedOrBlocked, avgProgress };
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (search) {
        const q = search.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(q);
        const descMatch = (task.description || "").toLowerCase().includes(q);
        const notesMatch = (task.notes || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !notesMatch) return false;
      }
      if (statusFilter !== "ALL" && task.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && task.priority !== priorityFilter) return false;
      if (phaseFilter !== "ALL") {
        const taskPhaseId = typeof task.phaseId === "object" ? task.phaseId?._id : task.phaseId;
        if (taskPhaseId !== phaseFilter) return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, phaseFilter]);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormPhaseId(phases.length > 0 ? phases[0]._id : "");
    setFormAssignedTo(users.length > 0 ? users[0]._id : "");
    setFormPriority("MEDIUM");
    setFormStatus("NOT_STARTED");
    setFormProgress(0);
    setFormStartDate("");
    setFormDueDate("");
    setFormNotes("");
    setSelectedTask(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (task: TaskItem) => {
    setSelectedTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || "");
    const pId = typeof task.phaseId === "object" ? task.phaseId?._id : task.phaseId;
    setFormPhaseId(pId || "");
    const uId = typeof task.assignedTo === "object" ? task.assignedTo?._id : task.assignedTo;
    setFormAssignedTo(uId || "");
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormProgress(task.progress || 0);
    setFormStartDate(task.startDate ? task.startDate.split("T")[0] : "");
    setFormDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setFormNotes(task.notes || "");
    setShowEditModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedback({ type: "error", message: "Task title is required." });
      return;
    }
    if (!formAssignedTo) {
      setFeedback({ type: "error", message: "Please assign this task to a team member." });
      return;
    }

    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        projectId,
        phaseId: formPhaseId || undefined,
        assignedTo: formAssignedTo,
        priority: formPriority,
        status: formStatus,
        progress: Number(formProgress) || 0,
        startDate: formStartDate ? new Date(formStartDate).toISOString() : undefined,
        dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
        notes: formNotes.trim() || undefined,
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: `Task "${formTitle}" created successfully.` });
        setShowAddModal(false);
        resetForm();
        loadData();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to create task" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error creating task" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!formTitle.trim()) {
      setFeedback({ type: "error", message: "Task title cannot be empty." });
      return;
    }

    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        taskId: selectedTask._id,
        title: formTitle.trim(),
        description: formDescription.trim(),
        phaseId: formPhaseId || null,
        assignedTo: formAssignedTo,
        priority: formPriority,
        status: formStatus,
        progress: Number(formProgress) || 0,
        startDate: formStartDate ? new Date(formStartDate).toISOString() : null,
        dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
        notes: formNotes.trim(),
      };

      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: `Task "${formTitle}" updated successfully.` });
        setShowEditModal(false);
        resetForm();
        loadData();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to update task" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating task" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (task: TaskItem, newStatus: TaskItem["status"]) => {
    const newProgress = newStatus === "COMPLETED" ? 100 : newStatus === "NOT_STARTED" ? 0 : task.progress;
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task._id,
          status: newStatus,
          progress: newProgress,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: `Task status updated to ${newStatus}.` });
        loadData();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to update status" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating status" });
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/tasks?taskId=${encodeURIComponent(deletingTaskId)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: "Task removed from project." });
        setShowDeleteModal(false);
        setDeletingTaskId(null);
        loadData();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to delete task" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error deleting task" });
    } finally {
      setSubmitting(false);
    }
  };

  const resolveAssigneeName = (task: TaskItem) => {
    if (!task.assignedTo) return "Unassigned";
    if (typeof task.assignedTo === "object") return task.assignedTo.fullName || task.assignedTo.username;
    const found = users.find((u) => u._id === task.assignedTo);
    return found ? found.fullName : "Assigned";
  };

  const resolvePhaseName = (task: TaskItem) => {
    if (!task.phaseId) return "General / Unphased";
    if (typeof task.phaseId === "object") return task.phaseId.name;
    const found = phases.find((p) => p._id === task.phaseId);
    return found ? `${found.sequenceNumber ? `Phase ${found.sequenceNumber}: ` : ""}${found.name}` : "Phased";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm transition-all ${
            feedback.type === "success"
              ? "bg-[#FAFAFA] dark:bg-[#111111] border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]"
              : "bg-[#FAFAFA] dark:bg-[#111111] border-[#303030] text-[#000000] dark:text-[#FFFFFF]"
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
            )}
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

      {/* Header and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Project Execution
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Project Tasks
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Assign, schedule, and track individual site construction tasks across project phases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            Company Task Queue
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Task
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Total Tasks</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">In Progress</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.inProgress}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Completed</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.completed}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Delayed / Blocked</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.delayedOrBlocked}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Avg Completion</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.avgProgress}%</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, description or notes..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELAYED">Delayed</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Phase Filter */}
          {phases.length > 0 && (
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none max-w-[160px] truncate"
            >
              <option value="ALL">All Phases</option>
              {phases.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.sequenceNumber ? `Phase ${p.sequenceNumber}: ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {(search || statusFilter !== "ALL" || priorityFilter !== "ALL" || phaseFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                setPhaseFilter("ALL");
              }}
              className="px-2 py-2 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Task List / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading project tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <CheckSquare className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
          <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No tasks found</h3>
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
            {search || statusFilter !== "ALL" || priorityFilter !== "ALL" || phaseFilter !== "ALL"
              ? "No tasks match your active filters. Try clearing your search parameters."
              : "No tasks have been scheduled for this project yet. Create your first task to begin tracking execution."}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create First Task
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] divide-y divide-[#D4D4D4] dark:divide-[#303030]">
          {filteredTasks.map((task) => {
            const assignee = resolveAssigneeName(task);
            const phaseTitle = resolvePhaseName(task);
            return (
              <div
                key={task._id}
                className="p-4 hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left side: Task Title, Phase & Meta */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#000000] dark:text-[#FFFFFF] truncate">
                      {task.title}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                      {task.priority}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3]">
                      {task.status.replace("_", " ")}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3] line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Layers className="w-3.5 h-3.5" />
                      {phaseTitle}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {assignee}
                    </span>
                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: Progress Bar & Actions */}
                <div className="flex items-center gap-4 min-w-[260px] justify-between md:justify-end">
                  <div className="w-32">
                    <div className="flex justify-between text-[11px] font-mono mb-1 text-[#666666] dark:text-[#A3A3A3]">
                      <span>Progress</span>
                      <span className="font-bold text-[#000000] dark:text-[#FFFFFF]">{task.progress}%</span>
                    </div>
                    <ProgressBar value={task.progress} />
                  </div>

                  {/* Quick status dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskItem["status"])}
                    className="text-[11px] font-semibold py-1 px-2 rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(task)}
                      title="Edit Task"
                      className="p-1.5 rounded-lg border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#000000] dark:text-[#FFFFFF] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingTaskId(task._id);
                        setShowDeleteModal(true);
                      }}
                      title="Delete Task"
                      className="p-1.5 rounded-lg border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Add Project Task</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Pour foundation concrete for Sector B"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Specific task instructions, scope, quality specifications..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Project Phase
                  </label>
                  <select
                    value={formPhaseId}
                    onChange={(e) => setFormPhaseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="">General (No Phase Assigned)</option>
                    {phases.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.sequenceNumber ? `Phase ${p.sequenceNumber}: ` : ""}
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Assignee *
                  </label>
                  <select
                    required
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="">Select Team Member</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskItem["priority"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskItem["status"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Progress: {formProgress}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full accent-black dark:accent-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Site Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Safety instructions, equipment required..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Edit Task</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Project Phase
                  </label>
                  <select
                    value={formPhaseId}
                    onChange={(e) => setFormPhaseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="">General (No Phase Assigned)</option>
                    {phases.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.sequenceNumber ? `Phase ${p.sequenceNumber}: ` : ""}
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Assignee
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskItem["priority"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskItem["status"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Progress: {formProgress}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full accent-black dark:accent-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Site Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Save Changes
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
              <h3 className="text-base font-bold">Remove Task</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to delete this task from the project? This action will remove its schedule, history, and dependency tracking.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingTaskId(null);
                }}
                className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteTask}
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
