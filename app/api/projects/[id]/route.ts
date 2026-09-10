import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { canAccessProject } from "@/lib/services/access";
import { Project } from "@/models/Project";
import { logAudit } from "@/lib/services/audit";
import mongoose from "mongoose";
import { projectUpdateSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

function validProjectId(id: string) {
  return mongoose.isObjectIdOrHexString(id);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("PROJECT_VIEW", request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!validProjectId(id)) return fail("VALIDATION_ERROR", "Invalid project ID", 422);

  try {
    await connectToDatabase();

    if (!(await canAccessProject(guard.user, id))) {
      return fail("FORBIDDEN", "You do not have permission to view this project", 403);
    }

    const project = await Project.findById(id)
      .populate("projectManager", "fullName email username role")
      .populate("teamMembers", "fullName email username role");

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    return ok(project);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("PROJECT_UPDATE", request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!validProjectId(id)) return fail("VALIDATION_ERROR", "Invalid project ID", 422);

  try {
    const patchData = await body(request, projectUpdateSchema);
    await connectToDatabase();

    if (!(await canAccessProject(guard.user, id))) {
      return fail("FORBIDDEN", "You do not have permission to modify this project", 403);
    }

    const oldProject = await Project.findById(id);
    if (!oldProject) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    const updated = await Project.findByIdAndUpdate(id, patchData, {
      new: true,
      runValidators: true,
    })
      .populate("projectManager", "fullName email username role")
      .populate("teamMembers", "fullName email username role");

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "PROJECT_UPDATED",
      entity: "Project",
      entityId: id,
      projectId: id,
      previousValue: {
        status: oldProject.status,
        totalBudget: oldProject.totalBudget,
        progressPercentage: oldProject.progressPercentage,
      },
      newValue: patchData,
    });

    return ok(updated, "Project updated successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("PROJECT_DELETE", request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!validProjectId(id)) return fail("VALIDATION_ERROR", "Invalid project ID", 422);

  try {
    await connectToDatabase();

    if (!(await canAccessProject(guard.user, id))) {
      return fail("FORBIDDEN", "You do not have permission to delete this project", 403);
    }

    // Soft delete / archive
    const project = await Project.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "PROJECT_ARCHIVED",
      entity: "Project",
      entityId: id,
      projectId: id,
    });

    return ok(project, "Project archived successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return PATCH(request, context);
}
