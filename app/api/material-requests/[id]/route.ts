import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { materialRequestDecisionSchema } from "@/lib/validation/schemas";
import { canAccessProject } from "@/lib/services/access";
import { MaterialRequest } from "@/models/MaterialRequest";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission("MATERIAL_REQUEST_APPROVE", request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!mongoose.isObjectIdOrHexString(id)) return fail("VALIDATION_ERROR", "Invalid request ID", 422);

  try {
    const input = await body(request, materialRequestDecisionSchema);
    await connectToDatabase();
    const requestRecord = await MaterialRequest.findById(id);
    if (!requestRecord) return fail("NOT_FOUND", "Material request not found", 404);
    if (!(await canAccessProject(guard.user, String(requestRecord.projectId)))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }
    if (requestRecord.status !== "SUBMITTED") {
      return fail("CONFLICT", "Only submitted requests can be approved or rejected", 409);
    }

    requestRecord.status = input.status;
    requestRecord.approvedBy = new mongoose.Types.ObjectId(guard.user.id);
    requestRecord.approvalNotes = input.approvalNotes;
    await requestRecord.save();
    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: input.status === "APPROVED" ? "MATERIAL_REQUEST_APPROVED" : "MATERIAL_REQUEST_REJECTED",
      entity: "MaterialRequest",
      entityId: requestRecord.id,
      projectId: String(requestRecord.projectId),
      newValue: { status: input.status },
    });
    return ok(requestRecord, `Material request ${input.status.toLowerCase()}`);
  } catch (error) {
    return handleError(error);
  }
}
