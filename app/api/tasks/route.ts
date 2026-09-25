import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { taskSchema } from "@/lib/validation/schemas";
import { canAccessProject } from "@/lib/services/access";
import { Task } from "@/models/Task";
import { Project } from "@/models/Project";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("TASK_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const filters: Record<string, unknown>[] = [];
    if (mine) filters.push({ assignedTo: guard.user.id });
    if (guard.user.role !== "Admin") {
      const projectIds = await Project.find({
        $or: [{ projectManager: guard.user.id }, { teamMembers: guard.user.id }],
      }).distinct("_id");
      filters.push({ projectId: { $in: projectIds } });
    }
    if (projectId) {
      if (!/^[a-f\d]{24}$/i.test(projectId)) {
        return fail("VALIDATION_ERROR", "Invalid project ID", 422);
      }
      if (!(await canAccessProject(guard.user, projectId))) {
        return fail("FORBIDDEN", "You do not have access to this project", 403);
      }
      filters.push({ projectId });
    }
    if (status) filters.push({ status });
    const query = filters.length ? { $and: filters } : {};

    const tasks = await Task.find(query)
      .populate("projectId", "name projectCode")
      .populate("assignedTo", "fullName username role")
      .sort({ dueDate: 1 })
      .limit(100);

    return ok({ items: tasks });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("TASK_CREATE", request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, taskSchema);
    await connectToDatabase();

    if (!(await canAccessProject(guard.user, input.projectId))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }

    const task = await Task.create({
      ...input,
      createdBy: guard.user.id,
    });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "TASK_CREATED",
      entity: "Task",
      entityId: task.id,
      projectId: input.projectId,
      newValue: { title: task.title, status: task.status, priority: task.priority },
    });

    return ok(task, "Task created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
