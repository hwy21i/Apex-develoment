"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  Printer,
  Layers,
  CheckCircle2,
  DollarSign,
  Loader2,
  X,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/formatters/currency";

interface ProjectDetails {
  _id: string;
  name: string;
  projectCode: string;
  client: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  totalBudget: number;
  revisedBudget?: number;
  contractValue: number;
  amountSpent: number;
  committedCost: number;
  remainingBudget: number;
  progressPercentage: number;
  status: string;
  healthStatus?: string;
  projectManager?: { fullName?: string; email?: string } | string;
}

interface PhaseItem {
  _id: string;
  name: string;
  sequenceNumber: number;
  completionPercentage: number;
  status: string;
  budget?: number;
}

interface TaskItem {
  _id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
}

export default function ProjectReportsPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [phases, setPhases] = useState<PhaseItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadReportData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projRes, phasesRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`, { cache: "no-store" }),
        fetch(`/api/projects/${projectId}/phases`, { cache: "no-store" }),
        fetch(`/api/tasks?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" }),
      ]);

      const projJson = await projRes.json();
      if (projRes.ok && projJson.success) {
        setProject(projJson.data);
      }

      const phasesJson = await phasesRes.json();
      if (phasesRes.ok && phasesJson.success) {
        setPhases(phasesJson.data.phases || []);
      }

      const tasksJson = await tasksRes.json();
      if (tasksRes.ok && tasksJson.success) {
        setTasks(tasksJson.data.items || []);
      }
    } catch (e) {
      setFeedback({ type: "error", message: e instanceof Error ? e.message : "Error generating report" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) loadReportData();
    });
    return () => {
      ignore = true;
    };
  }, [loadReportData]);

  // Calculations
  const stats = useMemo(() => {
    if (!project) return null;
    const totalBudget = project.revisedBudget || project.totalBudget || 0;
    const spent = project.amountSpent || 0;
    const committed = project.committedCost || 0;
    const remaining = totalBudget - spent - committed;
    const utilization = totalBudget > 0 ? Math.round(((spent + committed) / totalBudget) * 100) : 0;

    const totalPhases = phases.length;
    const completedPhases = phases.filter((p) => p.status === "COMPLETED").length;
    const inProgressPhases = phases.filter((p) => p.status === "IN_PROGRESS").length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
    const delayedTasks = tasks.filter((t) => t.status === "DELAYED" || t.status === "BLOCKED").length;
    const taskVelocity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalBudget,
      spent,
      committed,
      remaining,
      utilization,
      totalPhases,
      completedPhases,
      inProgressPhases,
      totalTasks,
      completedTasks,
      delayedTasks,
      taskVelocity,
    };
  }, [project, phases, tasks]);

  // Export CSV handler
  const handleExportCSV = () => {
    if (!project || !stats) return;

    const rows: string[][] = [
      ["APEX DEVELOPMENTS ERP - PROJECT AUDIT REPORT"],
      ["Generated Date", new Date().toISOString()],
      [""],
      ["PROJECT GENERAL INFORMATION"],
      ["Project Name", project.name],
      ["Project Code", project.projectCode],
      ["Client", project.client],
      ["Location", project.location],
      ["Status", project.status.toUpperCase()],
      [
        "Project Manager",
        typeof project.projectManager === "object"
          ? project.projectManager?.fullName || "—"
          : "—",
      ],
      ["Start Date", project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"],
      ["Expected End Date", project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : "—"],
      [""],
      ["FINANCIAL & COMMERCIAL SUMMARY (ETB)"],
      ["Total Contract Value", String(project.contractValue || 0)],
      ["Approved Total Budget", String(stats.totalBudget)],
      ["Actual Incurred Expenditure", String(stats.spent)],
      ["Committed Purchase Orders", String(stats.committed)],
      ["Remaining Available Funds", String(stats.remaining)],
      ["Budget Utilization Rate (%)", `${stats.utilization}%`],
      [""],
      ["PHASE BREAKDOWN"],
      ["Seq #", "Phase Name", "Status", "Completion %", "Allocated Budget (ETB)"],
      ...phases.map((p) => [
        String(p.sequenceNumber),
        `"${p.name.replace(/"/g, '""')}"`,
        p.status,
        `${p.completionPercentage}%`,
        String(p.budget || 0),
      ]),
      [""],
      ["TASK SUMMARY"],
      ["Total Tasks", String(stats.totalTasks)],
      ["Completed Tasks", String(stats.completedTasks)],
      ["Delayed/Blocked Tasks", String(stats.delayedTasks)],
      ["Task Completion Rate (%)", `${stats.taskVelocity}%`],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${project.projectCode}_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback({ type: "success", message: "Project Audit CSV report exported successfully." });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
        <Loader2 className="w-8 h-8 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-3" />
        <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Generating project audit report...</p>
      </div>
    );
  }

  if (!project || !stats) {
    return (
      <div className="p-8 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
        <p className="text-sm text-[#666666] dark:text-[#A3A3A3]">Unable to load project report data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm transition-all print:hidden ${
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

      {/* Header and Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Project Audit & Commercial Analytics
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Executive Project Report
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Consolidated commercial variance, civil engineering phase status, and task execution velocity.
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 md:p-8 space-y-8 shadow-xs">
        {/* Project Meta Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#D4D4D4] dark:border-[#303030]">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Project Code
            </p>
            <p className="text-base font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-0.5">
              {project.projectCode}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Client / Employer
            </p>
            <p className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] mt-0.5">{project.client}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Location & Site
            </p>
            <p className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] mt-0.5">{project.location}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Overall Health
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5 mt-0.5">
              {project.healthStatus || "ON_TRACK"}
            </span>
          </div>
        </div>

        {/* Commercial & Financial Summary Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF]">
              Commercial Summary (ETB)
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717]">
              <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Approved Budget</p>
              <p className="text-lg font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
                {formatCurrency(stats.totalBudget)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717]">
              <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Actual Incurred</p>
              <p className="text-lg font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
                {formatCurrency(stats.spent)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717]">
              <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Committed Orders</p>
              <p className="text-lg font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
                {formatCurrency(stats.committed)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717]">
              <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Remaining Funds</p>
              <p className="text-lg font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
                {formatCurrency(stats.remaining)}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">Budget Absorption</span>
              <span className="font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">{stats.utilization}%</span>
            </div>
            <ProgressBar value={stats.utilization} />
          </div>
        </div>

        {/* Phase Progress Audit Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF]">
                Civil Engineering Phases ({phases.length})
              </h3>
            </div>
            <div className="text-xs font-mono text-[#666666] dark:text-[#A3A3A3]">
              {stats.completedPhases} completed · {stats.inProgressPhases} active
            </div>
          </div>

          {phases.length === 0 ? (
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] p-4 border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-center">
              No phases defined yet. Initialize phases in the Phases module.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                    <th className="py-2.5 px-4 font-semibold">Seq</th>
                    <th className="py-2.5 px-4 font-semibold">Phase Description</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Completion</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Budget (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {phases.map((p) => (
                    <tr key={p._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717]">
                      <td className="py-2.5 px-4 font-mono text-[#666666] dark:text-[#A3A3A3]">
                        {p.sequenceNumber}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#000000] dark:text-[#FFFFFF]">{p.name}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                          {p.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {p.completionPercentage}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#666666] dark:text-[#A3A3A3]">
                        {formatCurrency(p.budget || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Task Execution Velocity Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF]">
              Task Execution Velocity
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717]">
              <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Total Scheduled Tasks</p>
              <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.totalTasks}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717]">
              <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Tasks Completed</p>
              <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.completedTasks}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717]">
              <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Delayed / Critical</p>
              <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.delayedTasks}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717]">
              <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Completion Ratio</p>
              <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.taskVelocity}%</p>
            </div>
          </div>
        </div>

        {/* Footer Audit Sign-Off */}
        <div className="pt-6 border-t border-[#D4D4D4] dark:border-[#303030] flex flex-col md:flex-row justify-between text-xs text-[#666666] dark:text-[#A3A3A3]">
          <div>
            <p className="font-semibold text-[#000000] dark:text-[#FFFFFF]">Apex Developments Construction ERP</p>
            <p>Certified Electronic Project Management Audit Record</p>
          </div>
          <div className="mt-2 md:mt-0 font-mono text-[11px]">
            Generated on {new Date().toUTCString()}
          </div>
        </div>
      </div>
    </div>
  );
}
