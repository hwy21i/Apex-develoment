import { InferSchemaType, model, models, Schema } from "mongoose";

const equipmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    equipmentCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Earthmoving (Excavators, Bulldozers)",
        "Lifting & Cranes",
        "Concrete Equipment (Mixers, Pumps)",
        "Compactors & Rollers",
        "Hauling (Dump Trucks)",
        "Power & Generators",
        "Surveying & Testing",
        "Hand & Power Tools",
      ],
      default: "Earthmoving (Excavators, Bulldozers)",
      index: true,
    },
    serialNumber: { type: String, trim: true },
    purchaseDate: { type: Date },
    purchaseCost: { type: Number, min: 0 },
    currentValue: { type: Number, min: 0 },
    hourlyOperatingRate: { type: Number, min: 0, default: 0 }, // for project cost allocation
    assignedProjectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    assignedOperatorId: { type: Schema.Types.ObjectId, ref: "Employee" },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDueDate: { type: Date },
    status: {
      type: String,
      enum: ["AVAILABLE", "IN_USE", "MAINTENANCE", "DAMAGED", "RETIRED"],
      default: "AVAILABLE",
      index: true,
    },
    location: { type: String, trim: true },
  },
  { timestamps: true }
);

equipmentSchema.index({ category: 1, status: 1 });

export type EquipmentDocument = InferSchemaType<typeof equipmentSchema>;
export const Equipment = models.Equipment || model("Equipment", equipmentSchema);

