"use client";

import React, { useState, useEffect, FormEvent } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { hasPermission } from "@/lib/rbac/permissions";
import {
  CheckSquare,
  Plus,
  Search,
  User,
} from "lucide-react";

interface ProjectOption {
  _id: string;
  name: string;
}

interface ApiTask {
  _id: string;
  title: string;
  projectId?: { name?: string } | string;
  assignedTo?: { fullName?: string } | string;
  priority?: TaskRecord["priority"];
  status?: TaskRecord["status"];
  progress?: number;
  dueDate?: string;
}

interface TaskRecord {
  _id: string;
  title: string;
  projectName?: string;
  assignedTo?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "BLOCKED";
  progress: number;
  dueDate?: string;
}

export default function TasksPage() {
  const { user } = useAuth();
  const canCreateTask = hasPermission(user, "TASK_CREATE");
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setLoadError(json.error?.message || "Unable to load tasks.");
        return;
      }
      setTasks(
        (json.data?.items || []).map((t: ApiTask) => ({
          _id: t._id,
          title: t.title,
          projectName: typeof t.projectId === "object" ? t.projectId?.name || "Project unavailable" : "Project unavailable",
          assignedTo: typeof t.assignedTo === "object" ? t.assignedTo?.fullName || "Unassigned" : "Unassigned",
          priority: t.priority || "MEDIUM",
          status: t.status || "NOT_STARTED",
          progress: t.progress || 0,
          dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Flexible",
        }))
      );
      setLoadError("");
    } catch {
      setLoadError("Unable to connect to the task service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void fetchTasks();
    });
    fetch("/api/projects?limit=100")
      .then(async (res) => {
        const json = await res.json();
        if (res.ok && json.success) setProjects(json.data?.items || []);
      })
      .catch(() => {});
  }, []);

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") || "").trim(),
          projectId: form.get("projectId"),
          assignedTo: user.id,
          priority: form.get("priority"),
          dueDate: form.get("dueDate") || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error?.message || "Unable to create task.");
        return;
      }
      setShowCreateForm(false);
      await fetchTasks();
    } catch {
      setFormError("Unable to connect to the task service.");
    } finally {
      setSaving(false);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.projectName && t.projectName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const priorityColors = {
    LOW: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    MEDIUM: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    HIGH: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    CRITICAL: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <CheckSquare className="w-4 h-4" /> Work Breakdown & Execution
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Site Tasks & Activities
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Coordinate trade assignments, milestone deadlines, and progress logs across all projects.
            </p>
          </div>

          {canCreateTask && (
            <button
              type="button"
              onClick={() => { setFormError(""); setShowCreateForm(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Create Task
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks by title, project, assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#141720] border border-[#262C3D] text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {["ALL", "NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? "bg-blue-600 text-white font-semibold"
                    : "bg-[#141720] text-slate-400 hover:text-white border border-[#262C3D]"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loadError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{loadError}</p>}

        {/* Tasks Table */}
        <div className="bg-[#141720] border border-[#232733] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181B24] text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-[#232733]">
                <tr>
                  <th className="px-5 py-3">Task Title</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202432]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      Loading tasks...
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No tasks found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t._id} className="hover:bg-[#1A1E29] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {t.title}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {t.projectName}
                      </td>
                      <td className="px-5 py-3.5 flex items-center gap-1.5 text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.assignedTo}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            priorityColors[t.priority] || priorityColors.MEDIUM
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">
                        {t.dueDate}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[#1F2432] overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {t.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowCreateForm(false); }}>
            <form onSubmit={createTask} className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-700 bg-[#141720] p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="text-lg font-semibold text-white">Create task</h2><p className="mt-1 text-sm text-slate-400">Add an assignment to a project you can access.</p></div>
                <button type="button" aria-label="Close create task form" onClick={() => setShowCreateForm(false)} disabled={saving} className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-800">×</button>
              </div>
              {formError && <p role="alert" className="text-sm text-rose-300">{formError}</p>}
              <label className="grid gap-1.5 text-sm text-slate-300">Task title<input name="title" required minLength={2} maxLength={200} className="rounded-lg border border-slate-700 bg-[#0f1115] px-3 py-2 text-white" /></label>
              <label className="grid gap-1.5 text-sm text-slate-300">Project<select name="projectId" required disabled={!projects.length} className="rounded-lg border border-slate-700 bg-[#0f1115] px-3 py-2 text-white"><option value="">{projects.length ? "Select a project" : "No accessible projects"}</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-slate-300">Priority<select name="priority" defaultValue="MEDIUM" className="rounded-lg border border-slate-700 bg-[#0f1115] px-3 py-2 text-white"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
                <label className="grid gap-1.5 text-sm text-slate-300">Due date<input type="date" name="dueDate" className="rounded-lg border border-slate-700 bg-[#0f1115] px-3 py-2 text-white" /></label>
              </div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" disabled={saving} onClick={() => setShowCreateForm(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200">Cancel</button><button type="submit" disabled={saving || !projects.length} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Creating…" : "Create task"}</button></div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
