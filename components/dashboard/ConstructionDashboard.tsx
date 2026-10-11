"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Aurora from "@/components/Aurora";
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
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentUser } from "@/components/auth/UserProvider";
import { useSearch } from "@/components/layout/AppShell";
import { exportCsv } from "@/lib/exportCsv";

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

type TimeFilterOption = "Day" | "Week" | "Month" | "Year";

const TIMEFRAME_CONFIG: Record<
  TimeFilterOption,
  {
    label: string;
    trend: string;
    multiplier: number;
    labels: string[];
    primaryPath: string;
    areaPath: string;
    secondaryPath: string;
    points: Array<{ cx: number; cy: number }>;
  }
> = {
  Day: {
    label: "Today's Capital Outlay",
    trend: "+2.4%",
    multiplier: 0.05,
    labels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
    primaryPath: "M 20,135 Q 120,115 200,95 T 360,75 T 480,55 T 580,45",
    areaPath: "M 20,135 Q 120,115 200,95 T 360,75 T 480,55 T 580,45 L 580,180 L 20,180 Z",
    secondaryPath: "M 20,155 Q 120,140 200,120 T 360,100 T 480,85 T 580,75",
    points: [
      { cx: 20, cy: 135 },
      { cx: 200, cy: 95 },
      { cx: 360, cy: 75 },
      { cx: 480, cy: 55 },
      { cx: 580, cy: 45 },
    ],
  },
  Week: {
    label: "Weekly Cash Velocity",
    trend: "+5.8%",
    multiplier: 0.25,
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    primaryPath: "M 20,140 Q 110,130 190,100 T 340,75 T 460,45 T 580,25",
    areaPath: "M 20,140 Q 110,130 190,100 T 340,75 T 460,45 T 580,25 L 580,180 L 20,180 Z",
    secondaryPath: "M 20,165 Q 110,150 190,120 T 340,100 T 460,85 T 580,65",
    points: [
      { cx: 20, cy: 140 },
      { cx: 190, cy: 100 },
      { cx: 340, cy: 75 },
      { cx: 460, cy: 45 },
      { cx: 580, cy: 25 },
    ],
  },
  Month: {
    label: "Monthly Portfolio Allocation",
    trend: "+12.8%",
    multiplier: 1.0,
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    primaryPath: "M 20,150 Q 110,120 180,105 T 320,80 T 440,55 T 580,30",
    areaPath: "M 20,150 Q 110,120 180,105 T 320,80 T 440,55 T 580,30 L 580,180 L 20,180 Z",
    secondaryPath: "M 20,160 Q 110,140 180,125 T 320,110 T 440,95 T 580,75",
    points: [
      { cx: 20, cy: 150 },
      { cx: 180, cy: 105 },
      { cx: 320, cy: 80 },
      { cx: 440, cy: 55 },
      { cx: 580, cy: 30 },
    ],
  },
  Year: {
    label: "Annual Trajectory",
    trend: "+28.5%",
    multiplier: 2.2,
    labels: ["2023", "2024", "2025", "2026", "2027"],
    primaryPath: "M 20,165 Q 150,140 260,110 T 420,60 T 580,18",
    areaPath: "M 20,165 Q 150,140 260,110 T 420,60 T 580,18 L 580,180 L 20,180 Z",
    secondaryPath: "M 20,175 Q 150,160 260,135 T 420,95 T 580,55",
    points: [
      { cx: 20, cy: 165 },
      { cx: 260, cy: 110 },
      { cx: 420, cy: 60 },
      { cx: 580, cy: 18 },
    ],
  },
};

