import { Project } from "@/models/Project";
import { SessionUser } from "@/types/erp";

export async function canAccessProject(user: SessionUser, projectId: string): Promise<boolean> {
  if (user.role === "Admin") return true;
  const project = await Project.exists({
    _id: projectId,
    $or: [{ projectManager: user.id }, { teamMembers: user.id }],
  });
  return Boolean(project);
}
