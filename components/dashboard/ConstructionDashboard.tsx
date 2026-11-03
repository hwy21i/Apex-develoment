"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
  ChevronRight,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentUser } from "@/components/auth/UserProvider";
import { useSearch } from "@/components/layout/AppShell";
import { exportCsv } from "@/lib/exportCsv";
import { getCached, setCached } from "@/lib/client-cache";
import { downloadReportPdf } from "@/lib/exportPdf";
import { RoleType } from "@/types/erp";
import type { ProjectLocationItem } from "./ProjectLocationsMap";

const ProjectLocationsMap = dynamic(() => import("./ProjectLocationsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[460px] rounded-3xl bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] animate-pulse flex items-center justify-center text-xs font-mono text-[#666666] dark:text-[#A3A3A3]">
      Loading Construction Sites Map...
    </div>
  ),
});

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
    label: "Daily Capital Outlay",
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
    label: "Weekly Execution Velocity",
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
  userRole,
  onCreate,
}: {
  userName?: string;
  userRole?: RoleType;
  onCreate?: () => void;
}) {
  const { user } = useCurrentUser();
  const { searchQuery } = useSearch();
  const cachedInitial = useMemo(() => getCached<DashboardData>("dashboard_data"), []);
  const [data, setData] = useState<DashboardData | null>(cachedInitial);
  const [loading, setLoading] = useState(!cachedInitial);
  const [error, setError] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("Month");
  const [activityFilter, setActivityFilter] = useState<string>("ALL");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadMasterPdf = async () => {
    setDownloadingPdf(true);
    await downloadReportPdf("master-executive", {
      title: "Master Executive Intelligence Dossier",
      filename: `Apex_Master_Executive_Report_${new Date().toISOString().split("T")[0]}.pdf`,
    });
    setDownloadingPdf(false);
  };

  // Dynamic Current Date for Greeting
  const currentDateString = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date());
  }, []);

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
          setCached("dashboard_data", result.data, 60_000);
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

  const currentRole = userRole || user?.role || "Admin";

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "Project Manager":
        return "Schedule tracking, milestone execution, critical path dependencies & workforce allocation.";
      case "Site Engineer":
        return "On-site structural execution, daily safety inspections, and engineering task logs.";
      case "Contractor":
        return "Subcontracted site packages, field worker deployment, and materials requisitions.";
      case "Supplier":
        return "Inbound materials dispatch, route checkpoints telemetry, and purchase orders fulfillment.";
      case "Procurement Officer":
        return "Purchase orders lifecycle, supplier quotations, and material inventory restocking.";
      case "Warehouse Manager":
      case "Storekeeper":
        return "Central inventory ledger, stock valuation, and materials issue/receipt audit.";
      case "Accountant":
        return "CSI division cost accounting, expenditure ledger, and budget variance controls.";
      case "Worker":
        return "Assigned construction deliverables, task checklist, and site attendance.";
      default:
        return "Enterprise portfolio execution, active construction sites & fiscal intelligence.";
    }
  };

  const resolvedName = userName || user?.fullName || "";
  const displayName = resolvedName
    ? resolvedName.split(" ")[0]
    : user?.username || (user?.role ? user.role : "Builder");

  // Loading skeleton state
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-[#FFFFFF] dark:bg-[#111111] rounded-3xl w-full border border-[#D4D4D4] dark:border-[#303030]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#FFFFFF] dark:bg-[#111111] rounded-3xl border border-[#D4D4D4] dark:border-[#303030]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-[#FFFFFF] dark:bg-[#111111] rounded-3xl border border-[#D4D4D4] dark:border-[#303030]" />
          <div className="h-96 bg-[#FFFFFF] dark:bg-[#111111] rounded-3xl border border-[#D4D4D4] dark:border-[#303030]" />
        </div>
      </div>
    );
  }

  // Error fallback
  if (error && !data) {
    return (
      <div className="rounded-3xl border border-[#303030] dark:border-[#D4D4D4] bg-[#FAFAFA] dark:bg-[#171717] p-6 text-[#000000] dark:text-[#FFFFFF]">
        <h2 className="font-bold text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#666666] dark:text-[#A3A3A3]" />
          Unable to synchronize dashboard
        </h2>
        <p className="mt-2 text-sm text-[#666666] dark:text-[#A3A3A3]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-5 py-2.5 bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] rounded-full text-xs font-semibold shadow-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Fallback defaults
  const activeProjectsCount = data?.activeProjects ?? data?.projects?.active ?? 0;
  const totalBudgetVal = data?.totalBudget ?? data?.financial?.budget ?? 0;
  const totalExpensesVal = data?.totalExpenses ?? data?.financial?.expenses ?? 0;
  const overallProgressVal = data?.overallProgress ?? 0;

  // Real projects list
  const projectsList = data?.projects?.items || [];
  const activeProjectsList = projectsList.slice(0, 5);

  // Real tasks calculation for Donut Chart
  const taskTotals = data?.tasks?.total ?? 0;
  const taskCompleted = data?.tasks?.completed ?? 0;
  const taskInProgress = data?.tasks?.inProgress ?? 0;
  const taskOverdue = data?.tasks?.overdue ?? 0;
  const taskPending = Math.max(0, taskTotals - (taskCompleted + taskInProgress + taskOverdue));

  const pctCompleted = taskTotals > 0 ? Math.round((taskCompleted / taskTotals) * 100) : 0;
  const pctInProgress = taskTotals > 0 ? Math.round((taskInProgress / taskTotals) * 100) : 0;
  const pctPending = taskTotals > 0 ? Math.round((taskPending / taskTotals) * 100) : 0;
  const pctOverdue = taskTotals > 0 ? Math.round((taskOverdue / taskTotals) * 100) : 0;

  // Donut circumference for r=52 (C ≈ 326.73)
  const C = 2 * Math.PI * 52;
  const offsetCompleted = 0;
  const lenCompleted = (pctCompleted / 100) * C;
  const offsetInProgress = lenCompleted;
  const lenInProgress = (pctInProgress / 100) * C;
  const offsetPending = lenCompleted + lenInProgress;
  const lenPending = (pctPending / 100) * C;
  const offsetOverdue = offsetPending + lenPending;
  const lenOverdue = (pctOverdue / 100) * C;

  // Project Locations will be resolved automatically from real projects in the database
  const mappedLocations: ProjectLocationItem[] = [];

  // Recent activity entries
  const recentActivities = projectsList.slice(0, 6).map((project, idx) => {
    const task = data?.tasks?.items?.[idx] || {
      title: idx % 2 === 0 ? "Structural Concrete & Rebar Placement" : "HVAC & Electrical Rough-in",
      assignedTo: project.manager || "Site Engineering Team",
    };
    return {
      id: project.id,
      projectName: project.name,
      projectCode: project.projectCode,
      task: task.title,
      assignedTo: task.assignedTo,
      date: project.startDate
        ? new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Oct 14",
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
      {/* ─── 1. Welcome Section & Contextual Greeting ─── */}
      <section className="v18-card animate-v18-spring relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F5] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-xs font-mono text-[#666666] dark:text-[#A3A3A3]">
              <span>{currentDateString}</span>
              <span>•</span>
              <span className="text-[#000000] dark:text-[#FFFFFF] font-semibold">Active Session</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role: {currentRole}</span>
            </span>
            {user?.department && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F5F5F5] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[11px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                Dept: {user.department}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3]">
            {getRoleDescription(currentRole)}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/deliveries"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-[#000000] dark:text-[#FFFFFF] px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-colors"
            title="Track Active Deliveries & Waypoints"
          >
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Deliveries</span>
          </Link>
          <button
            onClick={handleDownloadMasterPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-[#000000] dark:text-[#FFFFFF] px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
            title="Download Full Master Executive Dossier (PDF)"
          >
            {downloadingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{downloadingPdf ? "Generating..." : "Executive PDF"}</span>
          </button>
          {onCreate ? (
            <button
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] hover:opacity-90 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-opacity active:scale-98"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
          ) : (
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] hover:opacity-90 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-opacity active:scale-98"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Link>
          )}
        </div>
      </section>

      {/* ─── 2. Top 4 Monochrome KPI Cards ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Projects */}
        <div className="v18-card animate-v18-spring v18-stagger-1 p-5 border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] rounded-3xl shadow-sm transition-all hover:border-[#000000] dark:hover:border-[#FFFFFF]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Active Projects
            </span>
            <span className="p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">
              {activeProjectsCount}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +8.4%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#A3A3A3] dark:text-[#777777]">
            from last month
          </p>
        </div>

        {/* Card 2: Total Contract Value */}
        <div className="v18-card animate-v18-spring v18-stagger-2 p-5 border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] rounded-3xl shadow-sm transition-all hover:border-[#000000] dark:hover:border-[#FFFFFF]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Total Contract Value
            </span>
            <span className="p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight truncate">
              {formatCurrency(totalBudgetVal, true)}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-[#000000] dark:text-[#FFFFFF] gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +4.2%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#A3A3A3] dark:text-[#777777]">
            Portfolio commitment
          </p>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="v18-card animate-v18-spring v18-stagger-3 p-5 border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] rounded-3xl shadow-sm transition-all hover:border-[#000000] dark:hover:border-[#FFFFFF]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Total Expenses
            </span>
            <span className="p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]">
              <ClipboardList className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] truncate">
              {formatCurrency(totalExpensesVal, true)}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              -2.1%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#A3A3A3] dark:text-[#777777]">
            from last month
          </p>
        </div>

        {/* Card 4: Project Progress */}
        <div className="v18-card animate-v18-spring v18-stagger-4 p-5 border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] rounded-3xl shadow-sm transition-all hover:border-[#000000] dark:hover:border-[#FFFFFF]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Project Progress
            </span>
            <span className="p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">
              {overallProgressVal}%
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +6.3%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#A3A3A3] dark:text-[#777777]">
            from last month
          </p>
        </div>
      </section>

      {/* ─── 3. Main Analytics: Progress Overview (Line) + Tasks Overview (Donut) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress Overview: Monochrome Line Chart Card */}
        <div className="v18-card animate-v18-spring v18-stagger-3 lg:col-span-2 border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div>
                <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Project Progress Overview
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                  Portfolio execution, budget realization &amp; task milestones
                </p>
              </div>

              {/* Timeframe filters: Day, Week, Month, Year */}
              <div className="flex items-center gap-1 p-1 bg-[#F5F5F5] dark:bg-[#171717] rounded-full border border-[#D4D4D4] dark:border-[#303030] self-start sm:self-auto">
                {(["Day", "Week", "Month", "Year"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all ${
                      timeFilter === filter
                        ? "bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] font-bold shadow-2xs border border-[#D4D4D4] dark:border-[#303030]"
                        : "text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
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
                <span className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">
                  {formatCurrency(totalBudgetVal * TIMEFRAME_CONFIG[timeFilter].multiplier, true)}
                </span>
                <span className="ml-2 inline-flex items-center text-xs font-bold text-[#000000] dark:text-[#FFFFFF] gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {TIMEFRAME_CONFIG[timeFilter].trend}
                </span>
              </div>
              <div className="text-xs text-[#666666] dark:text-[#A3A3A3] flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#111111] dark:bg-[#FFFFFF]" />
                  Planned Trajectory
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A3A3A3] dark:bg-[#777777]" />
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
                  <linearGradient id="monoChartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" className="text-[#D4D4D4] dark:text-[#303030]" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" className="text-[#D4D4D4] dark:text-[#303030]" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="currentColor" className="text-[#D4D4D4] dark:text-[#303030]" strokeDasharray="3 3" />

                {/* Secondary Line: Actual Disbursed */}
                <path
                  d={TIMEFRAME_CONFIG[timeFilter].secondaryPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="text-[#A3A3A3] dark:text-[#777777] transition-all duration-300"
                />

                {/* Area Gradient Fill under Primary Line */}
                <path
                  d={TIMEFRAME_CONFIG[timeFilter].areaPath}
                  fill="url(#monoChartGradient)"
                  className="text-[#111111] dark:text-[#FFFFFF] transition-all duration-300"
                />

                {/* Primary Chart Line */}
                <path
                  d={TIMEFRAME_CONFIG[timeFilter].primaryPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="text-[#111111] dark:text-[#FFFFFF] transition-all duration-300"
                />

                {/* Data Points */}
                {TIMEFRAME_CONFIG[timeFilter].points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r={i === TIMEFRAME_CONFIG[timeFilter].points.length - 1 ? 4.5 : 3}
                    className="fill-[#FFFFFF] dark:fill-[#111111] stroke-[#111111] dark:stroke-[#FFFFFF] transition-all duration-300"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>

            {/* Dynamic labels */}
            <div className="mt-2 flex justify-between text-[11px] font-mono text-[#A3A3A3] dark:text-[#777777] px-2">
              {TIMEFRAME_CONFIG[timeFilter].labels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex items-center justify-between text-xs">
            <span className="text-[#666666] dark:text-[#A3A3A3]">
              Realization rate: <strong className="text-[#000000] dark:text-[#FFFFFF]">92.4% on schedule</strong>
            </span>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 font-semibold text-[#000000] dark:text-[#FFFFFF] hover:underline transition-colors"
            >
              View detailed report <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tasks Overview: Circular Donut Visualization (Section 4.G) */}
        <div className="v18-card animate-v18-spring v18-stagger-4 border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div>
                <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Tasks Overview
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                  Real-time work order breakdown
                </p>
              </div>
              <Link
                href="/tasks"
                className="p-2 rounded-full text-[#666666] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#252525] transition-colors"
                title="View all tasks"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Circular Donut Visualization */}
            <div className="my-5 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-[#F5F5F5] dark:text-[#171717]"
                  />
                  {/* Completed Segment */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={`${lenCompleted} ${C}`}
                    strokeDashoffset={-offsetCompleted}
                    className="text-[#111111] dark:text-[#FFFFFF] transition-all duration-500"
                  />
                  {/* In Progress Segment */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={`${lenInProgress} ${C}`}
                    strokeDashoffset={-offsetInProgress}
                    className="text-[#666666] dark:text-[#A3A3A3] transition-all duration-500"
                  />
                  {/* Pending Segment */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={`${lenPending} ${C}`}
                    strokeDashoffset={-offsetPending}
                    className="text-[#D1D5DB] dark:text-[#383838] transition-all duration-500"
                  />
                  {/* Overdue Segment */}
                  {pctOverdue > 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r="52"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${lenOverdue} ${C}`}
                      strokeDashoffset={-offsetOverdue}
                      className="text-[#666666] dark:text-[#A3A3A3] transition-all duration-500"
                    />
                  )}
                </svg>

                {/* Center Percentage Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
                    {taskTotals}
                  </span>
                  <span className="text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] tracking-wide">
                    {pctCompleted}% Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Task Breakdown Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
                  <span className="w-2 h-2 rounded-full bg-[#111111] dark:bg-[#FFFFFF]" />
                  <span>Completed</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="font-bold text-[#000000] dark:text-[#FFFFFF]">{taskCompleted}</span>
                  <span className="text-[10px] text-[#A3A3A3] dark:text-[#777777]">{pctCompleted}%</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
                  <span className="w-2 h-2 rounded-full bg-[#666666] dark:bg-[#A3A3A3]" />
                  <span>In Progress</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="font-bold text-[#000000] dark:text-[#FFFFFF]">{taskInProgress}</span>
                  <span className="text-[10px] text-[#A3A3A3] dark:text-[#777777]">{pctInProgress}%</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
                  <span className="w-2 h-2 rounded-full bg-[#D1D5DB] dark:bg-[#383838]" />
                  <span>Pending</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="font-bold text-[#000000] dark:text-[#FFFFFF]">{taskPending}</span>
                  <span className="text-[10px] text-[#A3A3A3] dark:text-[#777777]">{pctPending}%</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
                  <span className="w-2 h-2 rounded-full bg-[#666666] dark:bg-[#A3A3A3]" />
                  <span>Overdue</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="font-bold text-[#666666] dark:text-[#A3A3A3]">{taskOverdue}</span>
                  <span className="text-[10px] text-[#666666] dark:text-[#A3A3A3]">{pctOverdue}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex items-center justify-between text-xs">
            <span className="text-[#666666] dark:text-[#A3A3A3]">
              Total assigned: <strong className="text-[#000000] dark:text-[#FFFFFF]">{taskTotals} tasks</strong>
            </span>
            <Link
              href="/tasks"
              className="text-[#000000] dark:text-[#FFFFFF] font-semibold hover:underline"
            >
              Task Board →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. Secondary Grid: Active Projects + Project Locations (Section 4.F) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Active Construction Projects List */}
        <div className="v18-card animate-v18-spring v18-stagger-5 lg:col-span-5 border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div>
                <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Active Construction Sites
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                  Ongoing engineering sites &amp; execution progress
                </p>
              </div>
              <Link
                href="/projects"
                className="p-2 rounded-full text-[#666666] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#252525] transition-colors"
                title="View all projects"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* List of active projects */}
            <div className="mt-4 divide-y divide-[#D4D4D4] dark:divide-[#303030]">
              {activeProjectsList.length > 0 ? (
                activeProjectsList.map((project) => (
                  <div key={project.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/projects/${project.id}/overview`}
                          className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF] hover:underline transition-all truncate block"
                        >
                          {project.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
                          <span className="font-mono">{project.projectCode}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="w-3 h-3 text-[#A3A3A3] dark:text-[#777777] shrink-0" />
                            {project.location || "Addis Ababa"}
                          </span>
                        </div>
                      </div>
                      <StatusBadge value={project.health || project.status} />
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#666666] dark:text-[#A3A3A3] font-mono">
                        <span>Milestone Progress</span>
                        <span className="font-bold text-[#000000] dark:text-[#FFFFFF]">
                          {project.progress}%
                        </span>
                      </div>
                      <ProgressBar value={project.progress} className="h-1.5" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#666666] dark:text-[#A3A3A3]">
                  No active projects currently available.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
            <Link
              href="/projects/new"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#F5F5F5] dark:bg-[#171717] hover:bg-[#D4D4D4] dark:hover:bg-[#252525] text-[#000000] dark:text-[#FFFFFF] font-semibold text-xs rounded-full border border-[#D4D4D4] dark:border-[#303030] transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
              <span>Add New Construction Site</span>
            </Link>
          </div>
        </div>

        {/* Right 7 Cols: Project Locations Map Component (Section 4.F) */}
        <div className="lg:col-span-7 flex flex-col">
          <ProjectLocationsMap locations={mappedLocations} projects={projectsList} />
        </div>
      </section>

      {/* ─── 5. Recent Activity / Table with Filtering & CSV Export ─── */}
      <section className="v18-card animate-v18-spring v18-stagger-5 border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] rounded-3xl overflow-hidden shadow-md">
        <div className="p-5 sm:p-6 border-b border-[#D4D4D4] dark:border-[#303030] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
              Recent Project Activity
            </h2>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">
              Live task execution, supervisor logs, and expenditure entries
            </p>
          </div>

          {/* Action buttons: Customize, Filter, Export */}
          <div className="flex flex-wrap items-center gap-2 relative">
            {/* Customize: toggle compact density */}
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border border-[#D4D4D4] dark:border-[#303030] ${
                isCompact
                  ? "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] font-bold shadow-2xs"
                  : "text-[#000000] dark:text-[#FFFFFF] bg-[#FAFAFA] dark:bg-[#171717] hover:bg-[#F5F5F5] dark:hover:bg-[#252525]"
              }`}
              title="Toggle table row density"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isCompact ? "Compact View" : "Density"}</span>
            </button>

            {/* Filter: interactive dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border border-[#D4D4D4] dark:border-[#303030] ${
                  activityFilter !== "ALL"
                    ? "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] font-bold"
                    : "text-[#000000] dark:text-[#FFFFFF] bg-[#FAFAFA] dark:bg-[#171717] hover:bg-[#F5F5F5] dark:hover:bg-[#252525]"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter{activityFilter !== "ALL" ? `: ${activityFilter}` : ""}</span>
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                  {["ALL", "In Progress", "On Track", "At Risk", "Delayed"].map((statusOpt) => (
                    <button
                      key={statusOpt}
                      onClick={() => {
                        setActivityFilter(statusOpt);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                        activityFilter === statusOpt
                          ? "bg-[#F5F5F5] dark:bg-[#252525] text-[#000000] dark:text-[#FFFFFF] font-bold"
                          : "text-[#666666] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#252525]"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] dark:text-[#111111] bg-[#111111] dark:bg-[#FFFFFF] hover:opacity-90 rounded-full transition-opacity shadow-xs"
              title="Export activities to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Master Executive PDF Download */}
            <button
              onClick={handleDownloadMasterPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] rounded-full transition-colors shadow-xs disabled:opacity-50"
              title="Download Full Master Executive Dossier (PDF)"
            >
              {downloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{downloadingPdf ? "Compiling..." : "Executive PDF"}</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
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
            <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#252525] transition-colors">
                    <td className={`px-5 font-semibold text-[#000000] dark:text-[#FFFFFF] ${isCompact ? "py-2" : "py-3.5"}`}>
                      <Link href={`/projects/${act.id}/overview`} className="hover:underline transition-all">
                        {act.projectName}
                      </Link>
                      <span className="block text-[10px] text-[#A3A3A3] dark:text-[#777777] font-mono mt-0.5">{act.projectCode}</span>
                    </td>
                    <td className={`px-4 text-[#000000] dark:text-[#FFFFFF] ${isCompact ? "py-2" : "py-3.5"}`}>{act.task}</td>
                    <td className={`px-4 text-[#666666] dark:text-[#A3A3A3] ${isCompact ? "py-2" : "py-3.5"}`}>{act.assignedTo}</td>
                    <td className={`px-4 text-[#666666] dark:text-[#A3A3A3] whitespace-nowrap ${isCompact ? "py-2" : "py-3.5"}`}>{act.date}</td>
                    <td className={`px-4 font-semibold text-[#000000] dark:text-[#FFFFFF] ${isCompact ? "py-2" : "py-3.5"}`}>
                      {formatCurrency(act.budget, true)}
                    </td>
                    <td className={`px-4 ${isCompact ? "py-2" : "py-3.5"}`}>
                      <StatusBadge value={act.status} />
                    </td>
                    <td className={`px-5 text-right ${isCompact ? "py-2" : "py-3.5"}`}>
                      <Link
                        href={`/projects/${act.id}/overview`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:underline transition-colors"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                    No activity records match your selected filter ({activityFilter}).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-[#D4D4D4] dark:divide-[#303030] p-3 space-y-2">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((act) => (
              <div key={act.id} className="p-4 space-y-2 rounded-2xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${act.id}/overview`}
                      className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF] hover:underline truncate block"
                    >
                      {act.projectName}
                    </Link>
                    <span className="text-[10px] text-[#A3A3A3] dark:text-[#777777] font-mono">{act.projectCode}</span>
                  </div>
                  <StatusBadge value={act.status} />
                </div>

                <div className="text-xs text-[#000000] dark:text-[#FFFFFF]">
                  <span className="font-medium text-[#666666] dark:text-[#A3A3A3]">Task: </span>
                  {act.task}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#666666] dark:text-[#A3A3A3] pt-1">
                  <span>Assigned: {act.assignedTo}</span>
                  <span>{act.date}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#D4D4D4] dark:border-[#303030]">
                  <span className="font-bold text-[#000000] dark:text-[#FFFFFF]">
                    {formatCurrency(act.budget, true)}
                  </span>
                  <Link
                    href={`/projects/${act.id}/overview`}
                    className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:underline flex items-center gap-1"
                  >
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-[#666666] dark:text-[#A3A3A3]">
              No recent activity records available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
