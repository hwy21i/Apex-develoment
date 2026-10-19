import { ReactNode } from "react";
import ProjectHeader from "@/components/project/ProjectHeader";
import ProjectNavigation from "@/components/project/ProjectNavigation";
import { getProject } from "@/lib/services/project-data";
import AppShell from "@/components/layout/AppShell";

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
      <div className="space-y-6">
        <ProjectHeader project={project} />
        <ProjectNavigation projectId={projectId} />
        <main>{children}</main>
      </div>
    </AppShell>
  );
}
