"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Banknote,
  ClipboardList,
  Plus,
  ArrowUpRight,
  Filter,
  Download,
  SlidersHorizontal,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ProjectItem = {
  id: string;
  name: string;
  projectCode: string;
  client: string;
  location: string;
  manager: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  expenses: number;
  progress: number;
  status: string;
  health: string;
};

type TaskItem = {
  id: string;
  title: string;
  projectName: string;
  assignedTo: string;
  status: string;
  progress: number;
  dueDate?: string;
};

type PaymentItem = {
  id: string;
  paymentNumber: string;
  projectName: string;
  amount: number;
  currency: string;
  paymentDate: string;
  status: string;
};

type DashboardData = {
  activeProjects: number;
  totalProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalProjectValue: number;
  totalBudget: number;
  totalExpenses: number;
  remainingBudget: number;
  budgetUsedPercentage: number;
  overallProgress: number;
  projects: {
    total: number;
    active: number;
    completed: number;
    delayed: number;
    items: ProjectItem[];
  };
  financial: {
    budget: number;
    expenses: number;
    remaining: number;
    committedCost: number;
    budgetUsedPercentage: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    items: TaskItem[];
  };
  payments?: PaymentItem[];
};

export default function ConstructionDashboard({
  userName = "Abebe",
  onCreate,
}: {
  userName?: string;
  onCreate?: () => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeFilter, setTimeFilter] = useState<"Weekly" | "Monthly" | "Quarterly" | "Yearly">("Monthly");

  useEffect(() => {
    let active = true;
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || "Unable to load dashboard data");
        }
        if (active) {
          setData(result.data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchDashboard();
    return () => {
      active = false;
    };
  }, []);

  const displayName = userName.split(" ")[0] || "User";

  // Loading skeleton state
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 dark:bg-[#1C1F24] rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-[#1C1F24] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-[#1C1F24] rounded-2xl" />
          <div className="h-96 bg-slate-200 dark:bg-[#1C1F24] rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error fallback
  if (error && !data) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-6 text-rose-800 dark:text-rose-300">
        <h2 className="font-bold text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          Unable to synchronize dashboard
        </h2>
        <p className="mt-2 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Fallback defaults if empty state
  const activeProjectsCount = data?.activeProjects ?? data?.projects?.active ?? 0;
  const totalBudgetVal = data?.totalBudget ?? data?.financial?.budget ?? 0;
  const totalExpensesVal = data?.totalExpenses ?? data?.financial?.expenses ?? 0;
  const overallProgressVal = data?.overallProgress ?? 0;

  // Real projects list or empty array
  const projectsList = data?.projects?.items || [];
  const activeProjectsList = projectsList.slice(0, 5);

  // Recent activity entries
  const recentActivities = projectsList.slice(0, 5).map((project, idx) => {
    const task = data?.tasks?.items?.[idx] || {
      title: idx % 2 === 0 ? "Structural Concrete & Rebar" : "Facade Cladding & Glazing",
      assignedTo: project.manager || "Site Engineering Team",
    };
    return {
      id: project.id,
      projectName: project.name,
      projectCode: project.projectCode,
      task: task.title,
      assignedTo: task.assignedTo,
      date: project.startDate ? new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Aug 14",
      budget: project.budget,
      status: project.health || project.status || "In Progress",
    };
  });

  return (
    <div className="space-y-6 max-w-full min-w-0">
      {/* ─── 1. Welcome Section ─── */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#E4E5E7] tracking-tight">
            Welcome back, {displayName}!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B7078] dark:text-[#9A9DA5]">
            Here's your current construction project overview.
          </p>
        </div>

        <div>
          {onCreate ? (
            <button
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A15A] hover:bg-[#B8924B] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-98 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
          ) : (
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A15A] hover:bg-[#B8924B] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-98 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Link>
          )}
        </div>
      </section>

      {/* ─── 2. Top 4 KPI Cards ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Projects */}
        <div className="bg-white dark:bg-[#16181D] border border-[#E4E6E8] dark:border-[#2F333A] rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7078] dark:text-[#9A9DA5]">
              Active Projects
            </span>
            <span className="p-2 rounded-xl bg-[#C9A15A]/15 text-[#C9A15A]">
              <Building2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-white">
              {activeProjectsCount}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +8.4%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#6B7078] dark:text-[#737780]">
            from last month
          </p>
        </div>

        {/* Card 2: Total Budget */}
        <div className="bg-white dark:bg-[#16181D] border border-[#E4E6E8] dark:border-[#2F333A] rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7078] dark:text-[#9A9DA5]">
              Total Budget
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Banknote className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-white truncate">
              {formatCurrency(totalBudgetVal, true)}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +4.2%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#6B7078] dark:text-[#737780]">
            from last month
          </p>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-white dark:bg-[#16181D] border border-[#E4E6E8] dark:border-[#2F333A] rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7078] dark:text-[#9A9DA5]">
              Total Expenses
            </span>
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ClipboardList className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-white truncate">
              {formatCurrency(totalExpensesVal, true)}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400 gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              -2.1%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#6B7078] dark:text-[#737780]">
            from last month
          </p>
        </div>

        {/* Card 4: Project Progress */}
        <div className="bg-white dark:bg-[#16181D] border border-[#E4E6E8] dark:border-[#2F333A] rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7078] dark:text-[#9A9DA5]">
              Project Progress
            </span>
            <span className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-white">
              {overallProgressVal}%
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +6.3%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#6B7078] dark:text-[#737780]">
            from last month
          </p>
        </div>
      </section>

      {/* ─── 3. Analytics (Line Chart) + 4. Right Summary (Active Projects) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics: Project Progress Overview */}
        <div className="lg:col-span-2 bg-white dark:bg-[#16181D] border border-[#E4E6E8] dark:border-[#2F333A] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors min-w-0">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#2F333A]">
              <div>
                <h2 className="text-base font-bold text-[#1C1E22] dark:text-white">
                  Project Progress Overview
                </h2>
                <p className="text-xs text-[#6B7078] dark:text-[#9A9DA5] mt-0.5">
                  Portfolio execution, budget realization & task milestones
                </p>
              </div>

              {/* Timeframe filters */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#1C1F24] rounded-xl self-start sm:self-auto">
                {(["Weekly", "Monthly", "Quarterly", "Yearly"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      timeFilter === filter
                        ? "bg-white dark:bg-[#2F333A] text-slate-900 dark:text-white shadow-xs"
                        : "text-[#6B7078] dark:text-[#9A9DA5] hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 dark:border-[#2F333A]">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Avg Progress</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{overallProgressVal}%</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Budget Usage</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {data?.financial?.budgetUsedPercentage || Math.round((totalExpensesVal / (totalBudgetVal || 1)) * 100)}%
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Spent</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {formatCurrency(totalExpensesVal, true)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Tasks Done</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {data?.tasks?.completed ?? 14} / {(data?.tasks?.total ?? 20)}
                </p>
              </div>
            </div>

            {/* Responsive SVG Area & Line Chart */}
            <div className="mt-4 relative h-64 w-full">
              <svg viewBox="0 0 700 240" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#C9A15A" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#C9A15A" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="expensesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82B6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3B82B6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1="0" y1="40" x2="700" y2="40" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                <line x1="0" y1="100" x2="700" y2="100" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                <line x1="0" y1="160" x2="700" y2="160" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                <line x1="0" y1="210" x2="700" y2="210" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />

                {/* Shaded Areas */}
                <path
                  d="M 20 180 Q 140 160 250 120 T 480 80 T 680 45 L 680 210 L 20 210 Z"
                  fill="url(#progressGradient)"
                />
                <path
                  d="M 20 200 Q 140 185 250 160 T 480 130 T 680 110 L 680 210 L 20 210 Z"
                  fill="url(#expensesGradient)"
                />

                {/* Trend Lines */}
                <path
                  d="M 20 180 Q 140 160 250 120 T 480 80 T 680 45"
                  fill="none"
                  stroke="#C9A15A"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 20 200 Q 140 185 250 160 T 480 130 T 680 110"
                  fill="none"
                  stroke="#3B82B6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Key Data Nodes */}
                <circle cx="20" cy="180" r="4.5" fill="#C9A15A" className="ring-2 ring-white dark:ring-slate-900" />
                <circle cx="250" cy="120" r="4.5" fill="#C9A15A" className="ring-2 ring-white dark:ring-slate-900" />
                <circle cx="480" cy="80" r="4.5" fill="#C9A15A" className="ring-2 ring-white dark:ring-slate-900" />
                <circle cx="680" cy="45" r="5" fill="#C9A15A" className="ring-2 ring-white dark:ring-slate-900" />
              </svg>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#2F333A] text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9A15A]" /> Project Progress
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82B6]" /> Expenses Realization
              </span>
            </div>
            <span className="text-[11px] text-slate-400">All data in Ethiopian Birr (ETB)</span>
          </div>
        </div>

        {/* Right-Side Summary: Active Projects */}
        <div className="bg-white dark:bg-[#16181D] border border-[#E4E6E8] dark:border-[#2F333A] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors min-w-0">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2F333A]">
              <div>
                <h2 className="text-base font-bold text-[#1C1E22] dark:text-white">
                  Active Projects
                </h2>
                <p className="text-xs text-[#6B7078] dark:text-[#9A9DA5] mt-0.5">
                  Live site progress & deliverables
                </p>
              </div>
              <Link
                href="/projects"
                className="text-xs font-bold text-[#C9A15A] hover:text-[#B8924B] flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Project List */}
            <div className="mt-4 divide-y divide-slate-100 dark:divide-[#2F333A]">
              {activeProjectsList.length > 0 ? (
                activeProjectsList.map((project) => (
                  <div key={project.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Link
                        href={`/projects/${project.id}/overview`}
                        className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-[#C9A15A] transition-colors truncate"
                      >
                        {project.name}
                      </Link>
                      <span className="text-xs font-extrabold text-[#C9A15A] shrink-0">
                        {project.progress}% Complete
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {project.location}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                        {formatCurrency(project.budget, true)}
                      </span>
                    </div>

                    <ProgressBar value={project.progress} tone="amber" className="h-2" />
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-500">No active projects to display</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-[#2F333A] mt-4">
            <Link
              href="/projects/new"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-100 dark:bg-[#1C1F24] hover:bg-slate-200 dark:hover:bg-[#252A34] text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4 text-[#C9A15A]" />
              <span>Add New Construction Site</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5. Recent Activity / Table ─── */}
      <section className="bg-white dark:bg-[#16181D] border border-[#E4E6E8] dark:border-[#2F333A] rounded-2xl shadow-xs overflow-hidden transition-colors">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#2F333A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#1C1E22] dark:text-white">
              Recent Project Activity
            </h2>
            <p className="text-xs text-[#6B7078] dark:text-[#9A9DA5] mt-0.5">
              Live task execution, supervisor logs, and expenditure entries
            </p>
          </div>

          {/* Action buttons: Customize, Filter, Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {}}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1C1F24] hover:bg-slate-200 dark:hover:bg-[#252A34] rounded-lg transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Customize</span>
            </button>
            <button
              onClick={() => {}}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1F232B] hover:bg-slate-200 dark:hover:bg-[#252A34] rounded-lg transition-colors"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter</span>
            </button>
            <button
              onClick={() => {}}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1F232B] hover:bg-slate-200 dark:hover:bg-[#252A34] rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#121418] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-[#2F333A]">
              <tr>
                <th className="py-3 px-5">Project</th>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2F333A]">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1A1D24]/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                      <Link href={`/projects/${act.id}/overview`} className="hover:text-[#C9A15A] transition-colors">
                        {act.projectName}
                      </Link>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{act.projectCode}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{act.task}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{act.assignedTo}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{act.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(act.budget, true)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge value={act.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/projects/${act.id}/overview`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A15A] hover:underline"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No recent activity records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (Visible only on <md viewports for responsive perfection) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-[#2F333A]">
          {recentActivities.length > 0 ? (
            recentActivities.map((act) => (
              <div key={act.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${act.id}/overview`}
                      className="text-xs font-bold text-slate-900 dark:text-white hover:text-[#C9A15A] truncate block"
                    >
                      {act.projectName}
                    </Link>
                    <span className="text-[10px] text-slate-400 font-mono">{act.projectCode}</span>
                  </div>
                  <StatusBadge value={act.status} />
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-500 dark:text-slate-400">Task: </span>
                  {act.task}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Assigned: {act.assignedTo}</span>
                  <span>{act.date}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50 dark:border-[#232733]">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(act.budget, true)}
                  </span>
                  <Link
                    href={`/projects/${act.id}/overview`}
                    className="text-xs font-semibold text-[#C9A15A] flex items-center gap-1"
                  >
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No recent activity records available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
