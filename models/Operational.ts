import { Schema, model, models } from "mongoose";
const operationalSchema = new Schema({ projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true }, kind: { type: String, required: true, index: true }, status: { type: String, index: true }, title: String, data: { type: Schema.Types.Mixed, default: {} }, createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true } }, { timestamps: true });
operationalSchema.index({ projectId: 1, kind: 1, createdAt: -1 });
export const Operational = models.Operational || model("Operational", operationalSchema);
