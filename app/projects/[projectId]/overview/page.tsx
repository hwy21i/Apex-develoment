import { getProject, getProjectTaskMetrics } from "@/lib/services/project-data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Building2, Calendar, DollarSign, Layers, MapPin, Users, CheckSquare } from "lucide-react";
import Link from "next/link";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});
const date = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
const fmt = (v: number | null | undefined) =>
  money.format(Number.isFinite(Number(v)) ? Number(v) : 0);

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  const tasks = await getProjectTaskMetrics(project._id);
  const budget = project.revisedBudget ?? project.totalBudget;
  const duration = Math.max(
    0,
    Math.ceil(
      (new Date(project.expectedEndDate).getTime() - new Date(project.startDate).getTime()) /
        86400000
    )
  );

  const remaining = project.remainingBudget ?? budget - project.amountSpent;
  const budgetUtilization = budget > 0 ? Math.min(100, Math.round((project.amountSpent / budget) * 100)) : 0;

  const cards = [
    { label: "Overall Progress", value: `${project.progressPercentage}%`, sub: "Weighted physical completion" },
    { label: "Task Velocity", value: `${tasks.completion}%`, sub: `${tasks.completed} of ${tasks.total} completed` },
    { label: "Remaining Budget", value: fmt(remaining), sub: `${budgetUtilization}% utilized to date` },
    { label: "Target Duration", value: `${duration} days`, sub: `Ends ${date.format(new Date(project.expectedEndDate))}` },
  ];

  return (
    <section className="space-y-6">
      {/* Overview Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
            <Building2 className="w-4 h-4" /> Project Executive Dashboard
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
            {project.name}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3]">
            {project.client} · {project.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={project.healthStatus || project.status} />
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-5 shadow-xs"
          >
            <p className="text-[11px] font-mono uppercase font-bold text-[#666666] dark:text-[#A3A3A3]">
              {c.label}
            </p>
            <strong className="mt-2 block text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">
              {c.value}
            </strong>
            <p className="mt-1 text-[11px] text-[#666666] dark:text-[#A3A3A3] font-normal">
              {c.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Scope and Objectives */}
      {project.description && (
        <div className="rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-xs space-y-2">
          <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-[#666666] dark:text-[#A3A3A3]">
            Scope of Works & Architectural Objectives
          </h3>
          <p className="text-xs sm:text-sm text-[#000000] dark:text-[#FFFFFF] leading-relaxed font-normal">
            {project.description}
          </p>
        </div>
      )}

      {/* Commercial & Delivery Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
            <h3 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF] flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Commercial & Fiscal Summary
            </h3>
            <Link
              href={`/projects/${project._id}/budget`}
              className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            >
              Cost codes →
            </Link>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-5 text-xs">
            <Detail label="Contract Value" value={fmt(project.contractValue)} />
            <Detail label="Approved Budget" value={fmt(budget)} />
            <Detail label="Actual Expenses" value={fmt(project.amountSpent)} />
            <Detail label="Committed Purchase Orders" value={fmt(project.committedCost)} />
          </dl>
          <div className="mt-5 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
            <div className="flex justify-between text-xs mb-1.5 font-mono">
              <span className="text-[#666666] dark:text-[#A3A3A3]">Budget Absorption</span>
              <span className="text-[#000000] dark:text-[#FFFFFF] font-bold">{budgetUtilization}%</span>
            </div>
            <ProgressBar value={budgetUtilization} />
          </div>
        </section>

        <section className="rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
            <h3 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF] flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Delivery & Execution Telemetry
            </h3>
            <Link
              href={`/projects/${project._id}/phases`}
              className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            >
              Phases matrix →
            </Link>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-5 text-xs">
            <Detail label="Groundbreaking Date" value={date.format(new Date(project.startDate))} />
            <Detail label="Handover Target" value={date.format(new Date(project.expectedEndDate))} />
            <Detail label="Active Site Tasks" value={String(tasks.active)} />
            <Detail label="Completed Tasks" value={`${tasks.completed} of ${tasks.total}`} />
          </dl>
          <div className="mt-5 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
            <div className="flex justify-between text-xs mb-1.5 font-mono">
              <span className="text-[#666666] dark:text-[#A3A3A3]">Physical Completion</span>
              <span className="text-[#000000] dark:text-[#FFFFFF] font-bold">{project.progressPercentage}%</span>
            </div>
            <ProgressBar value={project.progressPercentage} />
          </div>
        </section>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#666666] dark:text-[#A3A3A3]">
        {label}
      </dt>
      <dd className="mt-1 font-bold text-[#000000] dark:text-[#FFFFFF] text-xs sm:text-sm">
        {value}
      </dd>
    </div>
  );
}
