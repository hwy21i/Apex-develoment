import { connectToDatabase } from "@/lib/db/mongodb";
import { handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { Project } from "@/models/Project";
import { InventoryTransaction } from "@/models/InventoryTransaction";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("INVENTORY_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const query = guard.user.role === "Admin"
      ? {}
      : {
          projectId: {
            $in: await Project.find({
              $or: [{ projectManager: guard.user.id }, { teamMembers: guard.user.id }],
            }).distinct("_id"),
          },
        };
    const items = await InventoryTransaction.find(query)
      .populate("materialId", "name sku unitOfMeasure")
      .populate("warehouseId", "name code")
      .populate("toWarehouseId", "name code")
      .populate("projectId", "name projectCode")
      .populate("performedBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}
