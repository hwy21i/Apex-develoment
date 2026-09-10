import { InferSchemaType, model, models, Schema } from "mongoose";

export const INVENTORY_TRANSACTION_TYPES = [
  "OPENING_STOCK",
  "PURCHASE_RECEIPT",
  "MATERIAL_ISSUE",
  "MATERIAL_RETURN",
  "STOCK_ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
] as const;

export type InventoryTransactionType = typeof INVENTORY_TRANSACTION_TYPES[number];

const inventoryTransactionSchema = new Schema(
  {
    transactionType: {
      type: String,
      enum: INVENTORY_TRANSACTION_TYPES,
      required: true,
      index: true,
    },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    toWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse" }, // for transfers
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true }, // for issues to a project
    quantity: { type: Number, required: true }, // positive for additions, negative or separate for deductions
    unitCost: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, required: true },
    referenceDocNumber: { type: String, trim: true }, // e.g. PO number, GRN number, Issue ticket
    notes: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryTransactionSchema.index({ materialId: 1, warehouseId: 1, createdAt: -1 });

export type InventoryTransactionDocument = InferSchemaType<typeof inventoryTransactionSchema>;
export const InventoryTransaction =
  models.InventoryTransaction || model("InventoryTransaction", inventoryTransactionSchema);

