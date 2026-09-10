import { InferSchemaType, model, models, Schema } from "mongoose";

const milestoneSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    dueDate: { type: Date, required: true },
    completionDate: { type: Date },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "ACHIEVED", "DELAYED"],
      default: "PENDING",
      index: true,
    },
    weightagePercentage: { type: Number, min: 0, max: 100, default: 0 },
    deliverables: [{ type: String, trim: true }],
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

milestoneSchema.index({ projectId: 1, dueDate: 1 });

export type MilestoneDocument = InferSchemaType<typeof milestoneSchema>;
export const Milestone = models.Milestone || model("Milestone", milestoneSchema);

