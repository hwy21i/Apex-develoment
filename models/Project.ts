import { InferSchemaType, model, models, Schema } from "mongoose";

const projectSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160, index: true },
  projectCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 40, unique: true, index: true },
  client: { type: String, required: true, trim: true, maxlength: 160, alias: "clientName" },
  location: { type: String, required: true, trim: true, maxlength: 200 }, description: { type: String, trim: true, maxlength: 3000 },
  projectManager: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, teamMembers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  startDate: { type: Date, required: true }, expectedEndDate: { type: Date, required: true, index: true, alias: "endDate" }, actualEndDate: Date,
  contractValue: { type: Number, min: 0, default: 0 }, totalBudget: { type: Number, required: true, min: 0, alias: "budget" }, revisedBudget: { type: Number, min: 0 }, amountSpent: { type: Number, default: 0, min: 0 }, committedCost: { type: Number, default: 0, min: 0 }, remainingBudget: { type: Number, default: 0 }, progressPercentage: { type: Number, default: 0, min: 0, max: 100, alias: "progress" },
  status: { type: String, enum: ["planning", "active", "on-hold", "completed", "cancelled"], default: "planning", index: true }, currentPhase: { type: String, maxlength: 100 }, healthStatus: { type: String, enum: ["ON_TRACK", "AT_RISK", "DELAYED", "CRITICAL"], default: "ON_TRACK" }, createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

projectSchema.index({ projectManager: 1, status: 1 });
export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export const Project = models.Project || model("Project", projectSchema);
