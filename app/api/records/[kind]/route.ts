import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { operationalSchema, operationalUpdateSchema } from "@/lib/validation/schemas";
import { canAccessProject } from "@/lib/services/access";
import { Operational } from "@/models/Operational";
import { Project } from "@/models/Project";
import { logAudit } from "@/lib/services/audit";
import { Permission } from "@/types/erp";

const permissionsMap: Record<string, Permission> = {
  progress: "PROGRESS_LOG",
  tasks: "TASK_VIEW",
  milestones: "MILESTONE_VIEW",
  materials: "MATERIAL_VIEW",
  inventory: "INVENTORY_VIEW",
  warehouses: "WAREHOUSE_MANAGE",
  suppliers: "SUPPLIER_VIEW",
  procurement: "MATERIAL_REQUEST_VIEW",
  employees: "EMPLOYEE_VIEW",
  workers: "EMPLOYEE_VIEW",
  attendance: "ATTENDANCE_VIEW",
  equipment: "EQUIPMENT_VIEW",
  maintenance: "MAINTENANCE_LOG",
  budgets: "FINANCE_VIEW",
  expenses: "FINANCE_VIEW",
  invoices: "INVOICE_VIEW",
  payments: "FINANCE_VIEW",
  documents: "DOCUMENT_VIEW",
  notifications: "NOTIFICATION_VIEW",
  announcements: "NOTIFICATION_VIEW",
  issues: "PROJECT_UPDATE",
  safety: "PROGRESS_LOG",
  clients: "CLIENT_VIEW",
  reports: "REPORT_VIEW",
};

// Mutating an existing record often needs a stronger permission than reading it
// (e.g. approving a material request vs. merely viewing the queue).
const mutatePermissionsMap: Record<string, Permission> = {
  procurement: "MATERIAL_REQUEST_APPROVE",
  expenses: "EXPENSE_APPROVE",
  inventory: "INVENTORY_ADJUST",
  tasks: "TASK_UPDATE",
  milestones: "MILESTONE_MANAGE",
  progress: "PROGRESS_LOG",
  maintenance: "MAINTENANCE_LOG",
  issues: "PROJECT_UPDATE",
  safety: "PROGRESS_LOG",
};

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string }> }
) {
  const { kind } = await context.params;
  const permission = permissionsMap[kind] || "PROJECT_VIEW";
  const guard = await requirePermission(permission, request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const projectId = new URL(request.url).searchParams.get("projectId");
    const query: Record<string, unknown> = { kind };

    if (guard.user.role !== "Admin") {
      const projectIds = await Project.find({
        $or: [{ projectManager: guard.user.id }, { teamMembers: guard.user.id }],
      }).distinct("_id");
      query.projectId = { $in: projectIds };
    }

    if (projectId) {
      if (!(await canAccessProject(guard.user, projectId))) {
        return fail("FORBIDDEN", "You do not have access to this project", 403);
      }
      query.projectId = projectId;
    }

    const items = await Operational.find(query).sort({ createdAt: -1 }).limit(100);
    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ kind: string }> }
) {
  const { kind } = await context.params;
  const permission = permissionsMap[kind] || "PROJECT_UPDATE";
  const guard = await requirePermission(permission, request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, operationalSchema);
    await connectToDatabase();

    if (!(await canAccessProject(guard.user, input.projectId))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }

    const record = await Operational.create({
      ...input,
      kind,
      createdBy: guard.user.id,
    });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: `RECORD_${kind.toUpperCase()}_CREATED`,
      entity: "Operational",
      entityId: record.id,
      projectId: input.projectId,
    });

    if (["expenses", "progress", "milestones"].includes(kind)) {
      try {
        const { refreshProjectMetrics } = await import("@/lib/calculations/project");
        await refreshProjectMetrics(input.projectId);
      } catch {}
    }

    return ok(record, "Record created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ kind: string }> }
) {
  const { kind } = await context.params;
  const permission = mutatePermissionsMap[kind] || permissionsMap[kind] || "PROJECT_UPDATE";
  const guard = await requirePermission(permission, request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, operationalUpdateSchema);
    await connectToDatabase();

    const existing = await Operational.findOne({ _id: input.recordId, kind });
    if (!existing) {
      return fail("NOT_FOUND", "Record not found", 404);
    }

    if (!(await canAccessProject(guard.user, String(existing.projectId)))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }

    const set: Record<string, unknown> = {};
    if (input.status !== undefined) set.status = input.status;
    if (input.title !== undefined) set.title = input.title;
    if (input.data !== undefined) set.data = { ...existing.data, ...input.data };

    const previousStatus = existing.status;
    const record = await Operational.findByIdAndUpdate(
      input.recordId,
      { $set: set },
      { new: true, runValidators: true }
    );

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: `RECORD_${kind.toUpperCase()}_UPDATED`,
      entity: "Operational",
      entityId: record.id,
      projectId: String(existing.projectId),
      previousValue: { status: previousStatus },
      newValue: { status: record.status },
    });

    if (["expenses", "progress", "milestones"].includes(kind)) {
      try {
        const { refreshProjectMetrics } = await import("@/lib/calculations/project");
        await refreshProjectMetrics(String(existing.projectId));
      } catch {}
    }

    return ok(record, "Record updated successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ kind: string }> }
) {
  const { kind } = await context.params;
  const permission = mutatePermissionsMap[kind] || permissionsMap[kind] || "PROJECT_UPDATE";
  const guard = await requirePermission(permission, request);
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("recordId");
    if (!recordId) {
      return fail("BAD_REQUEST", "recordId is required", 400);
    }

    await connectToDatabase();
    const existing = await Operational.findOne({ _id: recordId, kind });
    if (!existing) {
      return fail("NOT_FOUND", "Record not found", 404);
    }

    if (!(await canAccessProject(guard.user, String(existing.projectId)))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }

    await Operational.findByIdAndDelete(recordId);

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: `RECORD_${kind.toUpperCase()}_DELETED`,
      entity: "Operational",
      entityId: recordId,
      projectId: String(existing.projectId),
      previousValue: { title: existing.title, status: existing.status },
    });

    if (["expenses", "progress", "milestones"].includes(kind)) {
      try {
        const { refreshProjectMetrics } = await import("@/lib/calculations/project");
        await refreshProjectMetrics(String(existing.projectId));
      } catch {}
    }

    return ok({ success: true }, "Record deleted successfully");
  } catch (error) {
    return handleError(error);
  }
}

