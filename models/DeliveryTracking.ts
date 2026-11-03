import { InferSchemaType, model, models, Schema } from "mongoose";

export const DELIVERY_STATUSES = [
  "ORDER_CONFIRMED",
  "AT_SUPPLIER_HUB",
  "DISPATCHED",
  "IN_TRANSIT_CHECKPOINT",
  "ARRIVED_AT_SITE",
  "INSPECTED_AND_STORED",
  "DELAYED",
] as const;

export const CHECKPOINT_CONDITIONS = ["INTACT", "MINOR_VARIANCE", "DAMAGED"] as const;

const checkpointSchema = new Schema(
  {
    stage: { type: String, required: true },
    locationName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    statusNote: { type: String, default: "" },
    loggedBy: { type: String, default: "Site Logistics Lead" },
    conditionOnCheck: {
      type: String,
      enum: CHECKPOINT_CONDITIONS,
      default: "INTACT",
    },
  },
  { _id: true }
);

const deliveryTrackingSchema = new Schema(
  {
    trackingNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder" },
    poNumber: { type: String, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    purchaseType: { type: String, default: "BULK_CONTRACT_PO" },
    materialSummary: { type: String, default: "Structural Rebar & Aggregate" },
    carrierName: { type: String, default: "Trans-Ethiopia Freight Logistics" },
    driverName: { type: String, default: "Kassahun Tadesse" },
    driverPhone: { type: String, default: "+251-911-234567" },
    vehiclePlate: { type: String, default: "ET-3-48192-AA" },
    originLocation: { type: String, default: "Mugher Cement Factory" },
    currentLocation: { type: String, default: "Modjo Dry Port Checkpoint" },
    destinationSite: { type: String, default: "The Place Apartment - Bole Site Gate" },
    status: {
      type: String,
      enum: DELIVERY_STATUSES,
      default: "IN_TRANSIT_CHECKPOINT",
      index: true,
    },
    progressPercentage: { type: Number, default: 65, min: 0, max: 100 },
    estimatedArrival: { type: Date, default: () => new Date(Date.now() + 86400000 * 2) },
    checkpoints: [checkpointSchema],
  },
  { timestamps: true }
);

deliveryTrackingSchema.index({ projectId: 1, createdAt: -1 });
deliveryTrackingSchema.index({ poNumber: 1 });

export type DeliveryTrackingDocument = InferSchemaType<typeof deliveryTrackingSchema>;
export const DeliveryTracking =
  models.DeliveryTracking || model("DeliveryTracking", deliveryTrackingSchema);
