import mongoose from "mongoose";
import { Project } from "@/models/Project";
import { SessionUser } from "@/types/erp";

export async function canAccessProject(user: SessionUser, projectId: string): Promise<boolean> {
  if (!projectId || typeof projectId !== "string" || !mongoose.Types.ObjectId.isValid(projectId)) {
    return false;
  }

  // Super Admin & Admin have platform-wide access
  if (user.role === "Super Admin" || user.role === "Admin") return true;

  // Fetch the project to inspect ownership and organization
  const project = await Project.findById(projectId)
    .select("_id organizationId projectManager teamMembers")
    .lean();

  if (!project) return false;

  const projectOrgId = project.organizationId ? String(project.organizationId) : null;
  const userOrgId = user.organizationId ? String(user.organizationId) : null;

  // Strict organization isolation: if project belongs to an organization, user must match it
  if (projectOrgId && userOrgId && projectOrgId !== userOrgId) {
    return false;
  }

  // If user belongs to an organization and project belongs to another, reject
  if (userOrgId && projectOrgId && userOrgId !== projectOrgId) {
    return false;
  }

  // Company Admin can access any project within their organization
  if (user.role === "Company Admin") {
    if (userOrgId) {
      return projectOrgId === userOrgId;
    }
    return !projectOrgId;
  }

  // Explicit assigned projects list on user profile
  if (user.assignedProjects?.includes(projectId)) {
    return true;
  }

  // Project manager or team member check
  const isPM = project.projectManager && String(project.projectManager) === String(user.id);
  const isTeam =
    Array.isArray(project.teamMembers) &&
    project.teamMembers.some((m: unknown) => String(m) === String(user.id));

  return Boolean(isPM || isTeam);
}

