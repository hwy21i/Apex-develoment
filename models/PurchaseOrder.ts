import { InferSchemaType, model, models, Schema } from "mongoose";

const poItemSchema = new Schema(
  {
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    materialName: { type: String, required: true },
    unitOfMeasure: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    receivedQuantity: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema(
  {
    poNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    materialRequestId: { type: Schema.Types.ObjectId, ref: "MaterialRequest" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    items: [poItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 }, // ETB
    currency: { type: String, default: "ETB" },
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

purchaseOrderSchema.index({ supplierId: 1, status: 1 });

export type PurchaseOrderDocument = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrder =
  models.PurchaseOrder || model("PurchaseOrder", purchaseOrderSchema);

