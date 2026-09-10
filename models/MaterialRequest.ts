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
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    materialName: { type: String, required: true },
    unitOfMeasure: { type: String, required: true },
    requestedQuantity: { type: Number, required: true, min: 1 },
    approvedQuantity: { type: Number, min: 0 },
    estimatedUnitCost: { type: Number, min: 0, default: 0 },
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
    status: {
      type: String,
      enum: MATERIAL_REQUEST_STATUSES,
      default: "DRAFT",
      index: true,
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvalNotes: { type: String, trim: true },
    reason: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

materialRequestSchema.index({ projectId: 1, status: 1 });

export type MaterialRequestDocument = InferSchemaType<typeof materialRequestSchema>;
export const MaterialRequest =
  models.MaterialRequest || model("MaterialRequest", materialRequestSchema);

