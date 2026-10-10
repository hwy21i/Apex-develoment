import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { userUpdateSchema } from "@/lib/validation/schemas";
import { User } from "@/models/User";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only: update an existing account's role, status, or project assignments.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requirePermission("USER_MANAGE", request);
    if (authResult.error) return authResult.error;
    const { user: actor } = authResult;

    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return fail("VALIDATION_ERROR", "Invalid user ID", 422);
    }

    const input = await body(request, userUpdateSchema);
    await connectToDatabase();

    const existing = await User.findById(id).select("-passwordHash");
    if (!existing) {
      return fail("NOT_FOUND", "User not found", 404);
    }

    const previousValue = {
      role: existing.role,
      isActive: existing.isActive,
      assignedProjects: (existing.assignedProjects || []).map(String),
    };

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    )
      .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
      .populate("assignedProjects", "name projectCode")
      .lean();

    await logAudit({
      userId: actor.id,
      userName: actor.fullName,
      userRole: actor.role,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      previousValue,
      newValue: {
        role: updated?.role,
        isActive: updated?.isActive,
        assignedProjects: updated?.assignedProjects,
      },
    });

    return ok({ user: updated }, "User updated successfully");
  } catch (error) {
    return handleError(error);
  }
}
