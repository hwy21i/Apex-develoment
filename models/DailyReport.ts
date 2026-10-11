import { InferSchemaType, model, models, Schema } from "mongoose";

const dailyReportSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    reportNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    reportDate: { type: Date, required: true, default: Date.now, index: true },
    weatherConditions: { type: String, trim: true, maxlength: 100 },
    workforceHeadcount: { type: Number, default: 0, min: 0 },
    workCompleted: { type: String, required: true, trim: true, maxlength: 4000 },
    materialsDelivered: { type: String, trim: true, maxlength: 2000 },
    equipmentUsed: { type: String, trim: true, maxlength: 2000 },
    delaysOrIssues: { type: String, trim: true, maxlength: 2000 },
    safetyIncidents: { type: Number, default: 0, min: 0 },
    safetyNotes: { type: String, trim: true, maxlength: 2000 },
    preparedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

dailyReportSchema.index({ projectId: 1, reportDate: -1 });

export type DailyReportDocument = InferSchemaType<typeof dailyReportSchema>;
export const DailyReport =
  models.DailyReport || model("DailyReport", dailyReportSchema);

