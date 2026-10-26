import { InferSchemaType, model, models, Schema } from "mongoose";

export const MATERIAL_REQUEST_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "ORDERED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
] as const;

const requestItemSchema = new Schema(
  {
    materialId: { type: Schema.Types.ObjectId, ref: "Material" },
    materialName: { type: String, required: true, trim: true },
    unitOfMeasure: { type: String, required: true, trim: true },
    specifications: { type: String, trim: true }, // Grade, strength, dimensions, brand
    requestedQuantity: { type: Number, required: true, min: 0.01 },
    approvedQuantity: { type: Number, min: 0 },
    estimatedUnitCost: { type: Number, min: 0, default: 0 }, // in ETB
    totalEstimatedCost: { type: Number, min: 0, default: 0 }, // in ETB
  },
  { _id: false }
);

const materialRequestSchema = new Schema(
  {
    requestNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    requiredByDate: { type: Date, required: true },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
    items: [requestItemSchema],
    totalEstimatedCost: { type: Number, default: 0, min: 0 },
    budgetStatus: {
      type: String,
      enum: ["WITHIN_BUDGET", "BUDGET_WARNING", "BUDGET_EXCEEDED"],
      default: "WITHIN_BUDGET",
    },
    status: {
      type: String,
      enum: MATERIAL_REQUEST_STATUSES,
      default: "DRAFT",
      index: true,
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvalNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    reason: { type: String, required: true, trim: true },
    convertedToPoId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder" },
  },
  { timestamps: true }
);

materialRequestSchema.index({ projectId: 1, status: 1 });
materialRequestSchema.index({ requestedBy: 1, createdAt: -1 });

export type MaterialRequestDocument = InferSchemaType<typeof materialRequestSchema>;
export const MaterialRequest =
  models.MaterialRequest || model("MaterialRequest", materialRequestSchema);
