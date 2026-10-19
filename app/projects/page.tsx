import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { ProjectSummary } from "@/types/project";
import AppShell from "@/components/layout/AppShell";
import { Building2, Plus } from "lucide-react";
import { getActiveUser } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/rbac/permissions";
import ProjectsListClient from "@/components/projects/ProjectsListClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getActiveUser();
  if (!user) redirect("/login?next=/projects");
  await connectToDatabase();
  const access = user.role === "Admin"
    ? {}
    : { $or: [{ projectManager: user.id }, { teamMembers: user.id }] };
  const rawProjects = await Project.find(access).sort({ createdAt: -1 }).limit(100).lean();
  const projects = JSON.parse(JSON.stringify(rawProjects)) as ProjectSummary[];
  const canCreate = hasPermission(user, "PROJECT_CREATE");

  return (
    <AppShell userName={user.fullName} userRole={user.role} userEmail={user.email}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] text-xs font-bold uppercase tracking-wider mb-1 font-mono">
              <Building2 className="w-4 h-4" /> Enterprise Portfolio
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Construction Projects
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Comprehensive multi-project portfolio management and site execution.
            </p>
          </div>

          {canCreate && (
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs sm:text-sm font-bold shadow-md shadow-black/10 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Link>
          )}
        </div>

        {/* Project Cards with Real-time Search and Status Filters */}
        <ProjectsListClient initialProjects={projects} canCreate={canCreate} />
      </div>
    </AppShell>
  );
}
