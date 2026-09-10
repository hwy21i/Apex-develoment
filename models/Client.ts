import { InferSchemaType, model, models, Schema } from "mongoose";

const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    companyName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country" },
    regionId: { type: Schema.Types.ObjectId, ref: "Region" },
    cityId: { type: Schema.Types.ObjectId, ref: "City" },
    address: { type: String, trim: true },
    taxId: { type: String, trim: true },
    paymentTerms: { type: String, trim: true, default: "Net 30" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

clientSchema.index({ name: 1, status: 1 });

export type ClientDocument = InferSchemaType<typeof clientSchema>;
export const Client = models.Client || model("Client", clientSchema);

