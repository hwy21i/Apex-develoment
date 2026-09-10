import { InferSchemaType, model, models, Schema } from "mongoose";

const warehouseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country" },
    regionId: { type: Schema.Types.ObjectId, ref: "Region" },
    cityId: { type: Schema.Types.ObjectId, ref: "City" },
    address: { type: String, required: true, trim: true },
    capacityM3: { type: Number, min: 0 },
    managerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "FULL"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);

warehouseSchema.index({ code: 1, status: 1 });

export type WarehouseDocument = InferSchemaType<typeof warehouseSchema>;
export const Warehouse = models.Warehouse || model("Warehouse", warehouseSchema);

