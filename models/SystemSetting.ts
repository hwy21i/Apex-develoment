import { InferSchemaType, model, models, Schema } from "mongoose";

const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ["GENERAL", "FINANCE", "INVENTORY", "NOTIFICATIONS", "SECURITY"],
      default: "GENERAL",
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type SystemSettingDocument = InferSchemaType<typeof systemSettingSchema>;
export const SystemSetting =
  models.SystemSetting || model("SystemSetting", systemSettingSchema);

