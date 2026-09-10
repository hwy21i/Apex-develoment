"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  User,
  Building,
} from "lucide-react";

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
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success && json.data?.items) {
        setTasks(
          json.data.items.map((t: any) => ({
            _id: t._id,
            title: t.title,
            projectName: t.projectId?.name || "Addis Heights Tower",
            assignedTo: t.assignedTo?.fullName || "Site Engineer",
            priority: t.priority || "MEDIUM",
            status: t.status || "IN_PROGRESS",
            progress: t.progress || 0,
            dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Flexible",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

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

          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Create Task
          </button>
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
      </div>
    </AppShell>
  );
}

