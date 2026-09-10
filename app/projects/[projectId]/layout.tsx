import { ReactNode } from "react";
import ProjectHeader from "@/components/project/ProjectHeader";
import ProjectNavigation from "@/components/project/ProjectNavigation";
import { getProject } from "@/lib/services/project-data";

export default async function ProjectLayout({ children, params }: { children: ReactNode; params: Promise<{ projectId: string }> }) { const { projectId } = await params; const project = await getProject(projectId); return <div className="min-h-screen bg-[#0f1115] text-slate-100"><ProjectHeader project={project} /><ProjectNavigation projectId={projectId} /><main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">{children}</main></div>; }
