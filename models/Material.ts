import { InferSchemaType, model, models, Schema } from "mongoose";

const materialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Cement & Aggregates",
        "Steel & Rebar",
        "Masonry & Bricks",
        "Plumbing & Pipes",
        "Electrical & Lighting",
        "Timber & Formwork",
        "Finishing & Paints",
        "Safety Gear",
        "Hardware & Fasteners",
        "Other",
      ],
      default: "Cement & Aggregates",
      index: true,
    },
    unitOfMeasure: {
      type: String,
      required: true,
      enum: ["bags", "tons", "kg", "m3", "m2", "meters", "pieces", "liters", "rolls"],
      default: "pieces",
    },
    minimumStockLevel: { type: Number, required: true, min: 0, default: 10 },
    currentStock: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, required: true, min: 0 }, // in ETB
    preferredSupplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    defaultWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    description: { type: String, trim: true },
    status: { type: String, enum: ["ACTIVE", "DISCONTINUED"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);

materialSchema.index({ name: 1, category: 1 });

export type MaterialDocument = InferSchemaType<typeof materialSchema>;
export const Material = models.Material || model("Material", materialSchema);