export default function ConstructionDashboard({
  userName,
  onCreate,
}: {
  userName?: string;
  onCreate?: () => void;
}) {
  const { user } = useCurrentUser();
  const { searchQuery } = useSearch();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("Month");
  const [activityFilter, setActivityFilter] = useState<string>("ALL");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(6);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState<number>(0);

  const calendarDate = useMemo(() => {
    const d = new Date(2026, 9 + calendarMonthOffset, 1);
    return {
      monthName: d.toLocaleString("default", { month: "long" }),
      year: d.getFullYear(),
      daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
    };
  }, [calendarMonthOffset]);

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

  const resolvedName = userName || user?.fullName || "";
  const displayName = resolvedName.split(" ")[0];

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

  const q = (searchQuery || "").toLowerCase().trim();
  const filteredActivities = recentActivities.filter((act) => {
    const matchesSearch =
      !q ||
      act.projectName.toLowerCase().includes(q) ||
      act.projectCode.toLowerCase().includes(q) ||
      act.task.toLowerCase().includes(q) ||
      act.assignedTo.toLowerCase().includes(q);
    const matchesFilter =
      activityFilter === "ALL" ||
      act.status.toLowerCase().includes(activityFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    const rows = [
      ["Project", "Project Code", "Task", "Assigned To", "Date", "Budget (ETB)", "Status"],
      ...filteredActivities.map((act) => [
        act.projectName,
        act.projectCode,
        act.task,
        act.assignedTo,
        act.date,
        act.budget,
        act.status,
      ]),
    ];
    exportCsv("Apex_Recent_Project_Activities.csv", rows);
  };

  return (
    <div className="space-y-6 max-w-full min-w-0">
      {/* ─── 1. Welcome Section with Subtle Aurora ─── */}
      <section className="relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-[#E3E6E9] dark:bg-[#2E4156] border border-[#AAB7B7]/40 dark:border-[rgba(170,183,183,0.22)] shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Aurora
          colorStops={["#1A2D42", "#2E4156", "#AAB7B7"]}
          blend={0.35}
          amplitude={0.7}
          speed={0.25}
          className="opacity-50"
        />

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2D42] dark:text-[#D4D8DD] tracking-tight">
            Welcome back{displayName ? `, ${displayName}` : ""}!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#2E4156]/70 dark:text-[#AAB7B7]">
            Here&apos;s your current construction project overview.
          </p>
        </div>

        <div className="relative z-10">
          {onCreate ? (
            <button
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A2D42] dark:bg-[#C0C8CA] hover:bg-[#2E4156] dark:hover:bg-[#D4D8DD] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#D4D8DD] dark:text-[#1A2D42] shadow-md transition-all active:scale-98 shrink-0 border border-[#AAB7B7]/40"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
          ) : (
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A2D42] dark:bg-[#C0C8CA] hover:bg-[#2E4156] dark:hover:bg-[#D4D8DD] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#D4D8DD] dark:text-[#1A2D42] shadow-md transition-all active:scale-98 shrink-0 border border-[#AAB7B7]/40"
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
        <div className="glass-card p-5 border border-[#AAB7B7]/40 dark:border-[rgba(170,183,183,0.22)] bg-[#E3E6E9] dark:bg-[#2E4156] rounded-2xl">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E4156]/70 dark:text-[#AAB7B7]">
              Active Projects
            </span>
            <span className="p-2 rounded-xl bg-[#1A2D42]/10 dark:bg-[#1A2D42] text-[#1A2D42] dark:text-[#C0C8CA] border border-[#AAB7B7]/30">
              <Building2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1A2D42] dark:text-[#D4D8DD]">
              {activeProjectsCount}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-[#3D6B58] dark:text-[#A8C5B5] gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +8.4%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#2E4156]/60 dark:text-[#AAB7B7]/70">
            from last month
          </p>
        </div>

        {/* Card 2: Deep Navy Highlighted Revenue / Portfolio Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#122030] dark:bg-[#122030] border border-[#AAB7B7]/40 p-5 text-[#D4D8DD] shadow-xl group transition-all hover:border-[#C0C8CA]/60">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-[#2E4156]/50 blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#AAB7B7]">
              Total Contract Value
            </span>
            <span className="p-2 rounded-xl bg-[#2E4156] text-[#C0C8CA] border border-[#AAB7B7]/30">
              <Banknote className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between relative z-10">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
              {formatCurrency(totalBudgetVal, true)}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-[#A8C5B5] gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +4.2%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#AAB7B7] relative z-10">
            <span>Portfolio commitment</span>
            <span className="text-[#C0C8CA] font-semibold">Active Tier</span>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="glass-card p-5 border border-[#AAB7B7]/40 dark:border-[rgba(170,183,183,0.22)] bg-[#E3E6E9] dark:bg-[#2E4156] rounded-2xl">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E4156]/70 dark:text-[#AAB7B7]">
              Total Expenses
            </span>
            <span className="p-2 rounded-xl bg-[#1A2D42]/10 dark:bg-[#1A2D42] text-[#1A2D42] dark:text-[#C0C8CA] border border-[#AAB7B7]/30">
              <ClipboardList className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1A2D42] dark:text-[#D4D8DD] truncate">
              {formatCurrency(totalExpensesVal, true)}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-[#964A4A] dark:text-[#D29F9F] gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              -2.1%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#2E4156]/60 dark:text-[#AAB7B7]/70">
            from last month
          </p>
        </div>

        {/* Card 4: Project Progress */}
        <div className="glass-card p-5 border border-[#AAB7B7]/40 dark:border-[rgba(170,183,183,0.22)] bg-[#E3E6E9] dark:bg-[#2E4156] rounded-2xl">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E4156]/70 dark:text-[#AAB7B7]">
              Project Progress
            </span>
            <span className="p-2 rounded-xl bg-[#1A2D42]/10 dark:bg-[#1A2D42] text-[#1A2D42] dark:text-[#C0C8CA] border border-[#AAB7B7]/30">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1A2D42] dark:text-[#D4D8DD]">
              {overallProgressVal}%
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-[#3D6B58] dark:text-[#A8C5B5] gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +6.3%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#2E4156]/60 dark:text-[#AAB7B7]/70">
            from last month
          </p>
        </div>
      </section>

      {/* ─── 3. Analytics (Line Chart) + 4. Right Summary (Active Projects) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics: Project Progress Overview */}
        <div className="lg:col-span-2 glass-card border border-[#AAB7B7]/25 bg-[#2E4156]/85 dark:bg-[#2E4156]/90 text-[#D4D8DD] rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-w-0 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#AAB7B7]/20">
              <div>
                <h2 className="text-base font-bold text-white dark:text-[#D4D8DD]">
                  Project Progress Overview
                </h2>
                <p className="text-xs text-[#AAB7B7] mt-0.5">
                  Portfolio execution, budget realization &amp; task milestones
                </p>
              </div>

              {/* Timeframe filters: Day, Week, Month, Year */}
              <div className="flex items-center gap-1 p-1 bg-[#1A2D42]/80 rounded-xl border border-[#AAB7B7]/25 self-start sm:self-auto">
                {(["Day", "Week", "Month", "Year"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      timeFilter === filter
                        ? "bg-[#C0C8CA] text-[#1A2D42] font-bold shadow-xs"
                        : "text-[#AAB7B7] hover:text-[#D4D8DD]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI metric summary below title */}
            <div className="mt-4 flex flex-wrap items-baseline gap-4 sm:gap-6">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white dark:text-[#D4D8DD]">
                  {formatCurrency(totalBudgetVal * TIMEFRAME_CONFIG[timeFilter].multiplier, true)}
                </span>
                <span className="ml-2 inline-flex items-center text-xs font-bold text-[#A8C5B5] gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {TIMEFRAME_CONFIG[timeFilter].trend}
                </span>
              </div>
              <div className="text-xs text-[#AAB7B7] flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4D8DD]" />
                  {TIMEFRAME_CONFIG[timeFilter].label}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#AAB7B7]/60" />
                  Actual Disbursed
                </span>
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="mt-6 w-full h-48 sm:h-56 relative min-w-0">
              <svg
                viewBox="0 0 600 200"
                className="w-full h-full overflow-visible transition-all duration-300"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C0C8CA" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2E4156" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" className="text-[#AAB7B7]/20" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" className="text-[#AAB7B7]/20" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="currentColor" className="text-[#AAB7B7]/20" strokeDasharray="3 3" />

                {/* Secondary Line: Actual Disbursed */}
                <path
                  d={TIMEFRAME_CONFIG[timeFilter].secondaryPath}
                  fill="none"
                  stroke="#AAB7B7"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeOpacity="0.7"
                  className="transition-all duration-300"
                />

                {/* Area Gradient Fill under Primary Line */}
                <path
                  d={TIMEFRAME_CONFIG[timeFilter].areaPath}
                  fill="url(#chartGradient)"
                  className="transition-all duration-300"
                />

                {/* Primary Chart Line: Budget Realization (Blueprint / Cool Gray) */}
                <path
                  d={TIMEFRAME_CONFIG[timeFilter].primaryPath}
                  fill="none"
                  stroke="#D4D8DD"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />

                {/* Data Points */}
                {TIMEFRAME_CONFIG[timeFilter].points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r={i === TIMEFRAME_CONFIG[timeFilter].points.length - 1 ? 5 : 3.5}
                    className="fill-[#1A2D42] stroke-[#D4D8DD] transition-all duration-300"
                    strokeWidth="2.5"
                  />
                ))}
              </svg>
            </div>

            {/* Dynamic labels */}
            <div className="mt-2 flex justify-between text-[11px] font-mono text-[#AAB7B7] px-2">
              {TIMEFRAME_CONFIG[timeFilter].labels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#AAB7B7]/20 flex items-center justify-between text-xs">
            <span className="text-[#AAB7B7]">
              Realization rate: <strong className="text-white dark:text-[#D4D8DD]">92.4% on schedule</strong>
            </span>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 font-semibold text-[#C0C8CA] hover:text-white hover:underline transition-colors"
            >
              View detailed report <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Summary: Active Construction Projects */}
        <div className="glass-card border border-[#AAB7B7]/25 bg-[#2E4156]/85 dark:bg-[#2E4156]/90 text-[#D4D8DD] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#AAB7B7]/20">
              <div>
                <h2 className="text-base font-bold text-white dark:text-[#D4D8DD]">
                  Active Projects
                </h2>
                <p className="text-xs text-[#AAB7B7] mt-0.5">
                  Top performing ongoing sites
                </p>
              </div>
              <Link
                href="/projects"
                className="p-1.5 rounded-lg text-[#AAB7B7] hover:text-[#D4D8DD] hover:bg-[#1A2D42]/60 transition-colors"
                title="View all projects"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* List of active projects */}
            <div className="mt-4 divide-y divide-[#AAB7B7]/15">
              {activeProjectsList.length > 0 ? (
                activeProjectsList.map((project) => (
                  <div key={project.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/projects/${project.id}/overview`}
                          className="text-xs font-bold text-white dark:text-[#D4D8DD] hover:text-[#C0C8CA] transition-colors truncate block"
                        >
                          {project.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#AAB7B7]">
                          <span className="font-mono text-[#C0C8CA]">{project.projectCode}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="w-3 h-3 text-[#AAB7B7]/70 shrink-0" />
                            {project.location || "Addis Ababa"}
                          </span>
                        </div>
                      </div>
                      <StatusBadge value={project.health || project.status} />
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#AAB7B7] font-mono">
                        <span>Progress</span>
                        <span className="font-bold text-[#D4D8DD]">
                          {project.progress}%
                        </span>
                      </div>
                      <ProgressBar value={project.progress} tone="cool" className="h-1.5" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#AAB7B7]">
                  No active projects currently available.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#AAB7B7]/20">
            <Link
              href="/projects/new"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#1A2D42]/80 hover:bg-[#1A2D42] text-[#D4D8DD] font-semibold text-xs rounded-xl border border-[#AAB7B7]/30 transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-[#C0C8CA]" />
              <span>Add New Construction Site</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. Calendar & Site Execution Statistics Panel ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Calendar Widget (Left 1 col) */}
        <div className="glass-card border border-[#AAB7B7]/25 bg-[#2E4156]/85 dark:bg-[#2E4156]/90 text-[#D4D8DD] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#AAB7B7]/20">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C0C8CA]" />
                <h2 className="text-sm font-bold text-white dark:text-[#D4D8DD]">
                  {calendarDate.monthName} {calendarDate.year}
                </h2>
              </div>
              <div className="flex items-center gap-1 text-[#AAB7B7]">
                <button
                  type="button"
                  onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                  className="p-1 hover:text-[#D4D8DD] rounded transition-colors"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
                  className="p-1 hover:text-[#D4D8DD] rounded transition-colors"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center text-[10px] font-mono text-[#AAB7B7] py-2">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: calendarDate.daysInMonth }, (_, i) => i + 1).map((day) => {
                const isSelected = day === selectedCalendarDay;
                const hasMilestone = [6, 12, 18, 25].includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedCalendarDay(day)}
                    className={`h-7 w-7 mx-auto rounded-lg flex flex-col items-center justify-center font-semibold text-[11px] transition-colors relative ${
                      isSelected
                        ? "bg-[#C0C8CA] text-[#1A2D42] font-bold shadow-xs"
                        : "text-[#D4D8DD] hover:bg-[#1A2D42]/60"
                    }`}
                  >
                    <span>{day}</span>
                    {hasMilestone && (
                      <span
                        className={`w-1 h-1 rounded-full absolute bottom-0.5 ${
                          isSelected ? "bg-[#1A2D42]" : "bg-[#C0C8CA]"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Selected Date Note */}
          <div className="mt-4 pt-3 border-t border-[#AAB7B7]/20 text-[11px] text-[#AAB7B7] flex items-center justify-between">
            <span>Milestone marked: {selectedCalendarDay} {calendarDate.monthName.slice(0, 3)}</span>
            <Link href="/calendar" className="text-[#C0C8CA] font-semibold hover:text-white hover:underline transition-colors">
              Full Schedule →
            </Link>
          </div>
        </div>

        {/* Execution Statistics & Upcoming Deadlines (Right 2 cols) */}
        <div className="lg:col-span-2 glass-card border border-[#AAB7B7]/25 bg-[#2E4156]/85 dark:bg-[#2E4156]/90 text-[#D4D8DD] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#AAB7B7]/20">
              <div>
                <h2 className="text-base font-bold text-white dark:text-[#D4D8DD]">
                  Site Milestones &amp; Compliance Statistics
                </h2>
                <p className="text-xs text-[#AAB7B7] mt-0.5">
                  Real-time field safety, quality certifications, and critical path deadlines
                </p>
              </div>
              <Link
                href="/milestones"
                className="text-xs font-semibold text-[#C0C8CA] hover:text-white hover:underline flex items-center gap-1 transition-colors"
              >
                All Milestones <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 3 Quick Metric Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-[#1A2D42]/70 border border-[#AAB7B7]/20">
                <div className="flex items-center gap-2 text-xs text-[#AAB7B7]">
                  <ShieldCheck className="w-4 h-4 text-[#A8C5B5]" />
                  <span>Safety Record</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-white dark:text-[#D4D8DD]">
                  100% Zero OSHA
                </p>
                <span className="text-[10px] text-[#A8C5B5] font-semibold">
                  1,420 safe hours
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1A2D42]/70 border border-[#AAB7B7]/20">
                <div className="flex items-center gap-2 text-xs text-[#AAB7B7]">
                  <CheckCircle2 className="w-4 h-4 text-[#C0C8CA]" />
                  <span>QA / QC Compliance</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-white dark:text-[#D4D8DD]">
                  98.4% Passed
                </p>
                <span className="text-[10px] text-[#C0C8CA] font-semibold">
                  36/36 tests verified
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1A2D42]/70 border border-[#AAB7B7]/20">
                <div className="flex items-center gap-2 text-xs text-[#AAB7B7]">
                  <Clock className="w-4 h-4 text-[#AAB7B7]" />
                  <span>Schedule Health</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-white dark:text-[#D4D8DD]">
                  94.1% On Time
                </p>
                <span className="text-[10px] text-[#C0C8CA] font-semibold">
                  Critical path secure
                </span>
              </div>
            </div>

            {/* Upcoming Milestones Schedule List */}
            <div className="mt-4 divide-y divide-[#AAB7B7]/15">
              {[
                {
                  date: "Oct 12, 2026",
                  project: "Addis Heights Tower",
                  task: "Floor 18 Slab Rebar & Concrete Pouring",
                  status: "On Schedule",
                },
                {
                  date: "Oct 18, 2026",
                  project: "Modjo Logistics Hub",
                  task: "Substation Transformer Energization & Testing",
                  status: "Critical Path",
                },
                {
                  date: "Oct 25, 2026",
                  project: "Greenfield Eco-Resort",
                  task: "Phase 1 Foundation Geotechnical Signoff",
                  status: "In Preparation",
                },
              ].map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[11px] text-[#C0C8CA] shrink-0 font-bold bg-[#1A2D42] border border-[#AAB7B7]/30 px-2 py-0.5 rounded-md">
                      {item.date}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-white dark:text-[#D4D8DD] truncate block">
                        {item.task}
                      </span>
                      <span className="text-[11px] text-[#AAB7B7] truncate block">
                        {item.project}
                      </span>
                    </div>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Recent Activity / Table ─── */}
      <section className="glass-card border border-[#AAB7B7]/25 bg-[#2E4156]/85 dark:bg-[#2E4156]/90 text-[#D4D8DD] rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
        <div className="p-5 sm:p-6 border-b border-[#AAB7B7]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white dark:text-[#D4D8DD]">
              Recent Project Activity
            </h2>
            <p className="text-xs text-[#AAB7B7] mt-0.5">
              Live task execution, supervisor logs, and expenditure entries
            </p>
          </div>

          {/* Action buttons: Customize, Filter, Export */}
          <div className="flex flex-wrap items-center gap-2 relative">
            {/* Customize: toggle compact density */}
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border border-[#AAB7B7]/30 ${
                isCompact
                  ? "bg-[#C0C8CA] text-[#1A2D42] font-bold shadow-xs"
                  : "text-[#D4D8DD] bg-[#1A2D42] hover:bg-[#1A2D42]/80"
              }`}
              title="Toggle table row density"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isCompact ? "Compact View" : "Customize"}</span>
            </button>

            {/* Filter: interactive dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border border-[#AAB7B7]/30 ${
                  activityFilter !== "ALL"
                    ? "bg-[#C0C8CA] text-[#1A2D42] font-bold"
                    : "text-[#D4D8DD] bg-[#1A2D42] hover:bg-[#1A2D42]/80"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter{activityFilter !== "ALL" ? `: ${activityFilter}` : ""}</span>
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-[#1A2D42] border border-[#AAB7B7]/30 rounded-xl shadow-xl py-1 z-30">
                  {["ALL", "In Progress", "On Track", "At Risk", "Delayed"].map((statusOpt) => (
                    <button
                      key={statusOpt}
                      onClick={() => {
                        setActivityFilter(statusOpt);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                        activityFilter === statusOpt
                          ? "bg-[#2E4156] text-[#C0C8CA] font-bold"
                          : "text-[#D4D8DD] hover:bg-[#2E4156]/60"
                      }`}
                    >
                      {statusOpt === "ALL" ? "All Activities" : statusOpt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export: real CSV download */}
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#D4D8DD] bg-[#1A2D42] hover:bg-[#1A2D42]/80 border border-[#AAB7B7]/30 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Export activities to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A2D42]/80 text-[#AAB7B7] font-semibold uppercase tracking-wider text-[10px] border-b border-[#AAB7B7]/20">
              <tr>
                <th className={`px-5 ${isCompact ? "py-2" : "py-3"}`}>Project</th>
                <th className={`px-4 ${isCompact ? "py-2" : "py-3"}`}>Task</th>
                <th className={`px-4 ${isCompact ? "py-2" : "py-3"}`}>Assigned To</th>
                <th className={`px-4 ${isCompact ? "py-2" : "py-3"}`}>Date</th>
                <th className={`px-4 ${isCompact ? "py-2" : "py-3"}`}>Budget</th>
                <th className={`px-4 ${isCompact ? "py-2" : "py-3"}`}>Status</th>
                <th className={`px-5 text-right ${isCompact ? "py-2" : "py-3"}`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#AAB7B7]/15">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-[#1A2D42]/40 transition-colors">
                    <td className={`px-5 font-semibold text-white dark:text-[#D4D8DD] ${isCompact ? "py-2" : "py-3.5"}`}>
                      <Link href={`/projects/${act.id}/overview`} className="hover:text-[#C0C8CA] transition-colors">
                        {act.projectName}
                      </Link>
                      <span className="block text-[10px] text-[#AAB7B7] font-mono mt-0.5">{act.projectCode}</span>
                    </td>
                    <td className={`px-4 text-[#D4D8DD] ${isCompact ? "py-2" : "py-3.5"}`}>{act.task}</td>
                    <td className={`px-4 text-[#AAB7B7] ${isCompact ? "py-2" : "py-3.5"}`}>{act.assignedTo}</td>
                    <td className={`px-4 text-[#AAB7B7] whitespace-nowrap ${isCompact ? "py-2" : "py-3.5"}`}>{act.date}</td>
                    <td className={`px-4 font-semibold text-white dark:text-[#D4D8DD] ${isCompact ? "py-2" : "py-3.5"}`}>
                      {formatCurrency(act.budget, true)}
                    </td>
                    <td className={`px-4 ${isCompact ? "py-2" : "py-3.5"}`}>
                      <StatusBadge value={act.status} />
                    </td>
                    <td className={`px-5 text-right ${isCompact ? "py-2" : "py-3.5"}`}>
                      <Link
                        href={`/projects/${act.id}/overview`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#C0C8CA] hover:text-white hover:underline transition-colors"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#AAB7B7]">
                    No activity records match your selected filter ({activityFilter}).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (Visible only on <md viewports for responsive perfection) */}
        <div className="md:hidden divide-y divide-[#AAB7B7]/15">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((act) => (
              <div key={act.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${act.id}/overview`}
                      className="text-xs font-bold text-white dark:text-[#D4D8DD] hover:text-[#C0C8CA] truncate block"
                    >
                      {act.projectName}
                    </Link>
                    <span className="text-[10px] text-[#AAB7B7] font-mono">{act.projectCode}</span>
                  </div>
                  <StatusBadge value={act.status} />
                </div>

                <div className="text-xs text-[#D4D8DD]">
                  <span className="font-medium text-[#AAB7B7]">Task: </span>
                  {act.task}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#AAB7B7] pt-1">
                  <span>Assigned: {act.assignedTo}</span>
                  <span>{act.date}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#AAB7B7]/20">
                  <span className="font-bold text-white dark:text-[#D4D8DD]">
                    {formatCurrency(act.budget, true)}
                  </span>
                  <Link
                    href={`/projects/${act.id}/overview`}
                    className="text-xs font-semibold text-[#C0C8CA] hover:text-white flex items-center gap-1"
                  >
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-[#AAB7B7]">
              No recent activity records available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
