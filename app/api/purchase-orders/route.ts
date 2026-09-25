import { connectToDatabase } from "@/lib/db/mongodb";
import { handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { Project } from "@/models/Project";
import { PurchaseOrder } from "@/models/PurchaseOrder";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("PURCHASE_ORDER_VIEW", request);
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
    const items = await PurchaseOrder.find(projectScope)
      .populate("projectId", "name projectCode")
      .populate("supplierId", "name contactPerson phone")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}
