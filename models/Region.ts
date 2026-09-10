import { InferSchemaType, model, models, Schema } from "mongoose";

const regionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country", required: true, index: true },
    regionCode: { type: String, trim: true, uppercase: true }, // e.g. "AA", "OR"
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

regionSchema.index({ countryId: 1, name: 1 }, { unique: true });

export type RegionDocument = InferSchemaType<typeof regionSchema>;
export const Region = models.Region || model("Region", regionSchema);

