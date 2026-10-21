import { InferSchemaType, model, models, Schema } from "mongoose";

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160, index: true },
    projectCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 40, index: true },
    client: { type: String, trim: true, maxlength: 160 },
    clientName: { type: String, trim: true, maxlength: 160 },
    location: { type: String, trim: true, maxlength: 200, default: "Addis Ababa, Ethiopia" },
    latitude: { type: Number },
    longitude: { type: Number },
    city: { type: String, trim: true },
    region: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 3000 },
    projectManager: { type: Schema.Types.ObjectId, ref: "User", index: true },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    startDate: { type: Date },
    expectedEndDate: { type: Date, index: true },
    endDate: { type: Date },
    actualEndDate: { type: Date },
    contractValue: { type: Number, min: 0, default: 0 },
    totalBudget: { type: Number, min: 0, default: 0 },
    budget: { type: Number, min: 0 },
    revisedBudget: { type: Number, min: 0 },
    amountSpent: { type: Number, default: 0, min: 0 },
    committedCost: { type: Number, default: 0, min: 0 },
    remainingBudget: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    progress: { type: Number, min: 0, max: 100 },
    status: { type: String, default: "planning", index: true },
    currentPhase: { type: String, maxlength: 100 },
    healthStatus: { type: String, default: "ON_TRACK" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        // Ensure backward-compatible normalization for client
        if (!ret.client && ret.clientName) {
          ret.client = ret.clientName;
        }
        // Ensure backward-compatible normalization for budget
        if (ret.totalBudget === undefined && ret.budget !== undefined) {
          ret.totalBudget = ret.budget;
        }
        // Ensure backward-compatible normalization for dates
        if (!ret.expectedEndDate && ret.endDate) {
          ret.expectedEndDate = ret.endDate;
        }
        // Ensure backward-compatible normalization for progress
        if (ret.progressPercentage === undefined && ret.progress !== undefined) {
          ret.progressPercentage = ret.progress;
        }
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

projectSchema.index({ projectManager: 1, status: 1 });
projectSchema.index({ organizationId: 1, createdAt: -1 });

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export const Project = models.Project || model("Project", projectSchema);
