import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { ProjectSummary } from "@/types/project";
import AppShell from "@/components/layout/AppShell";
import { Building2, Plus, MapPin, DollarSign } from "lucide-react";
import { getActiveUser } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/rbac/permissions";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const user = await getActiveUser();
  if (!user) return null;
  await connectToDatabase();
  const accessFilter = { $or: [{ projectManager: user.id }, { teamMembers: user.id }] };
  const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const searchFilter = escapedQuery
    ? {
        $or: [
          { name: { $regex: escapedQuery, $options: "i" } },
          { projectCode: { $regex: escapedQuery, $options: "i" } },
          { location: { $regex: escapedQuery, $options: "i" } },
        ],
      }
    : null;
  const access = user.role === "Admin"
    ? searchFilter || {}
    : searchFilter ? { $and: [accessFilter, searchFilter] } : accessFilter;
  const rawProjects = await Project.find(access).sort({ createdAt: -1 }).limit(100).lean();
  const projects = JSON.parse(JSON.stringify(rawProjects)) as ProjectSummary[];
  const canCreate = hasPermission(user, "PROJECT_CREATE");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-[.16em] mb-1">
              <Building2 className="w-4 h-4" /> Enterprise Portfolio
            </div>
            <h1 className="text-3xl font-bold text-slate-950 tracking-tight">
              Construction Projects
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Comprehensive multi-project portfolio management and site execution.
            </p>
          </div>

          {canCreate && <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> New Project
          </Link>}
        </div>

        {/* Project Cards Grid */}
        {projects.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-slate-800">{q ? "No matching projects" : "No projects yet"}</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {q ? `No accessible projects match “${q}”.` : "Create the first project to start managing tasks, procurement, budgets, and site milestones."}
            </p>
            {q && <Link href="/projects" className="mt-4 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Clear search</Link>}
            {canCreate && <Link
              href="/projects/new"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Create Project
            </Link>}
          </section>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const formattedBudget =
                project.totalBudget >= 1000000
                  ? `ETB ${(project.totalBudget / 1000000).toFixed(2)}M`
                  : `ETB ${project.totalBudget.toLocaleString()}`;

              return (
                <Link
                  key={project._id}
                  href={`/projects/${project._id}/overview`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-mono text-amber-700 font-semibold">
                          {project.projectCode}
                        </span>
                        <h2 className="mt-1 text-base font-semibold text-slate-900 group-hover:text-amber-800 transition-colors">
                          {project.name}
                        </h2>
                      </div>
                      <StatusBadge value={project.healthStatus || project.status} />
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{project.location || "Addis Ababa, Ethiopia"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Budget: <strong className="text-slate-800">{formattedBudget}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-amber-700 font-mono font-bold">
                        {project.progressPercentage}%
                      </span>
                    </div>
                    <ProgressBar value={project.progressPercentage} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
