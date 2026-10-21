import mongoose from "mongoose";
import { Project } from "@/models/Project";
import { SessionUser } from "@/types/erp";

/**
 * Builds an authoritative MongoDB query filter for projects based on the user's role,
 * multi-tenant organization boundary, and direct assignments.
 */
export function buildProjectAccessQuery(user: SessionUser): Record<string, unknown> {
  const isExecutive =
    user.role === "Super Admin" ||
    user.role === "Company Admin" ||
    user.role === "Admin" ||
    user.role === "Accountant" ||
    user.role === "Quantity Surveyor";

  // Executives and administrators have company-wide project visibility
  if (isExecutive) {
    if (user.organizationId && user.role !== "Super Admin" && user.role !== "Admin") {
      return {
        $or: [
          { organizationId: user.organizationId },
          { organizationId: null },
          { organizationId: { $exists: false } },
        ],
      };
    }
    return {};
  }

  // Non-executive roles: access projects where user is PM, team member, creator, or explicitly assigned
  const userObjId = mongoose.isObjectIdOrHexString(user.id)
    ? new mongoose.Types.ObjectId(user.id)
    : null;

  const conditions: Record<string, unknown>[] = [
    { projectManager: user.id },
    { teamMembers: user.id },
    { createdBy: user.id },
  ];

  if (userObjId) {
    conditions.push(
      { projectManager: userObjId },
      { teamMembers: userObjId },
      { createdBy: userObjId }
    );
  }

  if (Array.isArray(user.assignedProjects) && user.assignedProjects.length > 0) {
    const validIds = user.assignedProjects.filter((id) => mongoose.isObjectIdOrHexString(id));
    if (validIds.length > 0) {
      conditions.push({
        _id: {
          $in: [
            ...validIds,
            ...validIds.map((id) => new mongoose.Types.ObjectId(id)),
          ],
        },
      });
    }
  }

  return { $or: conditions };
}

/**
 * Verifies whether a user has permission to read or mutate a specific project.
 */
export async function canAccessProject(
  user: SessionUser,
  projectId: string | { _id?: unknown; id?: unknown }
): Promise<boolean> {
  const resolvedId =
    typeof projectId === "string"
      ? projectId
      : String(projectId?._id || projectId?.id || "");

  if (!resolvedId || !mongoose.Types.ObjectId.isValid(resolvedId)) {
    return false;
  }

  // Super Admin & Admin have platform-wide access
  if (user.role === "Super Admin" || user.role === "Admin") return true;

  // Fetch the project to inspect ownership, organization, and assignment
  const project = await Project.findById(resolvedId)
    .select("_id organizationId projectManager teamMembers createdBy")
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
  if (user.assignedProjects?.includes(resolvedId)) {
    return true;
  }

  // Extract ID whether projectManager is a string, ObjectId, or populated object
  const extractId = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "object" && val !== null) {
      return String((val as Record<string, unknown>)._id || (val as Record<string, unknown>).id || "");
    }
    return String(val);
  };

  const isPM = extractId(project.projectManager) === String(user.id);
  const isCreator = extractId(project.createdBy) === String(user.id);
  const isTeam =
    Array.isArray(project.teamMembers) &&
    project.teamMembers.some((m: unknown) => extractId(m) === String(user.id));

  return Boolean(isPM || isCreator || isTeam);
}

/**
 * Normalizes raw or legacy project documents (from .lean() queries) ensuring all fields,
 * aliases, and default values are populated cleanly for the UI and client components.
 */
export function normalizeProjectDocument<T extends Record<string, unknown>>(doc: T): T {
  if (!doc) return doc;
  const copy = { ...doc } as Record<string, unknown>;

  // Client name fallback
  if (!copy.client && copy.clientName) {
    copy.client = copy.clientName;
  } else if (!copy.client) {
    copy.client = "Apex Developments Client";
  }

  // Budget fallbacks
  if (copy.totalBudget === undefined && copy.budget !== undefined) {
    copy.totalBudget = copy.budget;
  } else if (copy.totalBudget === undefined && copy.contractValue !== undefined) {
    copy.totalBudget = copy.contractValue;
  } else if (copy.totalBudget === undefined) {
    copy.totalBudget = 0;
  }

  // Dates fallback
  if (!copy.expectedEndDate && copy.endDate) {
    copy.expectedEndDate = copy.endDate;
  }
  if (!copy.startDate && copy.createdAt) {
    copy.startDate = copy.createdAt;
  }

  // Progress fallback
  if (copy.progressPercentage === undefined && copy.progress !== undefined) {
    copy.progressPercentage = copy.progress;
  } else if (copy.progressPercentage === undefined) {
    copy.progressPercentage = 0;
  }

  // Status normalization
  if (copy.status && typeof copy.status === "string") {
    copy.status = copy.status.trim().toLowerCase();
  } else {
    copy.status = "planning";
  }

  // Health status
  if (!copy.healthStatus) {
    copy.healthStatus = "ON_TRACK";
  }

  // Location
  if (!copy.location) {
    copy.location = "Addis Ababa, Ethiopia";
  }

  return copy as T;
}
