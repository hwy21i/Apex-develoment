import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { materialRequestCreateSchema } from "@/lib/validation/schemas";
import { canAccessProject } from "@/lib/services/access";
import { MaterialRequest } from "@/models/MaterialRequest";
import { Material } from "@/models/Material";
import { Project } from "@/models/Project";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("MATERIAL_REQUEST_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const projectScope = guard.user.role === "Admin"
      ? {}
      : {
          projectId: {
            $in: await Project.find({
              $or: [{ projectManager: guard.user.id }, { teamMembers: guard.user.id }],
            }).distinct("_id"),
          },
        };
    const items = await MaterialRequest.find(projectScope)
      .populate("projectId", "name projectCode")
      .populate("requestedBy", "fullName username")
      .populate("items.materialId", "name unitOfMeasure")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("MATERIAL_REQUEST_CREATE", request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, materialRequestCreateSchema);
    await connectToDatabase();
    if (!(await canAccessProject(guard.user, input.projectId))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }
    const material = await Material.findById(input.materialId).select("name unitOfMeasure unitCost status");
    if (!material || material.status !== "ACTIVE") {
      return fail("NOT_FOUND", "Material not found or inactive", 404);
    }

    const requestRecord = await MaterialRequest.create({
      requestNumber: `MR-${Date.now().toString(36).toUpperCase()}`,
      projectId: input.projectId,
      requiredByDate: input.requiredByDate,
      priority: input.priority,
      items: [{
        materialId: material.id,
        materialName: material.name,
        unitOfMeasure: material.unitOfMeasure,
        requestedQuantity: input.requestedQuantity,
        estimatedUnitCost: material.unitCost,
      }],
      status: "SUBMITTED",
      requestedBy: guard.user.id,
      reason: input.reason,
    });
    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "MATERIAL_REQUEST_CREATED",
      entity: "MaterialRequest",
      entityId: requestRecord.id,
      projectId: input.projectId,
      newValue: { requestNumber: requestRecord.requestNumber, material: material.name },
    });
    return ok(requestRecord, "Material request submitted", 201);
  } catch (error) {
    return handleError(error);
  }
}
