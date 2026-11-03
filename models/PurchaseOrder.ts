import { InferSchemaType, model, models, Schema } from "mongoose";

export const PURCHASE_TYPES = [
  "DIRECT_SITE_PURCHASE",
  "BULK_CONTRACT_PO",
  "EMERGENCY_REQUISITION",
  "SUBCONTRACT_MATERIAL",
  "EQUIPMENT_LEASE_PURCHASE",
] as const;

export const QUALITY_GRADES = [
  "GRADE_A_CERTIFIED",
  "GRADE_B_STANDARD",
  "GRADE_C_CONDITIONAL",
  "REJECTED",
  "PENDING_INSPECTION",
] as const;

const poItemSchema = new Schema(
  {
    materialId: { type: Schema.Types.ObjectId, ref: "Material" },
    materialName: { type: String, required: true },
    unitOfMeasure: { type: String, default: "units" },
    materialType: { type: String, default: "Structural Steel" },
    quantity: { type: Number, default: 1 },
    orderedQuantity: { type: Number, required: true, default: 1 },
    receivedQuantity: { type: Number, default: 0, min: 0 },
    acceptedQuantity: { type: Number, default: 0, min: 0 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    qualityGrade: {
      type: String,
      enum: QUALITY_GRADES,
      default: "PENDING_INSPECTION",
    },
    qualityScorePct: { type: Number, default: 100, min: 0, max: 100 },
    technicalSpec: { type: String, default: "" },
    labTestCertificateRef: { type: String, default: "" },
    inspectionNotes: { type: String, default: "" },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema(
  {
    poNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    materialRequestId: { type: Schema.Types.ObjectId, ref: "MaterialRequest" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    purchaseType: {
      type: String,
      enum: PURCHASE_TYPES,
      default: "BULK_CONTRACT_PO",
      index: true,
    },
    items: [poItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 }, // ETB
    currency: { type: String, default: "ETB" },
    overallQualityScore: { type: Number, default: 100 },
    quantityFulfillmentPct: { type: Number, default: 0 },
    expectedDeliveryDate: { type: Date, required: true },
    deliveryAddress: { type: String, required: true },
    paymentTerms: { type: String, default: "Net 30" },
    status: {
      type: String,
      enum: ["DRAFT", "ISSUED", "PARTIALLY_DELIVERED", "COMPLETED", "CANCELLED"],
      default: "DRAFT",
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ projectId: 1, createdAt: -1 });
purchaseOrderSchema.index({ supplierId: 1, status: 1 });

export type PurchaseOrderDocument = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrder =
  models.PurchaseOrder || model("PurchaseOrder", purchaseOrderSchema);
