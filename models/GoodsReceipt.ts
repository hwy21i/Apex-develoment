import { InferSchemaType, model, models, Schema } from "mongoose";

const receiptItemSchema = new Schema(
  {
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    materialName: { type: String, required: true },
    orderedQuantity: { type: Number, required: true },
    receivedQuantity: { type: Number, required: true, min: 0 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    batchNumber: { type: String },
  },
  { _id: false }
);

const goodsReceiptSchema = new Schema(
  {
    grnNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    items: [receiptItemSchema],
    deliveryNoteNumber: { type: String, trim: true },
    carrierName: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true },
    receiptDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ["DRAFT", "INSPECTED", "POSTED", "REJECTED"],
      default: "POSTED",
      index: true,
    },
    inspectedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

goodsReceiptSchema.index({ purchaseOrderId: 1, receiptDate: -1 });

export type GoodsReceiptDocument = InferSchemaType<typeof goodsReceiptSchema>;
export const GoodsReceipt =
  models.GoodsReceipt || model("GoodsReceipt", goodsReceiptSchema);

