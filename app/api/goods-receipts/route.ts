import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GoodsReceipt } from "@/models/GoodsReceipt";
import { InventoryTransaction } from "@/models/InventoryTransaction";
import { Material } from "@/models/Material";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { Project } from "@/models/Project";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/services/audit";
import { canAccessProject } from "@/lib/services/access";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission("GOODS_RECEIPT_VIEW", request);
    if (authResult.error) {
      return authResult.error;
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const warehouseId = searchParams.get("warehouseId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const filter: Record<string, unknown> = {};
    if (projectId) {
      if (!(await canAccessProject(authResult.user, projectId))) {
        return NextResponse.json({ success: false, error: "You do not have access to this project" }, { status: 403 });
      }
      filter.projectId = projectId;
    } else if (authResult.user.role !== "Admin") {
      filter.projectId = {
        $in: await Project.find({ $or: [{ projectManager: authResult.user.id }, { teamMembers: authResult.user.id }] }).distinct("_id"),
      };
    }
    if (warehouseId) filter.warehouseId = warehouseId;

    const receipts = await GoodsReceipt.find(filter)
      .populate("purchaseOrderId", "poNumber status")
      .populate("supplierId", "name contactPerson")
      .populate("warehouseId", "name location")
      .populate("projectId", "name code")
      .sort({ receiptDate: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: receipts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve goods receipts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("GOODS_RECEIPT_CREATE", request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const body = await request.json();

    const {
      purchaseOrderId,
      projectId,
      warehouseId,
      supplierId,
      items,
      deliveryNoteNumber,
      carrierName,
      vehicleNumber,
    } = body;

    if (!purchaseOrderId || !projectId || !warehouseId || !supplierId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required goods receipt fields or items" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (!(await canAccessProject(user, projectId))) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this project" },
        { status: 403 }
      );
    }

    const ids = [purchaseOrderId, projectId, warehouseId, supplierId, ...items.map((item) => item.materialId)];
    const invalidItem = items.some((item) =>
      !Number.isFinite(item.receivedQuantity) || item.receivedQuantity <= 0 ||
      !Number.isFinite(item.unitPrice) || item.unitPrice < 0
    );
    if (!ids.every((id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id)) || invalidItem) {
      return NextResponse.json(
        { success: false, error: "Invalid goods receipt identifiers, quantities, or prices" },
        { status: 422 }
      );
    }

    // Auto-generate sequential GRN number
    const grnNumber = `GRN-${new Date().getFullYear()}-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;

    // 1. Create the GoodsReceipt record
    const newReceipt = await GoodsReceipt.create({
      grnNumber,
      purchaseOrderId,
      projectId,
      warehouseId,
      supplierId,
      items,
      deliveryNoteNumber,
      carrierName,
      vehicleNumber,
      status: "POSTED",
      inspectedBy: user.id,
      receivedBy: user.id,
      receiptDate: new Date(),
    });

    // 2. Automatically update Inventory and record InventoryTransactions for each item received
    for (const item of items) {
      if (item.receivedQuantity && item.receivedQuantity > 0) {
        // Record immutable ledger entry
        await InventoryTransaction.create({
          transactionType: "PURCHASE_RECEIPT",
          materialId: item.materialId,
          warehouseId,
          projectId,
          quantity: item.receivedQuantity,
          unitCost: item.unitPrice,
          totalValue: item.receivedQuantity * item.unitPrice,
          referenceDocNumber: grnNumber,
          notes: `Goods received against PO on ${new Date().toISOString()}`,
          performedBy: user.id,
        });

        // Increment currentStock on Material
        await Material.findByIdAndUpdate(item.materialId, {
          $inc: { currentStock: item.receivedQuantity },
        });
      }
    }

    // 3. Update PurchaseOrder status if needed
    try {
      const po = await PurchaseOrder.findById(purchaseOrderId);
      if (po && po.status !== "Received") {
        await PurchaseOrder.findByIdAndUpdate(purchaseOrderId, {
          status: "Received",
        });
      }
    } catch {
      // PO update non-fatal
    }

    // 4. Record security audit log
    await logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: "CREATE",
      entity: "GoodsReceipt",
      entityId: newReceipt._id.toString(),
      projectId,
      newValue: {
        grnNumber,
        purchaseOrderId,
        itemCount: items.length,
        status: "POSTED",
      },
    });

    return NextResponse.json(
      { success: true, data: newReceipt, message: "Goods Receipt posted and stock ledger updated." },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to post goods receipt" },
      { status: 500 }
    );
  }
}
