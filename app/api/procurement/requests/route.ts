import { connectToDatabase } from "@/lib/db/mongodb";
import { handleError, ok, fail } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { MaterialRequest } from "@/models/MaterialRequest";
import { Project } from "@/models/Project";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { Notification } from "@/models/Notification";
import { Operational } from "@/models/Operational";
import { logAudit } from "@/lib/services/audit";
import { canAccessProject, buildProjectAccessQuery } from "@/lib/services/access";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("MATERIAL_REQUEST_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

    const query: Record<string, unknown> = {};

    if (projectId) {
      if (!(await canAccessProject(guard.user, projectId))) {
        return fail("FORBIDDEN", "Access denied to the specified project.", 403);
      }
      query.projectId = projectId;
    } else if (
      guard.user.role !== "Admin" &&
      guard.user.role !== "Super Admin" &&
      guard.user.role !== "Company Admin"
    ) {
      const accessQuery = buildProjectAccessQuery(guard.user);
      const accessibleProjects = await Project.find(accessQuery).distinct("_id");
      query.projectId = { $in: accessibleProjects };
    }

    if (status && status !== "ALL") {
      query.status = status;
    }

    let items = await MaterialRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("projectId", "name projectCode budget totalBudget amountSpent committedCost")
      .populate("requestedBy", "fullName email username role")
      .populate("approvedBy", "fullName email username role")
      .lean();

    // Fallback: check legacy Operational procurement records if collection has 0 items
    if (items.length === 0 && (!status || status === "ALL")) {
      const legacy = await Operational.find({ kind: "procurement" }).limit(limit).lean();
      if (legacy.length > 0) {
        items = legacy.map((r) => ({
          _id: r._id,
          requestNumber: (r.data?.requestNumber || r.title || `REQ-${r._id.toString().slice(-6)}`) as string,
          projectId: r.projectId as unknown as typeof items[0]["projectId"],
          requiredByDate: (r.data?.requiredDate ? new Date(r.data.requiredDate) : r.createdAt) as Date,
          priority: (r.data?.priority || "MEDIUM") as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          items: ((r.data?.items || []) as Array<Record<string, unknown>>).map((it) => ({
            materialName: (it.name || it.materialName || "Material") as string,
            unitOfMeasure: (it.unit || it.unitOfMeasure || "units") as string,
            requestedQuantity: Number(it.quantityRequested || it.quantity || 1),
            estimatedUnitCost: Number(it.estimatedCost || it.unitCost || 0),
            totalEstimatedCost:
              Number(it.quantityRequested || 1) * Number(it.estimatedCost || it.unitCost || 0),
          })),
          totalEstimatedCost: Number(r.data?.totalEstimatedCost || 0),
          status: (r.status || r.data?.status || "DRAFT") as typeof items[0]["status"],
          requestedBy: { fullName: (r.data?.requestedBy || "Site Engineer") as string } as unknown as typeof items[0]["requestedBy"],
          reason: (r.data?.notes || "Operational Procurement") as string,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })) as unknown as typeof items;
      }
    }

    return ok({ items, count: items.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("MATERIAL_REQUEST_CREATE", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      projectId,
      requiredByDate,
      priority = "MEDIUM",
      items = [],
      reason,
      status = "SUBMITTED",
    } = body;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return fail("VALIDATION_ERROR", "Valid Project ID is required.", 400);
    }

    if (!(await canAccessProject(guard.user, projectId))) {
      return fail("FORBIDDEN", "You do not have access to submit requests for this project.", 403);
    }

    if (!Array.isArray(items) || items.length === 0) {
      return fail("VALIDATION_ERROR", "At least one line item is required.", 400);
    }

    if (!reason || !reason.trim()) {
      return fail("VALIDATION_ERROR", "Reason / Justification for material requisition is required.", 400);
    }

    // Process line items & quality specifications
    let totalEstimatedCost = 0;
    const processedItems = items.map((it: {
      materialId?: string;
      materialName: string;
      unitOfMeasure: string;
      specifications?: string;
      requestedQuantity: number | string;
      estimatedUnitCost?: number | string;
    }) => {
      const qty = Math.max(0.01, Number(it.requestedQuantity) || 1);
      const unitCost = Math.max(0, Number(it.estimatedUnitCost) || 0);
      const lineTotal = Math.round(qty * unitCost * 100) / 100;
      totalEstimatedCost += lineTotal;

      return {
        materialId: it.materialId && mongoose.Types.ObjectId.isValid(it.materialId) ? it.materialId : undefined,
        materialName: it.materialName.trim(),
        unitOfMeasure: it.unitOfMeasure.trim() || "pcs",
        specifications: it.specifications?.trim() || undefined,
        requestedQuantity: qty,
        estimatedUnitCost: unitCost,
        totalEstimatedCost: lineTotal,
      };
    });

    // Project budget verification
    const project = await Project.findById(projectId);
    let budgetStatus: "WITHIN_BUDGET" | "BUDGET_WARNING" | "BUDGET_EXCEEDED" = "WITHIN_BUDGET";

    if (project) {
      const budget = Number(project.budget || project.totalBudget || 0);
      const spent = Number(project.amountSpent || 0);
      const committed = Number(project.committedCost || 0);
      const remaining = Math.max(0, budget - spent - committed);

      if (budget > 0) {
        if (totalEstimatedCost > remaining) {
          budgetStatus = "BUDGET_EXCEEDED";
        } else if (totalEstimatedCost > remaining * 0.8) {
          budgetStatus = "BUDGET_WARNING";
        }
      }
    }

    const code = project?.projectCode || "APX";
    const requestNumber = `REQ-${code}-${Date.now().toString().slice(-5)}`;

    const newRequest = await MaterialRequest.create({
      requestNumber,
      projectId,
      requiredByDate: requiredByDate ? new Date(requiredByDate) : new Date(Date.now() + 7 * 86400000),
      priority,
      items: processedItems,
      totalEstimatedCost,
      budgetStatus,
      status: status === "DRAFT" ? "DRAFT" : "SUBMITTED",
      requestedBy: guard.user.id,
      reason: reason.trim(),
    });

    // In-app alert notification
    if (project?.projectManager) {
      await Notification.create({
        userId: project.projectManager,
        title: `New Material Request: ${requestNumber}`,
        message: `A requisition for ${processedItems.length} items (${totalEstimatedCost.toLocaleString()} ETB) was submitted for project ${project.name}.`,
        type: "MATERIAL_REQUEST",
        link: `/procurement/requests`,
        isRead: false,
      });
    }

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "MATERIAL_REQUEST_CREATE",
      entity: "MaterialRequest",
      entityId: newRequest._id.toString(),
      projectId,
      newValue: {
        requestNumber,
        totalEstimatedCost,
        budgetStatus,
        itemCount: processedItems.length,
      },
    });

    return ok(newRequest, "Requisition created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, action, approvalNotes, rejectionReason, supplierId, expectedDeliveryDate, deliveryAddress } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return fail("VALIDATION_ERROR", "Valid Material Request ID is required.", 400);
    }

    const matReq = await MaterialRequest.findById(id).populate("projectId");
    if (!matReq) {
      return fail("NOT_FOUND", "Material Request not found.", 404);
    }

    if (action === "SUBMIT") {
      const guard = await requirePermission("MATERIAL_REQUEST_CREATE", request);
      if (guard.error) return guard.error;

      matReq.status = "SUBMITTED";
      await matReq.save();
      return ok(matReq);
    }

    if (action === "APPROVE") {
      const guard = await requirePermission("MATERIAL_REQUEST_APPROVE", request);
      if (guard.error) return guard.error;

      // Self-approval protection
      if (
        matReq.requestedBy.toString() === guard.user.id.toString() &&
        guard.user.role !== "Super Admin" &&
        guard.user.role !== "Company Admin"
      ) {
        return fail(
          "FORBIDDEN",
          "Self-approval is strictly prohibited by company policy. Requisitions must be approved by an independent manager.",
          403
        );
      }

      matReq.status = "APPROVED";
      matReq.approvedBy = guard.user.id as unknown as mongoose.Schema.Types.ObjectId;
      matReq.approvalNotes = approvalNotes || undefined;
      await matReq.save();

      // Notify requester
      await Notification.create({
        userId: matReq.requestedBy,
        title: `Requisition Approved: ${matReq.requestNumber}`,
        message: `Your requisition ${matReq.requestNumber} was approved and is ready for purchase order generation.`,
        type: "MATERIAL_REQUEST",
        link: `/procurement/requests`,
        isRead: false,
      });

      await logAudit({
        userId: guard.user.id,
        userName: guard.user.fullName,
        userRole: guard.user.role,
        action: "MATERIAL_REQUEST_APPROVE",
        entity: "MaterialRequest",
        entityId: matReq._id.toString(),
        projectId: matReq.projectId?._id?.toString(),
        newValue: { requestNumber: matReq.requestNumber, approvalNotes },
      });

      return ok(matReq);
    }

    if (action === "REJECT") {
      const guard = await requirePermission("MATERIAL_REQUEST_APPROVE", request);
      if (guard.error) return guard.error;

      if (!rejectionReason || !rejectionReason.trim()) {
        return fail("VALIDATION_ERROR", "A formal reason for rejection is required.", 400);
      }

      matReq.status = "REJECTED";
      matReq.approvedBy = guard.user.id as unknown as mongoose.Schema.Types.ObjectId;
      matReq.rejectionReason = rejectionReason.trim();
      await matReq.save();

      // Notify requester
      await Notification.create({
        userId: matReq.requestedBy,
        title: `Requisition Rejected: ${matReq.requestNumber}`,
        message: `Your requisition ${matReq.requestNumber} was rejected. Reason: ${rejectionReason.trim()}`,
        type: "MATERIAL_REQUEST",
        link: `/procurement/requests`,
        isRead: false,
      });

      await logAudit({
        userId: guard.user.id,
        userName: guard.user.fullName,
        userRole: guard.user.role,
        action: "MATERIAL_REQUEST_REJECT",
        entity: "MaterialRequest",
        entityId: matReq._id.toString(),
        projectId: matReq.projectId?._id?.toString(),
        newValue: { requestNumber: matReq.requestNumber, rejectionReason },
      });

      return ok(matReq);
    }

    if (action === "CONVERT_TO_PO") {
      const guard = await requirePermission("PURCHASE_ORDER_CREATE", request);
      if (guard.error) return guard.error;

      if (matReq.status !== "APPROVED") {
        return fail("INVALID_STATE", "Only approved material requests can be converted into Purchase Orders.", 400);
      }

      if (!supplierId || !mongoose.Types.ObjectId.isValid(supplierId)) {
        return fail("VALIDATION_ERROR", "A valid supplier selection is required to issue a Purchase Order.", 400);
      }

      const poNumber = `PO-${Date.now().toString().slice(-6)}`;
      const poItems = matReq.items.map((it: {
        materialId?: mongoose.Schema.Types.ObjectId;
        materialName: string;
        unitOfMeasure: string;
        requestedQuantity: number;
        estimatedUnitCost: number;
        totalEstimatedCost: number;
      }) => ({
        materialId: it.materialId || new mongoose.Types.ObjectId(),
        materialName: it.materialName,
        unitOfMeasure: it.unitOfMeasure,
        quantity: it.requestedQuantity,
        unitPrice: it.estimatedUnitCost,
        totalPrice: it.totalEstimatedCost,
        receivedQuantity: 0,
      }));

      const newPo = await PurchaseOrder.create({
        poNumber,
        materialRequestId: matReq._id,
        projectId: matReq.projectId._id,
        supplierId,
        items: poItems,
        subtotal: matReq.totalEstimatedCost,
        taxAmount: 0,
        totalAmount: matReq.totalEstimatedCost,
        currency: "ETB",
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date(Date.now() + 14 * 86400000),
        deliveryAddress: deliveryAddress || "Main Site Warehouse, Addis Ababa",
        paymentTerms: "Net 30",
        status: "ISSUED",
        createdBy: guard.user.id,
      });

      // Update PR status
      matReq.status = "ORDERED";
      matReq.convertedToPoId = newPo._id;
      await matReq.save();

      // Update project committed cost
      if (matReq.projectId) {
        await Project.findByIdAndUpdate(matReq.projectId._id, {
          $inc: { committedCost: matReq.totalEstimatedCost },
        });
      }

      await logAudit({
        userId: guard.user.id,
        userName: guard.user.fullName,
        userRole: guard.user.role,
        action: "PO_CREATE",
        entity: "PurchaseOrder",
        entityId: newPo._id.toString(),
        projectId: matReq.projectId._id.toString(),
        newValue: {
          poNumber,
          materialRequestId: matReq._id.toString(),
          totalAmount: matReq.totalEstimatedCost,
        },
      });

      return ok({ purchaseOrder: newPo, materialRequest: matReq }, "Purchase Order generated successfully", 201);
    }

    return fail("BAD_REQUEST", "Unrecognized action requested.", 400);
  } catch (error) {
    return handleError(error);
  }
}

