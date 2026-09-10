import ProjectModuleEmpty from "@/components/project/ProjectModuleEmpty";
import { getProject } from "@/lib/services/project-data";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectModuleEmpty title="Documents" description="Contracts, drawings, permits, invoices, and safety files." project={await getProject(projectId)} />;
}
