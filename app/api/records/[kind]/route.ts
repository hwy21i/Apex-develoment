import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { operationalSchema } from "@/lib/validation/schemas";
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

    return ok(record, "Record created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
