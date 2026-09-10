import { InferSchemaType, model, models, Schema } from "mongoose";

const countrySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    countryCode: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true }, // e.g. "ET"
    isoCode: { type: String, trim: true, uppercase: true }, // e.g. "ETH"
    phoneCode: { type: String, required: true, trim: true }, // e.g. "+251"
    currency: { type: String, required: true, trim: true }, // e.g. "Ethiopian Birr"
    currencyCode: { type: String, required: true, trim: true, uppercase: true }, // e.g. "ETB"
    currencySymbol: { type: String, required: true, trim: true }, // e.g. "Br"
    timeZone: { type: String, required: true, trim: true, default: "Africa/Addis_Ababa" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

countrySchema.index({ name: 1, status: 1 });

export type CountryDocument = InferSchemaType<typeof countrySchema>;
export const Country = models.Country || model("Country", countrySchema);

