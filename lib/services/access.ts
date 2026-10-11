import { Project } from "@/models/Project";
import { SessionUser } from "@/types/erp";

export async function canAccessProject(user: SessionUser, projectId: string): Promise<boolean> {
  if (user.role === "Super Admin" || user.role === "Admin") return true;

  if (user.role === "Company Admin") {
    if (user.organizationId) {
      const project = await Project.exists({ _id: projectId, organizationId: user.organizationId });
      if (project) return true;
    }
    // Also fallback if project has no organizationId yet
    const anyOrgProject = await Project.exists({ _id: projectId });
    return Boolean(anyOrgProject);
  }

  // Explicit assigned projects list on user
  if (user.assignedProjects?.includes(projectId)) {
    return true;
  }

  const project = await Project.exists({
    _id: projectId,
    $or: [{ projectManager: user.id }, { teamMembers: user.id }],
  });
  return Boolean(project);
}
