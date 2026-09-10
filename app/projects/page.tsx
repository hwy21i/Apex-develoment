import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { ProjectSummary } from "@/types/project";
import AppShell from "@/components/layout/AppShell";
import { Building2, Plus, MapPin, Calendar, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await connectToDatabase();
  const rawProjects = await Project.find().sort({ createdAt: -1 }).limit(100).lean();
  const projects = JSON.parse(JSON.stringify(rawProjects)) as ProjectSummary[];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" /> Enterprise Portfolio
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Construction Projects
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Comprehensive multi-project portfolio management and site execution.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>

        {/* Project Cards Grid */}
        {projects.length === 0 ? (
          <section className="rounded-xl border border-dashed border-[#2A3042] bg-[#141720] p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-slate-300">No projects yet</h2>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Create the first project to start managing tasks, procurement, budgets, and site milestones.
            </p>
            <Link
              href="/projects/new"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Create Project
            </Link>
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
                  className="group rounded-xl border border-[#232733] bg-[#141720] p-5 transition-all hover:border-blue-500/50 hover:bg-[#181C26] shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-mono text-blue-400 font-semibold">
                          {project.projectCode}
                        </span>
                        <h2 className="mt-1 text-base font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {project.name}
                        </h2>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                        {project.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{project.location || "Addis Ababa, Ethiopia"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Budget: <strong className="text-slate-200">{formattedBudget}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#1F2330]">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-blue-400 font-mono font-bold">
                        {project.progressPercentage}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#1E2330]">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${project.progressPercentage}%` }}
                      />
                    </div>
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
