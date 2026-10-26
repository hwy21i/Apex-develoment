import { getProject } from "@/lib/services/project-data";
import ProjectForm from "@/components/project/ProjectForm";
import { Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}/overview`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Project Overview</span>
        </Link>
        <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-bold uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" /> Project Modification
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
          Edit Project: {project.name}
        </h1>
        <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
          Update site parameters, milestone dates, budget allocations, or execution status.
        </p>
      </div>

      <ProjectForm initialProject={project} />
    </div>
  );
}
