import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import ProjectHeader from "@/components/project/ProjectHeader";
import ProjectNavigation from "@/components/project/ProjectNavigation";
import { getProject } from "@/lib/services/project-data";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  return (
    <AppShell>
      <div className="-m-4 min-h-screen bg-[#0f1115] text-slate-100 md:-m-6 lg:-m-8">
        <ProjectHeader project={project} />
        <ProjectNavigation projectId={projectId} />
        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">{children}</main>
      </div>
    </AppShell>
  );
}
