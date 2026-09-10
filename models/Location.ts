import { InferSchemaType, model, models, Schema } from "mongoose";

const locationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country", required: true, index: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", required: true, index: true },
    cityId: { type: Schema.Types.ObjectId, ref: "City", required: true, index: true },
    district: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    siteDescription: { type: String, trim: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

locationSchema.index({ countryId: 1, regionId: 1, cityId: 1 });

export type LocationDocument = InferSchemaType<typeof locationSchema>;
export const Location = models.Location || model("Location", locationSchema);

