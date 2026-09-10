import { InferSchemaType, model, models, Schema } from "mongoose";

const supplierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "Building Materials" }, // e.g., Cement, Steel, Electrical, Heavy Equipment
    countryId: { type: Schema.Types.ObjectId, ref: "Country" },
    regionId: { type: Schema.Types.ObjectId, ref: "Region" },
    cityId: { type: Schema.Types.ObjectId, ref: "City" },
    address: { type: String, trim: true },
    taxNumber: { type: String, trim: true },
    paymentTerms: { type: String, trim: true, default: "Net 30" },
    rating: { type: Number, min: 1, max: 5, default: 4 },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED", "BLACKLISTED"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 1, status: 1 });

export type SupplierDocument = InferSchemaType<typeof supplierSchema>;
export const Supplier = models.Supplier || model("Supplier", supplierSchema);

