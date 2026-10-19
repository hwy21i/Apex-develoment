import { Schema, model, models, InferSchemaType } from "mongoose";

const projectPhaseSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    sequenceNumber: {
      type: Number,
      default: 1,
    },
    order: {
      type: Number,
      default: 1,
    },
    plannedStart: {
      type: Date,
    },
    plannedEnd: {
      type: Date,
    },
    actualStart: {
      type: Date,
    },
    actualEnd: {
      type: Date,
    },
    plannedPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    actualPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"],
      default: "NOT_STARTED",
      index: true,
    },
    assignedManager: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: "ProjectPhase",
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectPhaseSchema.index({ projectId: 1, sequenceNumber: 1 });

projectPhaseSchema.pre("save", function (this: {
  sequenceNumber?: number;
  order?: number;
  completionPercentage?: number;
  actualPercentage?: number;
}) {
  if (this.sequenceNumber !== undefined && (this.order === undefined || this.order === 1)) {
    this.order = this.sequenceNumber;
  } else if (this.order !== undefined && (this.sequenceNumber === undefined || this.sequenceNumber === 1)) {
    this.sequenceNumber = this.order;
  }
  if (this.completionPercentage !== undefined && (this.actualPercentage === undefined || this.actualPercentage === 0)) {
    this.actualPercentage = this.completionPercentage;
  } else if (this.actualPercentage !== undefined && (this.completionPercentage === undefined || this.completionPercentage === 0)) {
    this.completionPercentage = this.actualPercentage;
  }
});

export type ProjectPhaseDocument = InferSchemaType<typeof projectPhaseSchema>;
export const ProjectPhase =
  models.ProjectPhase || model("ProjectPhase", projectPhaseSchema);
