import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { ProjectSummary } from "@/types/project";
import AppShell from "@/components/layout/AppShell";
import { Building2, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { getActiveUser } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/rbac/permissions";
import { buildProjectAccessQuery, normalizeProjectDocument } from "@/lib/services/access";
import ProjectsListClient from "@/components/projects/ProjectsListClient";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getActiveUser();
  if (!user) redirect("/login?next=/projects");

  let projects: ProjectSummary[] = [];
  let dbError: string | null = null;

  try {
    await connectToDatabase();
    const accessQuery = buildProjectAccessQuery(user);

    let rawProjects = await Project.find(accessQuery)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("projectManager", "fullName email username")
      .populate("teamMembers", "fullName email username role")
      .lean();

    // Check fallback for capital 'Projects' collection if zero records found
    if (rawProjects.length === 0 && mongoose.connection.db) {
      try {
        const altCollection = mongoose.connection.db.collection("Projects");
        const altCount = await altCollection.countDocuments();
        if (altCount > 0) {
          const altDocs = await altCollection.find({}).sort({ createdAt: -1 }).limit(100).toArray();
          rawProjects = altDocs as unknown as typeof rawProjects;
        }
      } catch {
        // Fallback silently
      }
    }

    projects = rawProjects.map((p) =>
      normalizeProjectDocument(JSON.parse(JSON.stringify(p)) as Record<string, unknown>)
    ) as unknown as ProjectSummary[];
  } catch (err: unknown) {
    console.error("[Projects Page] Failed to fetch projects:", err instanceof Error ? err.message : String(err));
    dbError = "Unable to connect to the project database. Please check database cluster connectivity.";
  }

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

        {/* Database Error State with Actionable Retry */}
        {dbError ? (
          <div className="rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#1F1F1F] p-8 text-center shadow-xs">
            <AlertCircle className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mx-auto mb-3" />
            <h2 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">
              Database Connection Error
            </h2>
            <p className="mt-1 text-xs text-[#666666] dark:text-[#A3A3A3] max-w-md mx-auto">
              {dbError}
            </p>
            <div className="mt-4">
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Project Cards with Real-time Search and Status Filters */
          <ProjectsListClient initialProjects={projects} canCreate={canCreate} />
        )}
      </div>
    </AppShell>
  );
}
