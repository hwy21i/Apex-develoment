import { InferSchemaType, model, models, Schema } from "mongoose";

const maintenanceSchema = new Schema(
  {
    equipmentId: { type: Schema.Types.ObjectId, ref: "Equipment", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    type: {
      type: String,
      enum: ["PREVENTIVE", "CORRECTIVE", "EMERGENCY", "INSPECTION"],
      default: "PREVENTIVE",
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    serviceDate: { type: Date, required: true },
    cost: { type: Number, required: true, min: 0 },
    serviceProvider: { type: String, trim: true },
    technicianName: { type: String, trim: true },
    partsReplaced: [{ type: String, trim: true }],
    nextServiceHours: { type: Number },
    status: {
      type: String,
      enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"],
      default: "COMPLETED",
    },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

maintenanceSchema.index({ equipmentId: 1, serviceDate: -1 });

export type MaintenanceDocument = InferSchemaType<typeof maintenanceSchema>;
export const Maintenance =
  models.Maintenance || model("Maintenance", maintenanceSchema);

