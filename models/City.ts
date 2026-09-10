import { InferSchemaType, model, models, Schema } from "mongoose";

const citySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country", required: true, index: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", required: true, index: true },
    cityCode: { type: String, trim: true, uppercase: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

citySchema.index({ regionId: 1, name: 1 }, { unique: true });
citySchema.index({ countryId: 1, regionId: 1 });

export type CityDocument = InferSchemaType<typeof citySchema>;
export const City = models.City || model("City", citySchema);

