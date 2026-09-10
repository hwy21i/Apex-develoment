import { Schema, model, models } from "mongoose";
const schema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, action: { type: String, required: true }, entityType: { type: String, required: true }, entityId: String, projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true }, oldValue: Schema.Types.Mixed, newValue: Schema.Types.Mixed, ipAddress: String }, { timestamps: { createdAt: "timestamp", updatedAt: false } });
export const ActivityLog = models.ActivityLog || model("ActivityLog", schema);
