import { Project } from "@/models/Project";
import { SessionUser } from "@/types/erp";

export async function canAccessProject(user: SessionUser, projectId: string): Promise<boolean> {
  const accessFilter = user.role === "Admin"
    ? { _id: projectId }
    : { _id: projectId, $or: [{ projectManager: user.id }, { teamMembers: user.id }] };
  return Boolean(await Project.exists(accessFilter));
}
