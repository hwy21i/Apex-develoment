import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { taskSchema } from "@/lib/validation/schemas";
import { canAccessProject, buildProjectAccessQuery } from "@/lib/services/access";
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

    const query: Record<string, unknown> = mine ? { assignedTo: guard.user.id } : {};
    const isExecutive =
      guard.user.role === "Super Admin" ||
      guard.user.role === "Company Admin" ||
      guard.user.role === "Admin";

    if (!isExecutive) {
      const accessQuery = buildProjectAccessQuery(guard.user);
      const projectIds = await Project.find(accessQuery).distinct("_id");
      query.projectId = { $in: projectIds };
    }
    if (projectId) {
      if (!(await canAccessProject(guard.user, projectId))) {
        return fail("FORBIDDEN", "You do not have access to this project", 403);
      }
      query.projectId = projectId;
    }
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .populate("projectId", "name projectCode")
      .populate("assignedTo", "fullName username role")
      .populate("phaseId", "name sequenceNumber")
      .sort({ dueDate: 1 })
      .limit(100);

    return ok({ items: tasks });
  } catch (error) {
    return handleError(error);
  }
}

import { refreshProjectMetrics } from "@/lib/calculations/project";

async function hasCircularDependency(taskId: string, newDependencies: string[]): Promise<boolean> {
  const visited = new Set<string>();
  const queue = [...newDependencies];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const depTask = await Task.findById(current).select("dependencies").lean();
    if (depTask && Array.isArray(depTask.dependencies)) {
      for (const d of depTask.dependencies) {
        queue.push(d.toString());
      }
    }
  }

  return false;
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

    if (input.dependencies && input.dependencies.length > 0) {
      const validDeps = await Task.countDocuments({
        _id: { $in: input.dependencies },
        projectId: input.projectId,
      });
      if (validDeps !== input.dependencies.length) {
        return fail("VALIDATION_ERROR", "One or more dependencies are invalid or belong to another project", 422);
      }
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

    // Auto-refresh project progress
    try {
      await refreshProjectMetrics(input.projectId);
    } catch {}

    return ok(task, "Task created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePermission("TASK_UPDATE", request);
  if (guard.error) return guard.error;

  try {
    const json = await request.json();
    const { taskId, status, progress, priority, dependencies, title, description, phaseId, assignedTo, startDate, dueDate, notes } = json;
    if (!taskId) {
      return fail("BAD_REQUEST", "taskId is required", 400);
    }

    await connectToDatabase();
    const task = await Task.findById(taskId);
    if (!task) {
      return fail("NOT_FOUND", "Task not found", 404);
    }

    if (!(await canAccessProject(guard.user, String(task.projectId)))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }

    if (dependencies && Array.isArray(dependencies)) {
      if (await hasCircularDependency(taskId, dependencies)) {
        return fail("CIRCULAR_DEPENDENCY", "Circular dependency detected between tasks", 422);
      }
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (phaseId !== undefined) updates.phaseId = phaseId || null;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;
    if (typeof progress === "number") updates.progress = progress;
    if (priority !== undefined) updates.priority = priority;
    if (dependencies && Array.isArray(dependencies)) updates.dependencies = dependencies;
    if (status === "COMPLETED") updates.completedDate = new Date();

    const updated = await Task.findByIdAndUpdate(taskId, { $set: updates }, { new: true });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "TASK_UPDATED",
      entity: "Task",
      entityId: taskId,
      projectId: String(task.projectId),
      newValue: updates,
    });

    // Auto-refresh project progress
    try {
      await refreshProjectMetrics(String(task.projectId));
    } catch {}

    return ok(updated, "Task updated successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePermission("TASK_DELETE", request);
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      return fail("BAD_REQUEST", "taskId is required", 400);
    }

    await connectToDatabase();
    const task = await Task.findById(taskId);
    if (!task) {
      return fail("NOT_FOUND", "Task not found", 404);
    }

    if (!(await canAccessProject(guard.user, String(task.projectId)))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }

    await Task.findByIdAndDelete(taskId);

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "TASK_DELETED",
      entity: "Task",
      entityId: taskId,
      projectId: String(task.projectId),
      previousValue: { title: task.title },
    });

    return ok({ success: true }, "Task deleted successfully");
  } catch (error) {
    return handleError(error);
  }
}

